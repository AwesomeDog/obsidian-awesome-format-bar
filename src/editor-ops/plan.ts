/** Pure text transforms: no DOM, no Obsidian, no settings. */
export interface Range {
  readonly from: number;
  readonly to: number;
}
export interface Change {
  readonly from: number;
  readonly to: number;
  readonly text: string;
}

export interface Plan {
  readonly changes: readonly Change[];
  readonly select?: Range;
  readonly selections?: readonly Range[];
}

export const NO_CHANGE: Plan = { changes: [] };
export function normalizeRanges(ranges: readonly Range[]): Range[] {
  const sorted = ranges
    .map((range) => ({
      from: Math.min(range.from, range.to),
      to: Math.max(range.from, range.to),
    }))
    .sort((a, b) => a.from - b.from || a.to - b.to);

  const out: Range[] = [];
  for (const range of sorted) {
    const last = out[out.length - 1];
    if (last && range.from <= last.to)
      out[out.length - 1] = {
        from: last.from,
        to: Math.max(last.to, range.to),
      };
    else out.push(range);
  }
  return out;
}

/** True where `from..to` and `range` share a character; touching is not overlap. */
export function touches(
  ranges: readonly Range[],
  from: number,
  to: number,
): boolean {
  return ranges.some((range) => from < range.to && to > range.from);
}

/** CodeMirror requires sorted, non-overlapping changes; sorted into a copy. */
export function order(changes: readonly Change[]): Change[] {
  return [...changes].sort((a, b) => a.from - b.from);
}

/** Shared by every command that rewrites the selected text only. */
export function transformRanges(
  doc: string,
  ranges: readonly Range[],
  transform: (text: string) => string,
): Plan {
  const changes: Change[] = [];
  for (const range of normalizeRanges(ranges)) {
    const source = doc.slice(range.from, range.to);
    const text = transform(source);
    if (text !== source) changes.push({ from: range.from, to: range.to, text });
  }
  return { changes: order(changes) };
}

/** Not how the editor writes: it lets tests assert on text. */
export function applyChanges(text: string, changes: readonly Change[]): string {
  let out = "";
  let cursor = 0;
  for (const change of changes) {
    out += text.slice(cursor, change.from) + change.text;
    cursor = change.to;
  }
  return out + text.slice(cursor);
}

export function lineOffset(lines: readonly string[], line: number): number {
  let offset = 0;
  for (let i = 0; i < line; i++) offset += (lines[i]?.length ?? 0) + 1;
  return offset;
}

/** `ch` is clamped to the line, so a cursor past its end stays on it. */
export function offsetAtLine(
  lines: readonly string[],
  start: number,
  line: number,
  ch: number,
): number {
  return (
    start + lineOffset(lines, line) + Math.min(ch, lines[line]?.length ?? 0)
  );
}

interface Position {
  readonly line: number;
  readonly ch: number;
}

export function offsetToPosition(text: string, offset: number): Position {
  const clamped = Math.max(0, Math.min(offset, text.length));
  const before = text.lastIndexOf("\n", clamped - 1);
  let line = 0;
  for (let i = 0; i < clamped; i++) if (text[i] === "\n") line++;
  return { ch: clamped - (before + 1), line };
}
