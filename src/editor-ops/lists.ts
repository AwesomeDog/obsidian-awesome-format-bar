import { NO_CHANGE, order, type Change, type Plan, type Range } from "./plan";
import { blocksFor, FENCE, Lines, replaceBlock, type Block } from "./lines";

/** Renumbering, sorting, joining and splitting are local; headings and lists are not. */
const ORDERED = /^(\s*)(\d+)([.)])(\s+)(.*)$/;
const BULLET = /^(\s*)([-*+])(\s+)(.*)$/;
function isListLine(text: string): boolean {
  return ORDERED.test(text) || BULLET.test(text);
}

function listBlock(lines: Lines, a: number, b: number): Block {
  const continues = (text: string): boolean =>
    isListLine(text) || /^\s{2,}\S/.test(text);

  let start = a;
  while (start > 0) {
    const previous = lines.at(start - 1);
    if (continues(previous)) {
      start--;
      continue;
    }
    if (
      previous.trim() === "" &&
      start >= 2 &&
      isListLine(lines.at(start - 2))
    ) {
      start -= 2;
      continue;
    }
    break;
  }

  let end = b;
  while (end < lines.count - 1) {
    const next = lines.at(end + 1);
    if (continues(next)) {
      end++;
      continue;
    }
    if (
      next.trim() === "" &&
      end + 2 <= lines.count - 1 &&
      isListLine(lines.at(end + 2))
    ) {
      end += 2;
      continue;
    }
    break;
  }
  return [start, end];
}

interface ListLevel {
  indent: number;
  kind: string;
  count: number;
}

/** One counter per indent level; two blank lines or a fence start a new list. */
export function renumberList(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const changes: Change[] = [];

  for (const [rawStart, rawEnd] of blocksFor(lines, ranges)) {
    const [start, end] = listBlock(lines, rawStart, rawEnd);
    const stack: ListLevel[] = [];
    let blanks = 0;
    let inFence = false;

    for (let line = start; line <= end; line++) {
      const text = lines.at(line);

      if (FENCE.test(text)) {
        inFence = !inFence;
        stack.length = 0;
        blanks = 0;
        continue;
      }
      if (inFence) continue;
      if (text.trim() === "") {
        blanks++;
        continue;
      }

      const ordered = ORDERED.exec(text);
      const bullet = ordered ? null : BULLET.exec(text);
      if (!ordered && !bullet) {
        // Indented text is a lazy continuation of the item above it.
        if (stack.length > 0 && /^\s{2,}/.test(text)) {
          blanks = 0;
          continue;
        }
        stack.length = 0;
        blanks = 0;
        continue;
      }

      if (blanks >= 2) stack.length = 0;
      blanks = 0;

      const indent = (ordered?.[1] ?? bullet?.[1] ?? "").length;
      const kind = ordered ? "ordered" : (bullet?.[2] ?? "-");
      while (
        stack.length > 0 &&
        (stack[stack.length - 1]?.indent ?? 0) > indent
      )
        stack.pop();

      const top = stack[stack.length - 1];
      if (!top || top.indent < indent) stack.push({ count: 0, indent, kind });
      else if (top.kind !== kind) {
        top.kind = kind;
        top.count = 0;
      }

      const level = stack[stack.length - 1];
      if (!level) continue;
      level.count++;
      if (!ordered) continue;

      const current = ordered[2] ?? "";
      const wanted = String(level.count);
      if (current === wanted) continue;
      const at = lines.start(line) + (ordered[1] ?? "").length;
      changes.push({ from: at, to: at + current.length, text: wanted });
    }
  }
  return { changes: order(changes) };
}

/** Sorts runs of non-blank lines; blank lines and fences stay put as dividers. */
export function sortLines(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const collator = new Intl.Collator("en-US", {
    numeric: true,
    sensitivity: "base",
  });
  const changes: Change[] = [];

  for (const [a, b] of blocksFor(lines, ranges, "collapsed-paragraph")) {
    const source: string[] = [];
    for (let line = a; line <= b; line++) source.push(lines.at(line));

    const result: string[] = [];
    let run: string[] = [];
    const flush = (): void => {
      if (run.length === 0) return;
      result.push(
        ...run.slice().sort((x, y) => collator.compare(x.trim(), y.trim())),
      );
      run = [];
    };
    for (const text of source) {
      if (text.trim() === "" || FENCE.test(text)) {
        flush();
        result.push(text);
        continue;
      }
      run.push(text);
    }
    flush();

    if (result.some((text, index) => text !== source[index]))
      changes.push(replaceBlock(lines, a, b, result.join("\n")));
  }
  return { changes: order(changes) };
}

/** Only marks that cannot end a sentence, so prose never shatters. */
const SEPARATORS = ["、", "，", ",", ";", "；", "|", "·"] as const;
/** CJK, where a space reads as noise rather than separation. */
const CJK = /[㐀-鿿]/;

/** The separator the selection uses most; ties go to the earliest. */
function pickSeparator(text: string): string | null {
  let best: string | null = null;
  let most = 0;
  for (const separator of SEPARATORS) {
    const count = text.split(separator).length - 1;
    if (count > most) {
      most = count;
      best = separator;
    }
  }
  return best;
}

/** A line without the separator is left alone, so nothing trims in passing. */
export function splitLines(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const blocks = blocksFor(lines, ranges);
  const separator = pickSeparator(
    blocks.map(([a, b]) => lines.slice(a, b)).join("\n"),
  );
  if (separator === null) return NO_CHANGE;

  const changes: Change[] = [];
  for (const [a, b] of blocks) {
    const source = lines.slice(a, b);
    const result = source
      .split("\n")
      .flatMap((text) => {
        const parts = text.split(separator);
        return parts.length > 1 ? parts.map((part) => part.trim()) : [text];
      })
      .join("\n");
    if (result !== source) changes.push(replaceBlock(lines, a, b, result));
  }
  return { changes: order(changes) };
}

/** A break touching CJK joins bare: a space there reads as noise. */
function joinRun(run: readonly string[]): string {
  let out = (run[0] ?? "").trimEnd();
  for (const text of run.slice(1)) {
    const part = text.trim();
    if (part === "") continue;
    const bridge =
      CJK.test(out.slice(-1)) || CJK.test(part.charAt(0)) ? "" : " ";
    out += bridge + part;
  }
  return out;
}

/** Blank lines and fences stay put, so a paragraph stays a paragraph. */
export function mergeLines(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const changes: Change[] = [];

  for (const [a, b] of blocksFor(lines, ranges, "collapsed-paragraph")) {
    // One line has nothing to join.
    if (a === b) continue;
    const source: string[] = [];
    for (let line = a; line <= b; line++) source.push(lines.at(line));

    const result: string[] = [];
    let run: string[] = [];
    const flush = (): void => {
      if (run.length > 1) result.push(joinRun(run));
      else result.push(...run);
      run = [];
    };
    for (const text of source) {
      if (text.trim() === "" || FENCE.test(text)) {
        flush();
        result.push(text);
        continue;
      }
      run.push(text);
    }
    flush();

    if (result.some((text, index) => text !== source[index]))
      changes.push(replaceBlock(lines, a, b, result.join("\n")));
  }
  return { changes: order(changes) };
}
