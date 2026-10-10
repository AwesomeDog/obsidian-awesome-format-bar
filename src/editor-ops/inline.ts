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

/** Every run wearing what the cursor wears; a red highlight never selects a yellow one.
 * Fenced code, code spans and inline formulas are never scanned for marks. */
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
  readonly kind: InlineKind;
  /** What tells two runs of a kind apart: a highlight's color, a span's style. */
  readonly variant: string;
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

/** What a walk of the inline syntax can find. */
export type InlineKind =
  | "escape"
  | "code"
  | "math"
  | "bold"
  | "italic"
  | "strikethrough"
  | "highlight"
  | "underline"
  | "subscript"
  | "superscript"
  | "span";

/** One marker at one offset. `open` is absent where both directions read. */
export interface InlineMarker {
  readonly kind: InlineKind;
  readonly at: number;
  readonly length: number;
  readonly open?: boolean;
  /** On a tag: whether it closes one. */
  readonly closing?: boolean;
  /** The `style` of a `<span>`. */
  readonly style?: string;
  /** The hex a `==` carries as an emoji, if any. */
  readonly color?: string | null;
}

/** Whether the walk stands inside a code span or an inline formula. */
export interface VerbatimState {
  code: boolean;
  math: boolean;
}

const WORD_CHAR = /[\p{L}\p{N}]/u;
const WHITESPACE = /\s/;

/** `*` and `_` the way CommonMark reads them: neither opens before a space, and
 * `_` never emphasizes inside a word. `null` is no marker at all, `undefined`
 * is one that reads either way. */
function direction(
  doc: string,
  at: number,
  length: number,
): boolean | null | undefined {
  const before = doc[at - 1] ?? "\n";
  const after = doc[at + length] ?? "\n";
  const underscore = doc[at] === "_";
  const opens =
    !WHITESPACE.test(after) && !(underscore && WORD_CHAR.test(before));
  const closes =
    !WHITESPACE.test(before) && !(underscore && WORD_CHAR.test(after));
  if (!opens && !closes) return null;
  return opens === closes ? undefined : opens;
}

/** The marker starting at `at`, or `null`. The one reading of the inline syntax:
 * the runs below and the Format Painter both walk it. */
export function nextInlineMarker(
  doc: string,
  at: number,
  state: VerbatimState,
): InlineMarker | null {
  const ch = doc[at];
  if (ch === undefined) return null;
  if (ch === "\\") return { at, kind: "escape", length: 2 };

  const ticks = doc.startsWith("```", at) ? 3 : 1;
  if (state.code)
    return ch === "`" ? { at, kind: "code", length: ticks } : null;
  if (state.math) return ch === "$" ? { at, kind: "math", length: 1 } : null;
  if (ch === "`") return { at, kind: "code", length: ticks };
  if (ch === "$") return { at, kind: "math", length: 1 };

  if (ch === "*" || ch === "_") {
    const double = doc.startsWith(ch === "*" ? "**" : "__", at);
    const length = double ? 2 : 1;
    const open = direction(doc, at, length);
    return open === null
      ? null
      : { at, kind: double ? "bold" : "italic", length, open };
  }
  if (ch === "~")
    return doc.startsWith("~~", at)
      ? { at, kind: "strikethrough", length: 2 }
      : null;
  if (ch === "=") {
    if (!doc.startsWith("==", at)) return null;
    const emoji = highlightEmojiAt(doc, at + 2);
    return emoji === null
      ? { at, kind: "highlight", length: 2 }
      : { at, color: emoji.hex, kind: "highlight", length: 2 + emoji.length };
  }
  if (ch !== "<") return null;

  const tag = inlineTagAt(doc, at);
  if (!tag) return null;
  const length = tag.to - tag.from;
  if (tag.name === "span")
    return { at, closing: tag.closing, kind: "span", length, style: tag.style };
  const kind =
    tag.name === "u"
      ? "underline"
      : tag.name === "sub"
        ? "subscript"
        : "superscript";
  return { at, closing: tag.closing, kind, length };
}

let fenced: { doc: string; ranges: readonly Range[] } | null = null;

/** A walk stops at every fence, and they do not move while one runs. */
function fencesOf(doc: string): readonly Range[] {
  if (fenced?.doc !== doc) fenced = { doc, ranges: fencedRanges(doc) };
  return fenced.ranges;
}

/** Every marker of `doc[from..to)`, in order; fenced code is walked over.
 * `visit` returning false ends the walk. `verbatim` is where a walk that starts
 * mid-document stands; it is carried along as the walk goes. */
