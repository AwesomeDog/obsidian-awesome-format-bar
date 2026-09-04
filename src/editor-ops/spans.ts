import {
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";

/** Color spans: Font Color and Highlight Color share one writer. */
export type SpanProperty = "color" | "background";

const SPAN_CLOSE = "</span>";
const SPAN_OPEN_BEFORE = /<span style="([^"]*)">$/;
const SPAN_WHOLE = /^<span style="([^"]*)">([\s\S]*)<\/span>$/;

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
