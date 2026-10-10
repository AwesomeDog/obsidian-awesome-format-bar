import { highlightEmojiAt, nativeHighlightOf } from "../model/palettes";
import { pairTags, SPAN_CLOSE, SPAN_WHOLE } from "./inline";
import {
  normalizeRanges,
  order,
  touches,
  type Change,
  type Plan,
  type Range,
} from "./plan";

/** One writer for all four: Font Color, Highlight Color, Font Size, Font Family. */
export type SpanProperty = "color" | "background" | "font-size" | "font-family";

const SPAN_OPEN_BEFORE = /<span style="([^"]*)">$/;

interface Declaration {
  readonly name: string;
  readonly value: string;
}

/** The declarations of an inline `style`, in the order they are written. */
function declarations(style: string): Declaration[] {
  const out: Declaration[] = [];
  for (const part of style.split(";")) {
    const text = part.trim();
    if (text === "") continue;
    const at = text.indexOf(":");
    out.push(
      at < 0
        ? { name: text, value: "" }
        : {
            name: text.slice(0, at).trim(),
            value: text.slice(at + 1).trim(),
          },
    );
  }
  return out;
}

/** What `style` gives `property`, or `null` when it gives it nothing. */
export function styleValue(
  style: string,
  property: SpanProperty,
): string | null {
  for (const pair of declarations(style))
    if (pair.name === property) return pair.value || null;
  return null;
}

/** `style` carrying `property: value`; `null` takes the property out. */
export function setStyle(
  style: string,
  property: SpanProperty,
  value: string | null,
): string {
  const pairs = declarations(style).filter((pair) => pair.name !== property);
  if (value) pairs.push({ name: property, value });
  return pairs.map((pair) => `${pair.name}:${pair.value}`).join(";");
}

/** `null` clears only `property`; the span survives while it carries another. */
export function applySpanStyle(
  doc: string,
  ranges: readonly Range[],
  property: SpanProperty,
  value: string | null,
): Plan {
  const changes: Change[] = [];

  for (const range of normalizeRanges(ranges)) {
    if (range.from === range.to) continue;
    const inner = doc.slice(range.from, range.to);

    // The selection swallows the whole span: rewrite it in place.
    const whole = SPAN_WHOLE.exec(inner);
    if (whole) {
      const style = setStyle(whole[1] ?? "", property, value);
      const body = whole[2] ?? "";
      changes.push({
        from: range.from,
        to: range.to,
        text: style ? `<span style="${style}">${body}${SPAN_CLOSE}` : body,
      });
      continue;
    }

    // The selection sits exactly inside a span: rewrite the opening tag.
    const before = SPAN_OPEN_BEFORE.exec(doc.slice(0, range.from));
    if (before && doc.startsWith(SPAN_CLOSE, range.to)) {
      const style = setStyle(before[1] ?? "", property, value);
      const openFrom = range.from - (before[0] ?? "").length;
      if (style) {
        changes.push({
          from: openFrom,
          to: range.from,
          text: `<span style="${style}">`,
        });
      } else {
        changes.push({ from: openFrom, to: range.from, text: "" });
        changes.push({
          from: range.to,
          to: range.to + SPAN_CLOSE.length,
          text: "",
        });
      }
      continue;
    }

    if (!value) continue;
    changes.push({
      from: range.from,
      to: range.from,
      text: `<span style="${property}:${value}">`,
    });
    changes.push({ from: range.to, to: range.to, text: SPAN_CLOSE });
  }
  return { changes: order(changes) };
}

/** Obsidian's own colored highlight: a `==` pair with an emoji after the open. */
const HIGHLIGHT_OPEN = "==";
const HIGHLIGHT_CLOSE = "==";

/** The `==` opening a highlight whose text starts at `to`, with the emoji it carries.
 * An emoji is one code point outside the BMP, so the marker sits two units back. */
function highlightOpening(
  doc: string,
  to: number,
): { from: number; emoji: string } | null {
  const at = to - HIGHLIGHT_OPEN.length;
  if (at >= 0 && doc.startsWith(HIGHLIGHT_OPEN, at))
    return { from: at, emoji: "" };
  const start = at - HIGHLIGHT_OPEN.length;
  if (start < 0 || !doc.startsWith(HIGHLIGHT_OPEN, start)) return null;
  return highlightEmojiAt(doc, at)
    ? { from: start, emoji: doc.slice(at, to) }
    : null;
}

/** Highlight Color: the six Obsidian renders go out as `==🟡…==`, the rest as a span.
 * `null` is No Color, which takes the highlight away whole, markers and all. */
