import { NO_CHANGE, order, type Change, type Plan, type Range } from "./plan";
import {
  blocksFor,
  compareText,
  FENCE,
  Lines,
  removeLine,
  replaceBlock,
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
