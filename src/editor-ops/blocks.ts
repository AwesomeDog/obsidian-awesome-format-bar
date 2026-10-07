import {
  NO_CHANGE,
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";
import {
  blocksFor,
  breakAfter,
  breakBefore,
  compareText,
  fenceMask,
  FENCE,
  Lines,
  removeLine,
  replaceBlock,
  type Block,
} from "./lines";

export type ParagraphAlignment = "left" | "center" | "right" | "justify";

const PARAGRAPH_ALIGNMENT_OPEN =
  /^<div style="text-align:\s*(left|center|right|justify)">$/;

/** Wraps whole paragraphs in a `text-align` div; the same value un-wraps. */
export function toggleParagraphAlignment(
  doc: string,
  ranges: readonly Range[],
  align: ParagraphAlignment,
): Plan {
  const lines = new Lines(doc);
  const changes: Change[] = [];

  for (const [a, b] of blocksFor(lines, ranges, "paragraph")) {
    const open = PARAGRAPH_ALIGNMENT_OPEN.exec(lines.at(a).trim());
    const wrapped = open !== null && b > a && lines.at(b).trim() === "</div>";

    if (wrapped && open[1] === align) {
      // Adjacent lines share a newline; removing them separately overlaps.
      if (b > a + 1) {
        changes.push(removeLine(lines, a));
        changes.push(removeLine(lines, b));
      } else {
        changes.push({ from: lines.start(a), to: lines.end(b), text: "" });
      }
      continue;
    }
    if (wrapped) {
      changes.push({
        from: lines.start(a),
        to: lines.end(a),
        text: `<div style="text-align: ${align}">`,
      });
      continue;
    }
    changes.push({
      from: lines.start(a),
      to: lines.start(a),
      text: `<div style="text-align: ${align}">\n`,
    });
    changes.push({ from: lines.end(b), to: lines.end(b), text: "\n</div>" });
  }
  return { changes: order(changes) };
}

export function insertCallout(
  doc: string,
  ranges: readonly Range[],
  type: string,
): Plan {
  const lines = new Lines(doc);
  const changes: Change[] = [];
  let select: Range | undefined;

  const blocks = blocksFor(lines, ranges, "collapsed-paragraph");
  for (const [a, b] of blocks) {
    const source: string[] = [];
    for (let line = a; line <= b; line++) source.push(lines.at(line));
    const empty = source.every((text) => text.trim() === "");
    const body = empty ? ["> "] : source.map((text) => `> ${text}`);
    const text = [`> [!${type}]`, ...body].join("\n");
    changes.push(replaceBlock(lines, a, b, text));
    if (empty && blocks.length === 1) {
      const caret = lines.start(a) + text.length;
      select = { from: caret, to: caret };
    }
  }
  return select
    ? { changes: order(changes), select }
    : { changes: order(changes) };
}

const HEADING = /^(#{1,6})\s/;

interface Section {
  level: number;
  /** The heading line, plus every line up to the next heading. */
  lines: string[];
  children: Section[];
}

/** The note's outline: its first heading through its last line of content. */
function outlineRange(lines: Lines): [number, number] | null {
  let inFence = false;
  let start = -1;
  let end = -1;
  for (let line = 0; line < lines.count; line++) {
    const text = lines.at(line);
    if (FENCE.test(text)) inFence = !inFence;
    if (inFence) continue;
    if (HEADING.test(text)) {
      if (start < 0) start = line;
      end = line;
    } else if (text.trim() !== "" && start >= 0) end = line;
  }
  return start < 0 ? null : [start, end];
}

/** Sections are cut at `#` markers; a quoted or fenced one stays body text. */
function parseSections(lines: Lines, from: number, to: number): Section[] {
  const roots: Section[] = [];
  const stack: Section[] = [];
  let inFence = false;

  for (let line = from; line <= to; line++) {
    const text = lines.at(line);
    if (FENCE.test(text)) inFence = !inFence;
    const marker = inFence ? null : HEADING.exec(text);
    if (!marker) {
      stack[stack.length - 1]?.lines.push(text);
      continue;
    }
    const level = (marker[1] ?? "").length;
    const section: Section = { level, lines: [text], children: [] };
    while (stack.length > 0 && (stack[stack.length - 1]?.level ?? 0) >= level)
      stack.pop();
    const parent = stack[stack.length - 1];
    (parent ? parent.children : roots).push(section);
    stack.push(section);
  }
  return roots;
}

function headingText(section: Section): string {
  return (section.lines[0] ?? "").replace(HEADING, "").trim();
}

function sortSections(sections: readonly Section[]): Section[] {
  return sections
    .map((section) => ({
      ...section,
      children: sortSections(section.children),
    }))
    .sort((a, b) => compareText(headingText(a), headingText(b)));
}

function flattenSections(sections: readonly Section[]): string[] {
  return sections.flatMap((section) => [
    ...section.lines,
    ...flattenSections(section.children),
  ]);
}

/** Reorders each level of the note's outline; a section keeps its own body. */
export function sortHeadings(doc: string): Plan {
  const lines = new Lines(doc);
  const range = outlineRange(lines);
  if (!range) return NO_CHANGE;
  const [start, end] = range;
  const source = lines.slice(start, end);
  const result = flattenSections(
    sortSections(parseSections(lines, start, end)),
  ).join("\n");
  return result === source
    ? NO_CHANGE
    : { changes: [replaceBlock(lines, start, end, result)] };
}

/** How to number the note's headings; `null` takes the numbers back off. */
export type HeadingNumbering = "outline" | "multilevel" | "roman" | null;

type NumberStyle = "1" | "a" | "i" | "A" | "I";

interface NumberingScheme {
  /** One style per level; a level past the end starts over from the first. */
  readonly styles: readonly NumberStyle[];
  /** Show the ancestors' numbers too: `1.1.` rather than a bare `a)`. */
  readonly path: boolean;
  /** Written right after the number, which is what makes a prefix findable. */
  readonly separator: string;
}

const NUMBERING_SCHEMES: Readonly<
  Record<Exclude<HeadingNumbering, null>, NumberingScheme>
> = {
  outline: { styles: ["1"], path: true, separator: "." },
  multilevel: { styles: ["1", "a", "i"], path: false, separator: ")" },
  roman: { styles: ["I", "A", "1"], path: false, separator: "." },
};

const ROMAN_STEPS: readonly (readonly [number, string])[] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function romanLetters(value: number): string {
  let out = "";
  let left = value;
  for (const [step, letters] of ROMAN_STEPS)
    while (left >= step) {
      out += letters;
      left -= step;
    }
  return out;
}

/** `1` is `a` and `27` is `aa`: Word carries on past `z` instead of stopping. */
function alphabetLetters(value: number, upper: boolean): string {
  let out = "";
  let left = value;
  while (left > 0) {
    out = String.fromCharCode((upper ? 65 : 97) + ((left - 1) % 26)) + out;
    left = Math.floor((left - 1) / 26);
  }
  return out;
}

function numberToken(style: NumberStyle, value: number): string {
  switch (style) {
    case "1":
      return String(value);
    case "a":
      return alphabetLetters(value, false);
    case "A":
      return alphabetLetters(value, true);
    case "i":
      return romanLetters(value).toLowerCase();
    case "I":
      return romanLetters(value);
  }
}

/**
 * A number this plugin wrote. Every scheme ends in `.` or `)`, so a heading
 * that only starts with a number — `## 2024 in review` — is left alone, and a
 * scheme can be swapped for another without stacking one on top of the first.
 */
const NUMBERED_HEADING =
  /^(#{1,6})[ \t]+(?:[0-9]+(?:\.[0-9]+)*\.|[IVXLCDM]+\.|[A-Z]\.|[0-9]+\)|[ivxlcdm]+\)|[a-z]\))[ \t]+/;

function numberingText(
  scheme: NumberingScheme,
  counters: readonly number[],
): string {
  const style = (index: number) =>
    scheme.styles[index % scheme.styles.length] ?? "1";
  const tokens = scheme.path
    ? counters.map((value, index) => numberToken(style(index), value))
    : [
        numberToken(
          style(counters.length - 1),
          counters[counters.length - 1] ?? 1,
        ),
      ];
  return `${tokens.join(".")}${scheme.separator} `;
}

/** Front matter comes first: a YAML comment `# note` is not a heading. */
function firstContentLine(lines: Lines): number {
  if (lines.count === 0 || lines.at(0).trim() !== "---") return 0;
  for (let line = 1; line < lines.count; line++) {
    const text = lines.at(line).trim();
    if (text === "---") return line + 1;
    // A `---` rule followed by a blank line starts the note; it holds no YAML.
    if (text === "") return 0;
  }
  return 0;
}

/**
 * Writes outline numbering on every heading of the note, or takes it off with
 * `null`. The whole note is the scope: numbering that stops at a selection
 * would carry on from the wrong number below it.
 */
export function numberHeadings(doc: string, scheme: HeadingNumbering): Plan {
  const lines = new Lines(doc);
  const changes: Change[] = [];
  const counters: number[] = [];
  let inFence = false;

  for (let line = firstContentLine(lines); line < lines.count; line++) {
    const text = lines.at(line);
    if (FENCE.test(text)) inFence = !inFence;
    const marker = inFence ? null : HEADING.exec(text);
    if (!marker) continue;

    const level = (marker[1] ?? "").length;
    while (counters.length > level) counters.pop();
    if (counters.length < level) {
      // A level skipped on the way down counts as `1` at every step, so `##`
      // then `####` is `1.1.1.` rather than `1.0.1.`
      while (counters.length < level) counters.push(1);
    } else {
      counters[level - 1] = (counters[level - 1] ?? 0) + 1;
    }

    const body = text.replace(NUMBERED_HEADING, "").replace(HEADING, "");
    const number =
      scheme === null ? "" : numberingText(NUMBERING_SCHEMES[scheme], counters);
    const next = `${marker[1]} ${number}${body.trim()}`;
    if (next !== text)
      changes.push({
        from: lines.start(line),
        to: lines.end(line),
        text: next,
      });
  }

  return changes.length === 0 ? NO_CHANGE : { changes: order(changes) };
}

/** One `- [[#Heading|Heading]]` per heading, indented two spaces per level. */
function outlineEntries(sections: readonly Section[], depth: number): string[] {
  return sections.flatMap((section) => {
    const text = headingText(section);
    const entry =
      text === "" ? [] : [`${"  ".repeat(depth)}- [[#${text}|${text}]]`];
    return [...entry, ...outlineEntries(section.children, depth + 1)];
  });
}

/** A note's outline as links, under a bold title, after the current paragraph. */
export function tableOfContents(
  doc: string,
  ranges: readonly Range[],
  title: string,
): Plan {
  const lines = new Lines(doc);
  const outline = outlineRange(lines);
  if (!outline) return NO_CHANGE;
  const [start, end] = outline;
  const entries = outlineEntries(parseSections(lines, start, end), 0);
  if (entries.length === 0) return NO_CHANGE;

  const blocks = blocksFor(lines, ranges, "paragraph");
  const block = blocks[blocks.length - 1];
  if (!block) return NO_CHANGE;
  const at = lines.end(block[1]);
  return {
    changes: [
      { from: at, to: at, text: `\n\n**${title}**\n\n${entries.join("\n")}` },
    ],
  };
}

/** Appends `^id` to the block under the cursor, Obsidian block-reference style. */
export function insertBlockReference(
  doc: string,
  ranges: readonly Range[],
  id: string,
): Plan {
  const lines = new Lines(doc);
  const blocks = blocksFor(lines, ranges, "collapsed-paragraph");
  const block = blocks[blocks.length - 1];
  if (!block) return NO_CHANGE;
  const [, end] = block;
  const text = lines.at(end);
  if (/\s\^[\w-]+$/.test(text)) return NO_CHANGE;
  const at = lines.end(end);
  return {
    changes: [
      { from: at, to: at, text: `${text.trim() === "" ? "" : " "}^${id}` },
    ],
  };
}

/**
 * The three parts of a drop cap, in one string so the whole thing travels in
 * the file: `float` is what makes the lines wrap around it, and the reduced
 * `line-height` is what lets them come back up beside it. Without the float
 * the first character is only large.
 */
function dropCapStyle(character: string): string {
  // A full-width glyph reads far larger than a latin one at the same `em`.
  const size = CJK.test(character) ? "2.2em" : "3.4em";
  return `float:left;font-size:${size};line-height:.85;padding-right:.06em`;
}

const DROP_CAP_OPEN = /^<span style="float:left[^"]*">([^<]*)<\/span>/;

const CJK =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

/** Only a letter or a digit can be dropped: no punctuation, no markers. */
const DROPPABLE = /[\p{L}\p{N}]/u;

/**
 * Markers that may sit in front of a paragraph's text. A drop cap written
 * before one of them is still a drop cap and can still be taken off, which is
 * why these come off before the search rather than ruling the line out.
 */
const BLOCK_PREFIX = /^(?:> ?(?:\[![\w-]+\]\s*)?|#{1,6}\s|[-*+]\s|\d+[.)]\s)+/;

/** `true` for the style a drop cap writes, whatever else it carries. */
export function isDropCapStyle(style: string): boolean {
  return /float:\s*left/.test(style);
}

/** The last line of the YAML front matter, or -1 when there is none. */
function frontmatterEnd(lines: Lines): number {
  if (lines.at(0).trim() !== "---") return -1;
  for (let line = 1; line < lines.count; line++)
    if (lines.at(line).trim() === "---") return line;
  return -1;
}

interface DropCapTarget {
  readonly line: number;
  /** Offset of the text's first character, markers stripped. */
  readonly at: number;
  readonly has: boolean;
}

function dropCapTargets(
  lines: Lines,
  fence: readonly boolean[],
  blocks: readonly Block[],
  frontmatter: number,
): DropCapTarget[] {
  const out: DropCapTarget[] = [];
  for (const [a, b] of blocks) {
    if (a <= frontmatter || fence[a]) continue;
    // An aligned paragraph is wrapped in a div; its text starts below it.
    let line = a;
    if (PARAGRAPH_ALIGNMENT_OPEN.test(lines.at(line).trim()) && b > line)
      line++;
    const text = lines.at(line);
    const marked = (BLOCK_PREFIX.exec(text)?.[0] ?? "").length;
    const at = lines.start(line) + marked;
    const rest = text.slice(marked);
    if (DROP_CAP_OPEN.test(rest)) {
      out.push({ line, at, has: true });
      continue;
    }
    // Adding never starts on a heading, a list item or a quote: a drop cap
    // belongs to running text. Taking one off still works there.
    if (marked > 0) continue;
    const character = Array.from(rest)[0];
    if (character === undefined || !DROPPABLE.test(character)) continue;
    out.push({ line, at, has: false });
  }
  return out;
}

/** Word's drop cap on the paragraph under the cursor, and off again. */
export function toggleDropCap(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const targets = dropCapTargets(
    lines,
    fenceMask(lines),
    blocksFor(lines, ranges, "paragraph"),
    frontmatterEnd(lines),
  );
  const first = targets[0];
  if (!first) return NO_CHANGE;

  // One direction for the whole selection. Unlike the alignments, which each
  // toggle on their own, a drop cap is a decoration on the paragraph: half
  // added and half removed is not a thing anyone asked for.
  const removing = first.has;
  const changes: Change[] = [];
  for (const target of targets) {
    if (target.has !== removing) continue;
    const rest = doc.slice(target.at, lines.end(target.line));
    if (removing) {
      const match = DROP_CAP_OPEN.exec(rest);
      if (!match) continue;
      changes.push({
        from: target.at,
        to: target.at + match[0].length,
        text: match[1] ?? "",
      });
      continue;
    }
    const character = Array.from(rest)[0] ?? "";
    changes.push({
      from: target.at,
      to: target.at + character.length,
      text: `<span style="${dropCapStyle(character)}">${character}</span>`,
    });
  }
  return { changes: order(changes) };
}

/** Every diagram type in the Mermaid Obsidian bundles, one command each. */
export type ChartKind =
  | "flowchart"
  | "sequence"
  | "class"
  | "state"
  | "er"
  | "journey"
  | "gantt"
  | "pie"
  | "quadrant"
  | "requirement"
  | "git-graph"
  | "mindmap"
  | "timeline"
  | "sankey"
  | "xychart"
  | "block"
  | "architecture"
  | "packet"
  | "kanban"
  | "radar"
  | "treemap"
  | "c4"
  | "ishikawa"
  | "venn";

/** A diagram has no empty form: an empty `mermaid` block renders as an error,
 * so each kind starts life as the smallest diagram of its kind that renders.
 * `{date}` is today, put in by `insertChartBlock`. */
const CHART_EXAMPLES: Readonly<Record<ChartKind, string>> = {
  flowchart: "flowchart LR\n  A --> B",
  sequence: "sequenceDiagram\n  Alice->>Bob: Hello\n  Bob-->>Alice: Hi",
  class: "classDiagram\n  Animal <|-- Duck",
  state: "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Busy\n  Busy --> [*]",
  er: "erDiagram\n  CUSTOMER ||--o{ ORDER : places",
  journey: "journey\n  title A day\n  section Morning\n    Wake up: 5: Me",
  gantt: "gantt\n  title Project\n  section Phase\n  Task :a1, {date}, 7d",
  pie: 'pie\n  "First" : 40\n  "Second" : 60',
  quadrant: [
    "quadrantChart",
    "  title Reach and effort",
    "  x-axis Low reach --> High reach",
    "  y-axis Low effort --> High effort",
    "  quadrant-1 We should expand",
    "  quadrant-2 Need to promote",
    "  quadrant-3 Re-evaluate",
    "  quadrant-4 May be improved",
    '  "Item A": [0.9, 0.2]',
  ].join("\n"),
  requirement: [
    "requirementDiagram",
    "  requirement r {",
    "    id: 1",
    "    text: the test text.",
    "    risk: high",
    "    verifymethod: test",
    "  }",
  ].join("\n"),
  "git-graph": "gitGraph\n  commit\n  branch feature\n  commit",
  mindmap: "mindmap\n  root((Root))\n    A\n    B",
  timeline: "timeline\n  title History\n  2026 : Something happened",
  sankey: "sankey-beta\n  A, B, 10\n  A, C, 20",
  xychart: [
    "xychart-beta",
    "  x-axis [1, 2, 3]",
    "  y-axis 0 --> 10",
    "  bar [3, 6, 9]",
    "  line [2, 5, 8]",
  ].join("\n"),
  block: "block-beta\n  columns 2\n  a\n  b\n  c",
  architecture: [
    "architecture-beta",
    "  group api(cloud)[API]",
    "  service db(database)[Database] in api",
    "  service app(server)[App] in api",
    "  app:R -- L:db",
  ].join("\n"),
  packet: 'packet-beta\n  0-15: "Source Port"\n  16-31: "Destination Port"',
  kanban: "kanban\n  Todo\n    Task A\n  Done\n    Task B",
  // The brace follows the label on the same line: Mermaid's radar grammar
  // has no newline there, and a line break is a parse error.
  radar: [
    "radar-beta",
    "  axis A, B, C",
    '  curve c1["One"]{ 0.8, 0.6, 0.9 }',
    '  curve c2["Two"]{ 0.5, 0.9, 0.4 }',
  ].join("\n"),
  treemap: [
    "treemap-beta",
    '  "Section 1"',
    '    "Leaf 1": 12',
    '    "Leaf 2": 8',
    '  "Section 2"',
    '    "Leaf 3": 5',
  ].join("\n"),
  c4: [
    "C4Context",
    "  title System Context",
    '  Person(customer, "Customer")',
    '  System(system, "System")',
    '  Rel(customer, system, "Uses")',
  ].join("\n"),
  ishikawa: [
    "ishikawa-beta",
    "  Blurry Photo",
    "  Process",
    "    Out of focus",
    "    Shutter speed too slow",
    "  User",
    "    Shaky hands",
  ].join("\n"),
  venn: [
    "venn-beta",
    '  title "Team overlap"',
    "  set Frontend",
    "  set Backend",
    '  union Frontend,Backend["APIs"]',
  ].join("\n"),
};

/** Insert a Mermaid diagram as a block of its own, replacing `ranges`. */
export function insertChartBlock(
  doc: string,
  ranges: readonly Range[],
  kind: ChartKind,
  today: string,
): Plan {
  const text =
    "```mermaid\n" + CHART_EXAMPLES[kind].replace("{date}", today) + "\n```";
  const list = normalizeRanges(ranges);
  const changes = list.map((range) => ({
    from: range.from,
    to: range.to,
    text:
      breakBefore(doc.slice(0, range.from)) +
      text +
      breakAfter(doc.slice(range.to)),
  }));
  const first = list[0];
  if (list.length !== 1 || !first) return { changes: order(changes) };
  // Inside the block, at the end of the last line: the fence is not for typing.
  const caret =
    first.from + breakBefore(doc.slice(0, first.from)).length + text.length - 4;
  return { changes, select: { from: caret, to: caret } };
}
