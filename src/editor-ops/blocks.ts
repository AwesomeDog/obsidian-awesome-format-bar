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

/** Inserts `---` after the paragraph, keeping the blank lines around it. */
export function insertHorizontalRule(
  doc: string,
  ranges: readonly Range[],
): Plan {
  const lines = new Lines(doc);
  const blocks = blocksFor(lines, ranges, "paragraph");
  const block = blocks[blocks.length - 1];
  if (!block) return NO_CHANGE;
  const [, end] = block;
  const at = lines.end(end);
  const tail = end + 1 < lines.count ? "\n\n---\n" : "\n\n---";
  return { changes: [{ from: at, to: at, text: tail }] };
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