export function scanInline(
  doc: string,
  from: number,
  to: number,
  visit: (marker: InlineMarker) => boolean | void,
  verbatim?: VerbatimState,
): void {
  const fences = fencesOf(doc);
  const state: VerbatimState = verbatim ?? { code: false, math: false };
  const end = Math.min(to, doc.length);
  let at = Math.max(0, from);
  // Fences are in order and never overlap, so one index walks them.
  let next = 0;
  while (at < end) {
    while (next < fences.length && (fences[next]?.to ?? 0) <= at) next++;
    const fence = fences[next];
    if (fence && at >= fence.from) {
      at = fence.to;
      next++;
      continue;
    }
    const marker = nextInlineMarker(doc, at, state);
    if (!marker) {
      at++;
      continue;
    }
    if (visit(marker) === false) return;
    if (marker.kind === "code") state.code = !state.code;
    else if (marker.kind === "math") state.math = !state.math;
    at += marker.length;
  }
}

/** What tells two runs of a kind apart: a highlight's color, a span's style. */
function variantOf(marker: InlineMarker): string {
  if (marker.kind === "highlight") return marker.color ?? "";
  if (marker.kind === "span") return marker.style ?? "";
  return "";
}

/** Every run of inline formatting in the note, outermost and innermost alike. */
function inlineRuns(doc: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const open = new Map<InlineKind, InlineMarker[]>();

  scanInline(doc, 0, doc.length, (marker) => {
    if (marker.kind === "escape") return;
    const stack = open.get(marker.kind) ?? [];
    // A tag knows its direction; the rest toggle, so an empty stack opens.
    const opens =
      marker.open ??
      (marker.closing === undefined ? stack.length === 0 : !marker.closing);
    if (opens) {
      stack.push(marker);
      open.set(marker.kind, stack);
      return;
    }
    const start = stack.pop();
    if (!start) return;
    runs.push({
      from: start.at + start.length,
      kind: marker.kind,
      to: marker.at,
      variant: variantOf(start),
    });
  });

  return runs.sort((a, b) => a.from - b.from || a.to - b.to);
}

export const SPAN_CLOSE = "</span>";
export const SPAN_WHOLE = /^<span style="([^"]*)">([\s\S]*)<\/span>$/;

/** One of the four, as written in the note. */
export interface InlineTag {
  readonly from: number;
  readonly to: number;
  /** Lowercased: an HTML tag name carries its case in the file, not in meaning. */
  readonly name: string;
  readonly closing: boolean;
  /** The `style` attribute of a `<span>`; empty on the other three. */
  readonly style: string;
  /** The tag itself, markers included. */
  readonly raw: string;
}

const INLINE_TAG = /<(\/?)(span|u|sub|sup)\b[^>]*>/gi;
const SPAN_STYLE = /style="([^"]*)"/i;

function tagOf(match: RegExpMatchArray): InlineTag {
  const raw = match[0] ?? "";
  const from = match.index ?? 0;
  const name = (match[2] ?? "").toLowerCase();
  return {
    closing: match[1] === "/",
    from,
    name,
    raw,
    style: name === "span" ? (SPAN_STYLE.exec(raw)?.[1] ?? "") : "",
    to: from + raw.length,
  };
}

/** Every one of the four in `doc`, in document order. */
export function inlineTags(doc: string): InlineTag[] {
  // `matchAll` copies `lastIndex`, so it is set before the walk, not left over.
  INLINE_TAG.lastIndex = 0;
  return [...doc.matchAll(INLINE_TAG)].map(tagOf);
}

/** The one starting exactly at `at`, or `null` when none does. */
export function inlineTagAt(doc: string, at: number): InlineTag | null {
  INLINE_TAG.lastIndex = at;
  const match = INLINE_TAG.exec(doc);
  if (!match || match.index !== at) return null;
  return tagOf(match);
}

/** An opening tag with the closing tag that ended it. */
export interface InlineWrapper {
  readonly open: InlineTag;
  readonly close: InlineTag;
}

/** Pairs each closing tag with the last tag of its name still open; nearer wins.
 * `opens` rules a tag out of opening one; whatever is left comes back in `orphans`. */
export function pairTags(
  doc: string,
  opens: (tag: InlineTag) => boolean,
): { pairs: readonly InlineWrapper[]; orphans: readonly InlineTag[] } {
  const pairs: InlineWrapper[] = [];
  const orphans: InlineTag[] = [];
  const stack: InlineTag[] = [];

  for (const tag of inlineTags(doc)) {
    if (!tag.closing) {
      if (opens(tag)) stack.push(tag);
      continue;
    }

    let at = stack.length - 1;
    while (at >= 0 && stack[at]?.name !== tag.name) at--;
    if (at < 0) {
      orphans.push(tag);
      continue;
    }
    const open = stack.splice(at, 1)[0];
    if (open) pairs.push({ open, close: tag });
  }
  orphans.push(...stack);
  return { pairs, orphans };
}
