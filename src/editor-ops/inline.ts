import {
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
