import {
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";

/** One writer for all four: Font Color, Highlight Color, Font Size, Font Family. */
export type SpanProperty = "color" | "background" | "font-size" | "font-family";

const SPAN_CLOSE = "</span>";
const SPAN_OPEN_BEFORE = /<span style="([^"]*)">$/;
const SPAN_WHOLE = /^<span style="([^"]*)">([\s\S]*)<\/span>$/;
const CLEARABLE_TAG = /<\/?(span|u|sub|sup)\b[^>]*>/gi;

interface InlineTag {
  readonly from: number;
  readonly to: number;
  readonly name: string;
  readonly closing: boolean;
}

interface InlineWrapper {
  readonly open: InlineTag;
  readonly close?: InlineTag;
}

function editStyle(
  style: string,
  property: SpanProperty,
  value: string | null,
): string {
  const pairs = style
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const at = part.indexOf(":");
      return at < 0
        ? { name: part, value: "" }
        : { name: part.slice(0, at).trim(), value: part.slice(at + 1).trim() };
    })
    .filter((pair) => pair.name !== property);
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
      const style = editStyle(whole[1] ?? "", property, value);
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
      const style = editStyle(before[1] ?? "", property, value);
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

/** Removes the plugin's inline HTML wrappers before native clear-formatting runs. */
export function clearOwnedInlineHtml(
  doc: string,
  ranges: readonly Range[],
): Plan {
  const selected = normalizeRanges(ranges).filter(
    (range) => range.from !== range.to,
  );
  if (selected.length === 0) return { changes: [] };

  const wrappers: InlineWrapper[] = [];
  const unmatched: InlineTag[] = [];
  const stack: InlineTag[] = [];
  CLEARABLE_TAG.lastIndex = 0;
  for (
    let match = CLEARABLE_TAG.exec(doc);
    match;
    match = CLEARABLE_TAG.exec(doc)
  ) {
    const raw = match[0] ?? "";
    const tag: InlineTag = {
      from: match.index,
      to: match.index + raw.length,
      name: (match[1] ?? "").toLowerCase(),
      closing: raw.startsWith("</"),
    };
    if (!tag.closing) {
      if (!/\/\s*>$/.test(raw)) stack.push(tag);
      continue;
    }

    let openIndex = stack.length - 1;
    while (openIndex >= 0 && stack[openIndex]?.name !== tag.name) openIndex--;
    if (openIndex < 0) {
      unmatched.push(tag);
      continue;
    }
    const open = stack.splice(openIndex, 1)[0];
    if (open) wrappers.push({ open, close: tag });
  }
  unmatched.push(...stack);

  const touched = (from: number, to: number): boolean =>
    selected.some((range) => range.from < to && range.to > from);
  const changes: Change[] = [];
  for (const wrapper of wrappers) {
    const end = wrapper.close?.to ?? doc.length;
    if (!touched(wrapper.open.from, end)) continue;
    changes.push({ from: wrapper.open.from, to: wrapper.open.to, text: "" });
    if (wrapper.close)
      changes.push({
        from: wrapper.close.from,
        to: wrapper.close.to,
        text: "",
      });
  }
  for (const tag of unmatched) {
    if (touched(tag.from, tag.to))
      changes.push({ from: tag.from, to: tag.to, text: "" });
  }
  return { changes: order(changes) };
}