export function applyHighlightColor(
  doc: string,
  ranges: readonly Range[],
  hex: string | null,
): Plan {
  const native = hex === null ? undefined : nativeHighlightOf(hex);
  const changes: Change[] = [];

  for (const range of normalizeRanges(ranges)) {
    if (range.from === range.to) continue;

    // The selection swallows the whole highlight: rewrite it in place.
    const inner = doc.slice(range.from, range.to);
    if (
      inner.startsWith(HIGHLIGHT_OPEN) &&
      inner.endsWith(HIGHLIGHT_CLOSE) &&
      inner.length >= HIGHLIGHT_OPEN.length + HIGHLIGHT_CLOSE.length
    ) {
      let from = range.from + HIGHLIGHT_OPEN.length;
      const found = highlightEmojiAt(doc, from);
      if (found) from += found.length;
      const body = doc.slice(from, range.to - HIGHLIGHT_CLOSE.length);
      if (hex === null)
        changes.push({ from: range.from, to: range.to, text: body });
      else if (native) {
        const text = `${HIGHLIGHT_OPEN}${native.emoji}${body}${HIGHLIGHT_CLOSE}`;
        if (text !== inner)
          changes.push({ from: range.from, to: range.to, text });
      } else
        changes.push({
          from: range.from,
          to: range.to,
          text: `<span style="background:${hex}">${body}</span>`,
        });
      continue;
    }

    // The selection sits exactly inside a highlight: rewrite its opening.
    const opening = doc.startsWith(HIGHLIGHT_CLOSE, range.to)
      ? highlightOpening(doc, range.from)
      : null;
    if (opening) {
      if (hex === null) {
        changes.push({ from: opening.from, to: range.from, text: "" });
        changes.push({
          from: range.to,
          to: range.to + HIGHLIGHT_CLOSE.length,
          text: "",
        });
      } else if (native) {
        if (opening.emoji !== native.emoji)
          changes.push({
            from: opening.from,
            to: range.from,
            text: `${HIGHLIGHT_OPEN}${native.emoji}`,
          });
      } else {
        // A span color and an emoji would both color the same text.
        if (opening.emoji)
          changes.push({
            from: range.from - opening.emoji.length,
            to: range.from,
            text: "",
          });
        changes.push(
          ...applySpanStyle(doc, [range], "background", hex).changes,
        );
      }
      continue;
    }

    if (hex === null || !native) {
      changes.push(...applySpanStyle(doc, [range], "background", hex).changes);
      continue;
    }

    // The selection is exactly the body of its span: rewrite the tags in place,
    // so a background span becomes a highlight instead of nesting one.
    const before = SPAN_OPEN_BEFORE.exec(doc.slice(0, range.from));
    if (before && doc.startsWith(SPAN_CLOSE, range.to)) {
      const style = setStyle(before[1] ?? "", "background", null);
      const open = style ? `<span style="${style}">` : "";
      changes.push({
        from: range.from - (before[0] ?? "").length,
        to: range.from,
        text: `${open}${HIGHLIGHT_OPEN}${native.emoji}`,
      });
      changes.push({
        from: range.to,
        to: range.to + SPAN_CLOSE.length,
        text: HIGHLIGHT_CLOSE,
      });
      continue;
    }

    changes.push({
      from: range.from,
      to: range.from,
      text: `${HIGHLIGHT_OPEN}${native.emoji}`,
    });
    changes.push({ from: range.to, to: range.to, text: HIGHLIGHT_CLOSE });
  }

  return { changes: order(changes) };
}

/** Removes the plugin's inline HTML wrappers before native clear-formatting runs. */
export function clearOwnedInlineHtml(
  doc: string,
  ranges: readonly Range[],
): Plan {
  const selected = normalizeRanges(ranges).filter(
    (range) => range.from !== range.to,
  );
  if (selected.length === 0) return { changes: [] };

  const { pairs, orphans } = pairTags(
    doc,
    // `<span />` closes itself: there is no tag to pair it with.
    (tag) => !/\/\s*>$/.test(tag.raw),
  );

  const changes: Change[] = [];
  for (const { open, close } of pairs) {
    if (!touches(selected, open.from, close.to)) continue;
    changes.push({ from: open.from, to: open.to, text: "" });
    changes.push({ from: close.from, to: close.to, text: "" });
  }
  for (const tag of orphans) {
    if (touches(selected, tag.from, tag.to))
      changes.push({ from: tag.from, to: tag.to, text: "" });
  }
  return { changes: order(changes) };
}
