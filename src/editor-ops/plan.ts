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
}

export const NO_CHANGE: Plan = { changes: [] };
/** Ascending, non-overlapping, duplicate cursors collapsed. */
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

/** CodeMirror requires sorted, non-overlapping changes. */
export function order(changes: Change[]): Change[] {
  return changes.sort((a, b) => a.from - b.from);
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
