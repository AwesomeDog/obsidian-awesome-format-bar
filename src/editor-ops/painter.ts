import { isDropCapStyle } from "./blocks";
import { inlineTagAt, SPAN_CLOSE, SPAN_WHOLE } from "./inline";
import { highlightEmojiAt, nativeHighlightOf } from "../model/palettes";
import {
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";
import { styleValue, type SpanProperty } from "./spans";

/** What Format Painter copies: character formatting, and nothing else. */
export interface InlineFormat {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly strikethrough: boolean;
  readonly highlight: boolean;
  readonly underline: boolean;
  readonly subscript: boolean;
  readonly superscript: boolean;
  readonly color: string | null;
  readonly background: string | null;
  readonly fontSize: string | null;
  readonly fontFamily: string | null;
}

type PairKey =
  | "bold"
  | "italic"
  | "strikethrough"
  | "highlight"
  | "underline"
  | "subscript"
  | "superscript";

/** Outermost first: the order markers are written back in. */
const PAIRS = [
  { key: "bold", open: "**", close: "**" },
  { key: "italic", open: "*", close: "*" },
  { key: "strikethrough", open: "~~", close: "~~" },
  { key: "highlight", open: "==", close: "==" },
  { key: "underline", open: "<u>", close: "</u>" },
  { key: "subscript", open: "<sub>", close: "</sub>" },
  { key: "superscript", open: "<sup>", close: "</sup>" },
] as const satisfies readonly { key: PairKey; open: string; close: string }[];

const WORD = /[0-9A-Za-z]/;

interface Marker {
  readonly kind: PairKey | "span" | "code" | "math" | "escape";
  readonly at: number;
  readonly length: number;
  readonly closing?: boolean;
  readonly style?: string;
  /** On `==`: the color 1.14 writes as an emoji right after the marker. */
  readonly color?: string | null;
}

interface SpanOpen {
  readonly at: number;
  readonly end: number;
  readonly style: string;
}

interface ScanState {
  code: boolean;
  math: boolean;
  on: Record<PairKey, boolean>;
  openAt: Partial<Record<PairKey, { at: number; length: number }>>;
  spans: SpanOpen[];
  /**
   * Drop caps seen and not yet closed. Their tags still have to be walked
   * past, but they are not character formatting, so they never reach `spans`
   * — which is what keeps a drop cap's `3.4em` from leaving as a font size.
   */
  dropDepth: number;
  /** The color an `==` carries as an emoji, if any. */
  emoji: string | null;
}

function freshState(): ScanState {
  return {
    code: false,
    math: false,
    dropDepth: 0,
    on: {
      bold: false,
      italic: false,
      strikethrough: false,
      highlight: false,
      underline: false,
      subscript: false,
      superscript: false,
    },
    openAt: {},
    spans: [],
    emoji: null,
  };
}

function isWord(ch: string | undefined): boolean {
  return ch !== undefined && WORD.test(ch);
}

function nextMarker(doc: string, at: number, state: ScanState): Marker | null {
  const ch = doc[at];
  if (ch === undefined) return null;
  if (ch === "\\") return { kind: "escape", at, length: 2 };
  const fence = () => (doc.startsWith("```", at) ? 3 : 1);
  if (state.code)
    return ch === "`" ? { kind: "code", at, length: fence() } : null;
  if (state.math) return ch === "$" ? { kind: "math", at, length: 1 } : null;
  if (ch === "`") return { kind: "code", at, length: fence() };
  if (ch === "$") return { kind: "math", at, length: 1 };
  if (ch === "*")
    return doc.startsWith("**", at)
      ? { kind: "bold", at, length: 2 }
      : { kind: "italic", at, length: 1 };
  if (ch === "~")
    return doc.startsWith("~~", at)
      ? { kind: "strikethrough", at, length: 2 }
      : null;
  if (ch === "=") {
    if (!doc.startsWith("==", at)) return null;
    const emoji = highlightEmojiAt(doc, at + 2);
    return emoji === null
      ? { kind: "highlight", at, length: 2 }
      : {
          kind: "highlight",
          at,
          length: 2 + emoji.length,
          color: emoji.hex,
        };
  }
  if (ch === "_") {
    // `snake_case` is not emphasis.
    const double = doc.startsWith("__", at);
    if (isWord(doc[at - 1]) || isWord(doc[at + (double ? 2 : 1)])) return null;
    return double
      ? { kind: "bold", at, length: 2 }
      : { kind: "italic", at, length: 1 };
  }
  if (ch !== "<") return null;
  const tag = inlineTagAt(doc, at);
  if (!tag) return null;
  if (tag.name === "span")
    return {
      kind: "span",
      at,
      length: tag.to - tag.from,
      closing: tag.closing,
      style: tag.style,
    };
  const kind =
    tag.name === "u"
      ? "underline"
      : tag.name === "sub"
        ? "subscript"
        : "superscript";
  return { kind, at, length: tag.to - tag.from, closing: tag.closing };
}

function apply(state: ScanState, marker: Marker): void {
  switch (marker.kind) {
    case "escape":
      return;
    case "code":
      state.code = !state.code;
      return;
    case "math":
      state.math = !state.math;
      return;
    case "span":
      if (marker.closing) {
        if (state.dropDepth > 0) state.dropDepth--;
        else state.spans.pop();
        return;
      }
      if (isDropCapStyle(marker.style ?? "")) {
        state.dropDepth++;
        return;
      }
      state.spans.push({
        at: marker.at,
        end: marker.at + marker.length,
        style: marker.style ?? "",
      });
      return;
    default: {
      const on = !state.on[marker.kind];
      state.on[marker.kind] = on;
      if (on) {
        state.openAt[marker.kind] = { at: marker.at, length: marker.length };
        if (marker.kind === "highlight") state.emoji = marker.color ?? null;
      } else {
        delete state.openAt[marker.kind];
        if (marker.kind === "highlight") state.emoji = null;
      }
    }
  }
}

function paragraphStart(doc: string, at: number): number {
  if (at <= 0) return 0;
  const found = doc.lastIndexOf("\n\n", at - 1);
  return found < 0 ? 0 : found + 2;
}

function paragraphEnd(doc: string, at: number): number {
  const found = doc.indexOf("\n\n", at);
  return found < 0 ? doc.length : found;
}

/** A selection may carry its own markers: they are the format, not the text. */
function peelLayers(doc: string, range: Range, state: ScanState): Range {
  let inner = range;
  for (;;) {
    const pair = PAIRS.find(
      (candidate) =>
        inner.to - inner.from >
          candidate.open.length + candidate.close.length &&
        doc.startsWith(candidate.open, inner.from) &&
        doc.startsWith(candidate.close, inner.to - candidate.close.length),
    );
    if (pair) {
      const emoji =
        pair.key === "highlight" ? highlightEmojiAt(doc, inner.from + 2) : null;
      state.on[pair.key] = true;
      state.openAt[pair.key] = {
        at: inner.from,
        length: pair.open.length + (emoji?.length ?? 0),
      };
      if (pair.key === "highlight") state.emoji = emoji?.hex ?? null;
      inner = {
        from: inner.from + pair.open.length + (emoji?.length ?? 0),
        to: inner.to - pair.close.length,
      };
      continue;
    }
    const span = SPAN_WHOLE.exec(doc.slice(inner.from, inner.to));
    if (span && !isDropCapStyle(span[1] ?? "")) {
      // Whole match less the body and the close tag: just the open tag.
      const openLength =
        span[0].length - SPAN_CLOSE.length - (span[2] ?? "").length;
      state.spans.push({
        at: inner.from,
        end: inner.from + openLength,
        style: span[1] ?? "",
      });
      inner = {
        from: inner.from + openLength,
        to: inner.to - SPAN_CLOSE.length,
      };
      continue;
    }
    return inner;
  }
}

/** `range.from` sits inside every marker that is in force there. */
function capture(
  doc: string,
  range: Range,
): { state: ScanState; inner: Range } {
  const state = freshState();
  let at = paragraphStart(doc, range.from);
  while (at < range.from) {
    const marker = nextMarker(doc, at, state);
    if (!marker) {
      at++;
      continue;
    }
    apply(state, marker);
    at += marker.length;
  }
  return { state, inner: peelLayers(doc, range, state) };
}

/** Where `key` stops being in force, or `null` before the paragraph ends. */
function closingOffset(
  doc: string,
  state: ScanState,
  from: number,
  key: PairKey,
): { at: number; length: number } | null {
  const scan: ScanState = {
    ...state,
    on: { ...state.on },
    openAt: { ...state.openAt },
    spans: [...state.spans],
  };
  const end = paragraphEnd(doc, from);
  let at = from;
  while (at < end) {
    const marker = nextMarker(doc, at, scan);
    if (!marker) {
      at++;
      continue;
    }
    apply(scan, marker);
    if (marker.kind === key && !scan.on[key])
      return { at: marker.at, length: marker.length };
    at += marker.length;
  }
  return null;
}

/**
 * What the selection carries in its own text, sorted by where the runs end.
 * `whole` is a run that begins and ends inside it; `opened` begins inside and
 * carries on past the far edge; `closed` began before the near edge and ends
 * inside. A run that straddles an edge is reported rather than cut in half —
 * deleting one of its markers alone would leave the other dangling.
 */
interface Enclosed {
  readonly whole: Marker[];
  readonly opened: Marker[];
  readonly closed: Marker[];
}

function closeOf(key: Marker["kind"]): string {
  return PAIRS.find((pair) => pair.key === key)?.close ?? "";
}

function enclosedMarkers(
  doc: string,
  state: ScanState,
  from: number,
  to: number,
): Enclosed {
  const scan: ScanState = {
    ...state,
    on: { ...state.on },
    openAt: { ...state.openAt },
    spans: [...state.spans],
  };
  const pending = new Map<PairKey, Marker[]>();
  const openSpans: Marker[] = [];
  /** Drop caps opened in this walk: their close tags pair with these, not
   *  with `openSpans`, and neither is reported as a marker to cut. */
  let dropOpen = 0;
  const whole: Marker[] = [];
  const opened: Marker[] = [];
  const closed: Marker[] = [];
  let at = from;
  // On past `to` so a run that carries on is matched, not taken for a stray.
  const end = paragraphEnd(doc, from);
  while (at < end) {
    const marker = nextMarker(doc, at, scan);
    if (!marker) {
      at++;
      continue;
    }
    const within = marker.at >= from && marker.at + marker.length <= to;
    apply(scan, marker);
    at += marker.length;
    if (
      marker.kind === "escape" ||
      marker.kind === "code" ||
      marker.kind === "math"
    )
      continue;
    if (marker.kind === "span") {
      if (!marker.closing) {
        if (isDropCapStyle(marker.style ?? "")) dropOpen++;
        else if (within) openSpans.push(marker);
        continue;
      }
      if (dropOpen > 0) {
        dropOpen--;
        continue;
      }
      const open = openSpans.pop();
      if (!open) {
        if (within) closed.push(marker);
      } else if (within) whole.push(open, marker);
      else opened.push(open);
      continue;
    }
    const stack = pending.get(marker.kind) ?? [];
    // `apply` has just toggled the flag: on means this marker opened the run.
    if (scan.on[marker.kind]) {
      if (within) stack.push(marker);
      pending.set(marker.kind, stack);
      continue;
    }
    const open = stack.pop();
    pending.set(marker.kind, stack);
    if (!open) {
      if (within) closed.push(marker);
    } else if (within) whole.push(open, marker);
    else opened.push(open);
  }
  return { whole, opened, closed };
}

/** Markers opening on the selection's first character: that character's format. */
function leadingMarkers(doc: string, at: number, state: ScanState): void {
  let cursor = at;
  for (;;) {
    const marker = nextMarker(doc, cursor, state);
    if (!marker || marker.closing) return;
    if (
      marker.kind === "escape" ||
      marker.kind === "code" ||
      marker.kind === "math"
    )
      return;
    // `peelLayers` has already counted a marker wrapping the whole selection.
    const known =
      marker.kind === "span"
        ? state.spans.some((span) => span.at === marker.at)
        : state.on[marker.kind];
    if (!known) apply(state, marker);
    cursor += marker.length;
  }
}

/** Innermost wins: a nested span overrides the one around it. */
function spanProperty(
  spans: readonly SpanOpen[],
  property: SpanProperty,
): string | null {
  for (let i = spans.length - 1; i >= 0; i--) {
    const value = styleValue(spans[i]?.style ?? "", property);
    if (value) return value;
  }
  return null;
}

/** Written the way `setStyle` writes and `styleValue` reads: `name:value;…`. */
function styleText(style: {
  color: string | null;
  background: string | null;
  fontSize: string | null;
  fontFamily: string | null;
}): string {
  const parts: string[] = [];
  if (style.color) parts.push(`color:${style.color}`);
  if (style.background) parts.push(`background:${style.background}`);
  if (style.fontSize) parts.push(`font-size:${style.fontSize}`);
  if (style.fontFamily) parts.push(`font-family:${style.fontFamily}`);
  return parts.join(";");
}

function spanStyleOf(state: ScanState): string {
  return styleText({
    color: spanProperty(state.spans, "color"),
    background: spanProperty(state.spans, "background"),
    fontSize: spanProperty(state.spans, "font-size"),
    fontFamily: spanProperty(state.spans, "font-family"),
  });
}

export function captureFormat(doc: string, range: Range): InlineFormat {
  const { state } = capture(doc, range);
  // A selection may open on its own marker: `**bold** plain` starts bold even
  // though the marker sits inside the selection, not in front of it.
  leadingMarkers(doc, range.from, state);
  return {
    bold: state.on.bold,
    italic: state.on.italic,
    strikethrough: state.on.strikethrough,
    highlight: state.on.highlight,
    underline: state.on.underline,
    subscript: state.on.subscript,
    superscript: state.on.superscript,
    color: spanProperty(state.spans, "color"),
    background: spanProperty(state.spans, "background") ?? state.emoji,
    fontSize: spanProperty(state.spans, "font-size"),
    fontFamily: spanProperty(state.spans, "font-family"),
  };
}

/** Assigns `format` to every range: what the source lacks comes off the target. */
export function paintFormat(
  doc: string,
  ranges: readonly Range[],
  format: InlineFormat,
): Plan {
  const changes: Change[] = [];
  // A color Obsidian renders natively rides on the `==` marker, so it never
  // reaches the span: the two have to disagree for an existing background span
  // to be rewritten as a highlight rather than kept alongside one.
  const wantedStyle = styleText({
    ...format,
    background: nativeHighlightOf(format.background ?? "")
      ? null
      : format.background,
  });

  for (const range of normalizeRanges(ranges)) {
    if (range.from === range.to) continue;
    const { state, inner } = capture(doc, range);
    const open: string[] = [];
    const close: string[] = [];
    const cuts: Change[] = [];
    // A close marker starting on the tail rides on the tail change: two
    // changes at one offset would overlap, which CodeMirror rejects. Same at
    // the head, where the wanted markers are inserted.
    let tail = inner.to;
    let head = inner.from;

    const cut = (marker: { at: number; length: number }): void => {
      if (marker.at === inner.from) head = marker.at + marker.length;
      else
        cuts.push({ from: marker.at, to: marker.at + marker.length, text: "" });
    };
    const enclosed = enclosedMarkers(doc, state, inner.from, inner.to);
    const spans = [...state.spans];

    // Formatting that begins and ends inside the selection is part of its
    // text: it all comes off, so one format covers the whole selection.
    for (const marker of enclosed.whole) cut(marker);

    // A run the selection cuts in half keeps its formatting outside it: the
    // marker moves to the edge rather than disappearing. Word splits the run
    // the same way — only the selected characters change.
    for (const marker of enclosed.opened) {
      cut(marker);
      close.push(doc.slice(marker.at, marker.at + marker.length));
    }
    for (const marker of enclosed.closed) {
      cut(marker);
      open.unshift(marker.kind === "span" ? SPAN_CLOSE : closeOf(marker.kind));
      if (marker.kind === "span") spans.pop();
    }

    // A highlight carrying one of the native six carries its color in the
    // marker; any other color has no native syntax and goes out as a span,
    // like Highlight Color.
    const native = nativeHighlightOf(format.background ?? "");

    for (const pair of PAIRS) {
      const wanted =
        pair.key === "highlight"
          ? format.highlight && (!format.background || Boolean(native))
          : format[pair.key];
      // After the cuts above the selection wears `state.on[key]` uniformly,
      // unless a run ended inside it and was closed at the near edge instead.
      const carries =
        state.on[pair.key] &&
        !enclosed.closed.some((marker) => marker.kind === pair.key);
      if (wanted === carries) continue;
      if (wanted) {
        open.push(
          pair.key === "highlight" && native
            ? `${pair.open}${native.emoji}`
            : pair.open,
        );
        close.unshift(pair.close);
        continue;
      }
      const start = state.openAt[pair.key];
      if (!start) continue;
      const end = closingOffset(doc, state, inner.to, pair.key);
      // Ending on the far edge, the run stops there; otherwise it carries on
      // past the selection and needs its marker back.
      if (end && end.at === inner.to) tail = end.at + end.length;
      else close.push(pair.open);
      // A run opening with the selection can move out of it wholesale; one
      // reaching back past the near edge is closed there instead, so only the
      // selected characters lose the format.
      if (start.at + start.length === inner.from) cut(start);
      else open.unshift(pair.close);
    }

    const outer = spanStyleOf({ ...state, spans });
    if (wantedStyle !== outer) {
      const span = spans[spans.length - 1];
      // The selection is the whole body of its span: rewrite that tag in place.
      if (
        span &&
        span.end === inner.from &&
        doc.startsWith(SPAN_CLOSE, inner.to)
      ) {
        cuts.push({ from: span.at, to: span.end, text: "" });
        if (wantedStyle) open.push(`<span style="${wantedStyle}">`);
        else tail = inner.to + SPAN_CLOSE.length;
      } else if (wantedStyle) {
        // Inside a longer span: Font Color wraps the selection the same way.
        open.push(`<span style="${wantedStyle}">`);
        close.unshift(SPAN_CLOSE);
      } else if (span) {
        // Nothing to wrap in: step out of the span instead of nesting one.
        // Ending on the far edge it stops there; otherwise it carries on past
        // the selection and needs its tag back.
        if (doc.startsWith(SPAN_CLOSE, inner.to))
          tail = inner.to + SPAN_CLOSE.length;
        else close.push(doc.slice(span.at, span.end));
        // Opening with the selection, the tag moves out wholesale; reaching
        // back past the near edge, it is closed there instead.
        if (span.end === inner.from)
          cuts.push({ from: span.at, to: span.end, text: "" });
        else open.unshift(SPAN_CLOSE);
      }
    }

    changes.push(...cuts);
    if (open.length || head > inner.from)
      changes.push({ from: inner.from, to: head, text: open.join("") });
    if (close.length || tail > inner.to)
      changes.push({ from: inner.to, to: tail, text: close.join("") });
  }

  return { changes: merge(order(changes)) };
}

/** CodeMirror takes sorted, non-overlapping changes; touching ones become one. */
function merge(changes: readonly Change[]): Change[] {
  const out: Change[] = [];
  for (const change of changes) {
    const last = out[out.length - 1];
    if (last && last.to === change.from)
      out[out.length - 1] = {
        from: last.from,
        to: change.to,
        text: last.text + change.text,
      };
    else out.push(change);
  }
  return out;
}
