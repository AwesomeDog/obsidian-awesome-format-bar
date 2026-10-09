import { fenceMask, Lines } from "./lines";
import { highlightEmojiAt } from "../model/palettes";
import {
  NO_CHANGE,
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";

/** Un-wraps a pair that encloses only part of the selection. */
function enclosingPair(
  doc: string,
  range: Range,
  open: string,
  close: string,
): Range | null {
  if (
    range.from >= open.length &&
    doc.startsWith(open, range.from - open.length) &&
    doc.startsWith(close, range.to)
  )
    return { from: range.from - open.length, to: range.to + close.length };

  if (open === close) return null;
  const start = doc.lastIndexOf(open, range.from - open.length);
  if (start < 0) return null;
  const end = doc.indexOf(close, range.to);
  if (end < 0) return null;
  if (doc.slice(start + open.length, range.from).includes(close)) return null;
  if (doc.slice(range.to, end).includes(open)) return null;
  return { from: start, to: end + close.length };
}

/** Wraps each selection in `open`/`close`, or strips the pair if already there. */
export function toggleInlinePair(
  doc: string,
  ranges: readonly Range[],
  open: string,
  close: string,
): Plan {
  const list = normalizeRanges(ranges);
  const changes: Change[] = [];
  let select: Range | undefined;

  for (const range of list) {
    if (range.from === range.to) {
      changes.push({ from: range.from, to: range.to, text: open + close });
      if (list.length === 1) {
        const caret = range.from + open.length;
        select = { from: caret, to: caret };
      }
      continue;
    }

    const inner = doc.slice(range.from, range.to);
    if (
      inner.length > open.length + close.length &&
      inner.startsWith(open) &&
      inner.endsWith(close)
    ) {
      changes.push({
        from: range.from,
        to: range.from + open.length,
        text: "",
      });
      changes.push({ from: range.to - close.length, to: range.to, text: "" });
      continue;
    }

    const pair = enclosingPair(doc, range, open, close);
    if (pair) {
      changes.push({ from: pair.from, to: pair.from + open.length, text: "" });
      changes.push({ from: pair.to - close.length, to: pair.to, text: "" });
      continue;
    }

    changes.push({ from: range.from, to: range.from, text: open });
    changes.push({ from: range.to, to: range.to, text: close });
  }
  return select
    ? { changes: order(changes), select }
    : { changes: order(changes) };
}

/** Word's Select All: the whole note, the way Ctrl+A reads it. */
export function selectAll(doc: string): Plan {
  return { changes: [], selections: [{ from: 0, to: doc.length }] };
}

/** Word's Select Text with Similar Formatting: every run wearing what the
 * cursor wears.
 *
 * Two runs match on the mark and on what tells two of a kind apart — a
 * highlight's color, a span's style — so a red highlight never selects a
 * yellow one. Fenced code is not text to read, and neither is the inside of
 * a code span or of an inline formula: a `*` there is a `*`, not an emphasis.
 */
export function selectSimilarFormatting(
  doc: string,
  ranges: readonly Range[],
): Plan {
  const runs = inlineRuns(doc);

  let sample: InlineRun | null = null;
  for (const run of runs) {
    if (!ranges.some((range) => run.from <= range.to && run.to >= range.from))
      continue;
    // The innermost mark wins: at the italic inside a bold, that is the italic.
    if (!sample || run.to - run.from < sample.to - sample.from) sample = run;
  }
  if (!sample) return NO_CHANGE;
  const { kind, variant } = sample;

  return {
    changes: [],
    selections: runs
      .filter((run) => run.kind === kind && run.variant === variant)
      .map((run) => ({ from: run.from, to: run.to })),
  };
}

/** One run of inline formatting: the text between its marks. */
interface InlineRun extends Range {
  readonly kind: string;
  /** What tells two runs of a kind apart: a highlight's color, a span's style. */
  readonly variant: string;
}

function touches(ranges: readonly Range[], from: number, to: number): boolean {
  return ranges.some((range) => from < range.to && to > range.from);
}

/** Fenced code: nothing it holds is a mark, however it reads. */
function fencedRanges(doc: string): Range[] {
  const lines = new Lines(doc);
  const fenced = fenceMask(lines);
  const out: Range[] = [];
  let open = -1;
  for (let line = 0; line < lines.count; line++) {
    if (fenced[line]) {
      if (open < 0) open = lines.start(line);
      continue;
    }
    // The line above closed the block; `end` is its terminator.
    if (open >= 0) {
      out.push({ from: open, to: lines.end(line - 1) });
      open = -1;
    }
  }
  if (open >= 0) out.push({ from: open, to: doc.length });
  return out;
}

/** `**`, `~~` and `==`: one pattern each, all read the same way. */
const MARKED: readonly (readonly [RegExp, string, string])[] = [
  [/\*\*([\s\S]+?)\*\*/g, "**", "strong"],
  [/~~([\s\S]+?)~~/g, "~~", "strikethrough"],
  [/==([^=\n]+?)==/g, "==", "highlight"],
];

function markedRuns(doc: string, skip: readonly Range[]): InlineRun[] {
  const runs: InlineRun[] = [];
  for (const [pattern, delimiter, kind] of MARKED)
    for (const match of doc.matchAll(pattern)) {
      const start = match.index ?? 0;
      const from = start + delimiter.length;
      const to = from + (match[1] ?? "").length;
      if (touches(skip, start, from)) continue;
      if (touches(skip, to, to + delimiter.length)) continue;
      // A highlight wears its color as an emoji right after the opening `==`.
      const color = kind === "highlight" ? highlightEmojiAt(doc, from) : null;
      runs.push({
        from: color ? from + color.length : from,
        to,
        kind,
        variant: color ? color.hex : "",
      });
    }
  return runs;
}

const WORD_CHAR = /[\p{L}\p{N}]/u;
const WHITESPACE = /\s/;

/** `*`/`_` the way CommonMark reads them: neither opens before a space, and
 * `_` never emphasizes inside a word. */
function delimiterRuns(
  doc: string,
  skip: readonly Range[],
  delimiter: "*" | "_",
): InlineRun[] {
  const runs: InlineRun[] = [];
  const charAt = (at: number): string => doc[at] ?? "\n";
  const opens = (at: number): boolean =>
    !WHITESPACE.test(charAt(at + 1)) &&
    !(delimiter === "_" && WORD_CHAR.test(charAt(at - 1))) &&
    !touches(skip, at, at + 1);
  const closes = (at: number): boolean =>
    !WHITESPACE.test(charAt(at - 1)) &&
    !(delimiter === "_" && WORD_CHAR.test(charAt(at + 1))) &&
    !touches(skip, at, at + 1);

  let open = -1;
  for (let at = 0; at < doc.length; at++) {
    if (charAt(at) !== delimiter) continue;
    // Half of a `**` or `__`: that is strong, not this.
    if (charAt(at - 1) === delimiter || charAt(at + 1) === delimiter) continue;
    if (open < 0) {
      if (opens(at)) open = at + 1;
      continue;
    }
    if (!closes(at)) {
      open = opens(at) ? at + 1 : -1;
      continue;
    }
    runs.push({ from: open, to: at, kind: "emphasis", variant: "" });
    open = -1;
  }
  return runs;
}

const VERBATIM = /(`+)([\s\S]*?)\1|\$[^$\n]+?\$/g;

/** Code spans and inline formulas: read literally, and never scanned for
 * marks. They come back twice, because they are formatting to select and
 * spans to skip in the same pass. */
function verbatimRuns(
  doc: string,
  fences: readonly Range[],
): { runs: InlineRun[]; spans: Range[] } {
  const runs: InlineRun[] = [];
  const spans: Range[] = [];
  for (const match of doc.matchAll(VERBATIM)) {
    const start = match.index ?? 0;
    const to = start + (match[0] ?? "").length;
    if (touches(fences, start, to)) continue;
    spans.push({ from: start, to });
    const ticks = (match[1] ?? "").length;
    const from = start + (ticks || 1);
    runs.push({
      from,
      to: to - (ticks || 1),
      kind: ticks ? "code" : "math",
      variant: "",
    });
  }
  return { runs, spans };
}

const INLINE_TAG = /<(\/)?(span|u|sub|sup)\b[^>]*>/gi;
const SPAN_STYLE = /style="([^"]*)"/i;

/** The four wrappers this plugin writes: `<span>`, `<u>`, `<sub>`, `<sup>`. */
function tagRuns(doc: string, fences: readonly Range[]): InlineRun[] {
  const runs: InlineRun[] = [];
  interface Open {
    readonly name: string;
    readonly from: number;
    readonly to: number;
    readonly variant: string;
  }
  const stack: Open[] = [];

  for (const match of doc.matchAll(INLINE_TAG)) {
    const raw = match[0] ?? "";
    const from = match.index ?? 0;
    const name = (match[2] ?? "").toLowerCase();
    if (match[1] !== "/") {
      stack.push({
        name,
        from,
        to: from + raw.length,
        variant: name === "span" ? (SPAN_STYLE.exec(raw)?.[1] ?? "") : "",
      });
      continue;
    }
    const to = from + raw.length;
    let at = stack.length - 1;
    while (at >= 0 && stack[at]?.name !== name) at--;
    if (at < 0) continue;
    const open = stack.splice(at, 1)[0];
    if (!open) continue;
    if (touches(fences, open.from, to)) continue;
    runs.push({ from: open.to, to: from, kind: name, variant: open.variant });
  }
  return runs;
}

/** Every run of inline formatting in the note, outermost and innermost alike. */
function inlineRuns(doc: string): InlineRun[] {
  const fences = fencedRanges(doc);
  const verbatim = verbatimRuns(doc, fences);
  const skip = [...fences, ...verbatim.spans];
  return [
    ...markedRuns(doc, skip),
    ...delimiterRuns(doc, skip, "*"),
    ...delimiterRuns(doc, skip, "_"),
    ...verbatim.runs,
    ...tagRuns(doc, fences),
  ].sort((a, b) => a.from - b.from || a.to - b.to);
}
