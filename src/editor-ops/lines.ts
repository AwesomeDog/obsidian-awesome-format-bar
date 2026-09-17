import { normalizeRanges, type Change, type Range } from "./plan";

/** A fence is a divider for renumbering, sorting, joining and splitting alike. */
export const FENCE = /^\s*(?:```|~~~)/;

const LATIN = new Intl.Collator("en-US", {
  numeric: true,
  sensitivity: "base",
});

/** Han only sorts by pinyin under `zh`; latin, hangul and cyrillic come out
 * the same under either, so the script decides which collator to ask. */
const HAN = new Intl.Collator("zh-Hans-CN", {
  numeric: true,
  sensitivity: "base",
});

const HAN_SCRIPT = /\p{Script=Han}/u;

/** Shared by every sort, so `Item 2` comes before `Item 10`. */
export function compareText(a: string, b: string): number {
  const collator = HAN_SCRIPT.test(a) || HAN_SCRIPT.test(b) ? HAN : LATIN;
  return collator.compare(a, b);
}

/** A number as a spreadsheet writes one: `1.5`, `-3`, `¥1,200`, `87%`. */
const NUMBER = /^[-+]?\p{Sc}?\d[\d,]*(?:\.\d+)?%?$/u;

/** Numbers for a whole column of them, else `null`: one `n/a` and the column
 * is text again, because half a column sorted numerically is just wrong. */
export function asNumbers(values: readonly string[]): readonly number[] | null {
  if (!values.every((value) => NUMBER.test(value))) return null;
  return values.map((value) => parseFloat(value.replace(/[\p{Sc}%,]/gu, "")));
}

export class Lines {
  readonly text: string;
  private readonly starts: number[] = [0];

  constructor(text: string) {
    this.text = text;
    for (let i = 0; i < text.length; i++)
      if (text[i] === "\n") this.starts.push(i + 1);
  }

  get count(): number {
    return this.starts.length;
  }

  start(line: number): number {
    return this.starts[line] ?? this.text.length;
  }

  /** Offset of the line terminator (or end of document). */
  end(line: number): number {
    const next = this.starts[line + 1];
    return next === undefined ? this.text.length : next - 1;
  }

  at(line: number): string {
    return this.text.slice(this.start(line), this.end(line));
  }

  lineOf(offset: number): number {
    let low = 0;
    let high = this.starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if ((this.starts[mid] ?? 0) <= offset) low = mid;
      else high = mid - 1;
    }
    return low;
  }

  slice(a: number, b: number): string {
    return this.text.slice(this.start(a), this.end(b));
  }
}

export type Block = [number, number];

type BlockMode = "lines" | "paragraph" | "collapsed-paragraph";

function paragraphOf(lines: Lines, a: number, b: number): Block {
  let start = a;
  while (start > 0 && lines.at(start - 1).trim() !== "") start--;
  let end = b;
  while (end < lines.count - 1 && lines.at(end + 1).trim() !== "") end++;
  return [start, end];
}

export function blocksFor(
  lines: Lines,
  ranges: readonly Range[],
  mode: BlockMode = "lines",
): Block[] {
  const out: Block[] = [];
  for (const range of normalizeRanges(ranges)) {
    const first = lines.lineOf(range.from);
    let last = lines.lineOf(range.to);
    // A selection ending exactly on a line start does not include that line.
    if (last > first && range.to === lines.start(last)) last--;

    const expand =
      mode === "paragraph" ||
      (mode === "collapsed-paragraph" && range.from === range.to);
    const block = expand ? paragraphOf(lines, first, last) : [first, last];

    const previous = out[out.length - 1];
    if (previous && (block[0] ?? 0) <= previous[1] + 1)
      previous[1] = Math.max(previous[1], block[1] ?? 0);
    else out.push([block[0] ?? 0, block[1] ?? 0]);
  }
  return out;
}

/** Replacement covering lines `a..b` without touching the trailing newline. */
export function replaceBlock(
  lines: Lines,
  a: number,
  b: number,
  text: string,
): Change {
  return { from: lines.start(a), to: lines.end(b), text };
}

/** Removes a whole line including the newline that attaches it. */
export function removeLine(lines: Lines, line: number): Change {
  if (line + 1 < lines.count)
    return { from: lines.start(line), to: lines.start(line + 1), text: "" };
  return {
    from: line > 0 ? lines.end(line - 1) : lines.start(line),
    to: lines.end(line),
    text: "",
  };
}
