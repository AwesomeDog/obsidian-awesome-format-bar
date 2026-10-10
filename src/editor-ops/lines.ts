import {
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";

/**
 * A fence is a divider for renumbering, sorting, joining and splitting alike.
 * The marker is captured so a ``` block never closes on `~~~`; `$$` counts as
 * one too, because a math block is content nobody rewrites.
 */
export const FENCE = /^\s*(`{3,}|~{3,}|\${2,})/;

/**
 * True for a fence marker and for every line it holds. Unlike a divider,
 * which the run walkers can spot one line at a time, this is asked per line
 * so a selection that starts inside a fence is protected too.
 */
export function fenceMask(lines: Lines): boolean[] {
  const out = new Array<boolean>(lines.count).fill(false);
  let open = "";
  for (let line = 0; line < lines.count; line++) {
    const text = lines.at(line);
    const marker = FENCE.exec(text)?.[1] ?? "";
    if (open === "") {
      if (marker === "") continue;
      // A single-line `$$…$$` cancels out, so only an odd count opens a block.
      if (marker[0] === "$" && (text.match(/\$\$/g) ?? []).length % 2 === 0) {
        out[line] = true;
        continue;
      }
      open = marker;
    } else if (
      marker !== "" &&
      marker[0] === open[0] &&
      marker.length >= open.length
    ) {
      open = "";
    }
    out[line] = true;
  }
  return out;
}

/** Han, kana and hangul: the scripts a Latin space reads as noise beside. */
export const CJK =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

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

/**
 * `items` in the order `valueOf` puts them: a whole column of numbers sorts
 * numerically, anything else by text. Ties keep the order they were given.
 * Sort Rows and the Reading-view header click share this, so clicking a
 * header puts the rows where the command would.
 */
export function sortByText<T>(
  items: readonly T[],
  valueOf: (item: T) => string,
  descending: boolean,
): T[] {
  const values = items.map(valueOf);
  const numbers = asNumbers(values);
  const before = (x: number, y: number): number =>
    numbers
      ? (numbers[x] ?? 0) - (numbers[y] ?? 0)
      : compareText(values[x] ?? "", values[y] ?? "");

  return items
    .map((item, at) => ({ at, item }))
    .sort((x, y) => (descending ? before(y.at, x.at) : before(x.at, y.at)))
    .map((entry) => entry.item);
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

/** A block written beside a paragraph stops being a block: a table renders as
 * plain text, and so does a Mermaid diagram. Both need a blank line around. */
export function breakBefore(text: string): string {
  if (text === "") return "";
  if (text.endsWith("\n\n")) return "";
  return text.endsWith("\n") ? "\n" : "\n\n";
}

export function breakAfter(text: string): string {
  if (text === "") return "";
  if (text.startsWith("\n\n")) return "";
  return text.startsWith("\n") ? "\n" : "\n\n";
}

/**
 * Writes `text` as a block of its own over `ranges`, with the caret left at
 * `caretInText`. Several cursors keep the editor's own selections: more than
 * one block has no single caret to name.
 */
export function insertBlock(
  doc: string,
  ranges: readonly Range[],
  text: string,
  caretInText: number,
): Plan {
  const list = normalizeRanges(ranges);
  const changes = list.map((range) => ({
    from: range.from,
    to: range.to,
    text:
      breakBefore(doc.slice(0, range.from)) +
      text +
      breakAfter(doc.slice(range.to)),
  }));
  const first = list[0];
  if (list.length !== 1 || !first) return { changes: order(changes) };
  const caret =
    first.from + breakBefore(doc.slice(0, first.from)).length + caretInText;
  return { changes: order(changes), select: { from: caret, to: caret } };
}
