import {
  NO_CHANGE,
  applyChanges,
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";
import {
  blocksFor,
  compareText,
  FENCE,
  Lines,
  replaceBlock,
  type Block,
} from "./lines";

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

/** Reorders each run of lines; blank lines and fences stay put as dividers. */
function reorderRuns(
  lines: Lines,
  ranges: readonly Range[],
  reorder: (run: readonly string[]) => string[],
): Plan {
  const changes: Change[] = [];

  for (const [a, b] of blocksFor(lines, ranges, "collapsed-paragraph")) {
    const source: string[] = [];
    for (let line = a; line <= b; line++) source.push(lines.at(line));

    const result: string[] = [];
    let run: string[] = [];
    const flush = (): void => {
      if (run.length > 0) result.push(...reorder(run));
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

/** Sorts runs of non-blank lines; blank lines and fences stay put as dividers. */
export function sortLines(doc: string, ranges: readonly Range[]): Plan {
  return reorderRuns(new Lines(doc), ranges, (run) =>
    run.slice().sort((x, y) => compareText(x.trim(), y.trim())),
  );
}

export function reverseLines(doc: string, ranges: readonly Range[]): Plan {
  return reorderRuns(new Lines(doc), ranges, (run) => run.slice().reverse());
}

/** One list item: its line span, its subtree and its parent. Sort and move share it. */
interface Item {
  start: number;
  end: number;
  indent: number;
  /** The item's own line, plus any line that is not a marker of its own. */
  lines: string[];
  children: Item[];
  parent: Item | null;
}

/** Content after the marker, so `2. a` sorts by `a` and not by its number. */
const ITEM_TEXT = /^\s*(?:\d+[.)]|[-*+])\s*(.*)$/;

function itemText(item: Item): string {
  return (ITEM_TEXT.exec(item.lines[0] ?? "")?.[1] ?? "").trim();
}

/** Items begin at a marker; any other line rides with the item above it. */
function parseItems(lines: Lines, from: number, to: number): Item[] {
  const roots: Item[] = [];
  const stack: Item[] = [];

  for (let line = from; line <= to; line++) {
    const text = lines.at(line);
    const marker = ORDERED.exec(text) ?? BULLET.exec(text);
    if (!marker) {
      stack[stack.length - 1]?.lines.push(text);
      continue;
    }
    const indent = (marker[1] ?? "").length;
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (!current || current.indent < indent) break;
      current.end = line - 1;
      stack.pop();
    }
    const parent = stack[stack.length - 1] ?? null;
    const item: Item = {
      start: line,
      end: to,
      indent,
      lines: [text],
      children: [],
      parent,
    };
    (parent ? parent.children : roots).push(item);
    stack.push(item);
  }
  return roots;
}

function sortItems(items: readonly Item[]): Item[] {
  return items
    .map((item) => ({ ...item, children: sortItems(item.children) }))
    .sort((a, b) => compareText(itemText(a), itemText(b)));
}

/** Depth-first, an item before its children; `targetLine` is where `target` landed. */
function flatten(
  items: readonly Item[],
  target?: Item,
): { lines: string[]; targetLine: number } {
  const result: string[] = [];
  let targetLine = -1;
  for (const item of items) {
    const itemStart = result.length;
    if (item === target) targetLine = itemStart;
    result.push(...item.lines);
    const children = flatten(item.children, target);
    if (targetLine < 0 && children.targetLine >= 0)
      targetLine = itemStart + item.lines.length + children.targetLine;
    result.push(...children.lines);
  }
  return { lines: result, targetLine };
}

function isMoveContinuation(text: string): boolean {
  return /^\s{2,}\S/.test(text);
}

/** The contiguous list run around a cursor; blank lines and fences divide it. */
function moveRun(lines: Lines, line: number): Block | null {
  const current = lines.at(line);
  if (!isListLine(current) && !isMoveContinuation(current)) return null;

  let start = line;
  while (start > 0) {
    const previous = lines.at(start - 1);
    if (previous.trim() === "" || FENCE.test(previous)) break;
    if (!isListLine(previous) && !isMoveContinuation(previous)) break;
    start--;
  }

  let end = line;
  while (end < lines.count - 1) {
    const next = lines.at(end + 1);
    if (next.trim() === "" || FENCE.test(next)) break;
    if (!isListLine(next) && !isMoveContinuation(next)) break;
    end++;
  }

  return [start, end];
}

/** Sorting leaves ordered items out of sequence, so they are renumbered. */
function renumber(text: string): string {
  const changes = renumberList(text, [{ from: 0, to: text.length }]).changes;
  return applyChanges(text, changes);
}

/** The first list item in `a..b`, or -1 when there is none to sort. */
function firstListLine(lines: Lines, a: number, b: number): number {
  for (let line = a; line <= b; line++)
    if (isListLine(lines.at(line))) return line;
  return -1;
}

/** Sorts a list level by level; each item keeps its own lines and its children. */
export function sortList(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const changes: Change[] = [];

  for (const range of normalizeRanges(ranges)) {
    const [a, b] = blocksFor(lines, [range])[0] ?? [0, -1];
    // A selection bounds the sort; a bare cursor takes in the whole list.
    const [first, last] =
      range.from === range.to ? listBlock(lines, a, b) : [a, b];
    let start = firstListLine(lines, first, last);
    while (start >= 0) {
      // A blank line ends a list, so two lists never sort into each other.
      let end = start;
      while (end < last && lines.at(end + 1).trim() !== "") end++;
      const source = lines.slice(start, end);
      const result = renumber(
        flatten(sortItems(parseItems(lines, start, end))).lines.join("\n"),
      );
      if (result !== source)
        changes.push(replaceBlock(lines, start, end, result));
      // Skip the blank line that ends this run.
      start = firstListLine(lines, end + 2, last);
    }
  }
  return { changes: order(changes) };
}

function itemAt(items: readonly Item[], line: number): Item | null {
  for (const item of items) {
    if (line < item.start || line > item.end) continue;
    return itemAt(item.children, line) ?? item;
  }
  return null;
}

function offsetAtLine(
  lines: readonly string[],
  start: number,
  line: number,
  ch: number,
): number {
  let offset = start;
  for (let i = 0; i < line; i++) offset += (lines[i]?.length ?? 0) + 1;
  return offset + Math.min(ch, lines[line]?.length ?? 0);
}

/** Moves one list item and its subtree, following Outliner's boundary rules. */
export function moveListItem(
  doc: string,
  ranges: readonly Range[],
  direction: -1 | 1,
): Plan {
  if (ranges.length !== 1) return NO_CHANGE;
  const range = ranges[0];
  if (!range || range.from !== range.to) return NO_CHANGE;

  const lines = new Lines(doc);
  const cursorLine = lines.lineOf(range.from);
  const run = moveRun(lines, cursorLine);
  if (!run) return NO_CHANGE;

  const [start, end] = run;
  const roots = parseItems(lines, start, end);
  const target = itemAt(roots, cursorLine);
  if (!target) return NO_CHANGE;

  const siblings = target.parent?.children ?? roots;
  const index = siblings.indexOf(target);
  if (index < 0) return NO_CHANGE;

  let moved = false;
  if (direction < 0) {
    const previous = siblings[index - 1];
    if (previous) {
      siblings[index - 1] = target;
      siblings[index] = previous;
      moved = true;
    } else if (target.parent) {
      const parentSiblings = target.parent.parent?.children ?? roots;
      const parentIndex = parentSiblings.indexOf(target.parent);
      const previousParent = parentSiblings[parentIndex - 1];
      if (previousParent) {
        siblings.splice(index, 1);
        previousParent.children.push(target);
        target.parent = previousParent;
        moved = true;
      }
    }
  } else {
    const next = siblings[index + 1];
    if (next) {
      siblings[index + 1] = target;
      siblings[index] = next;
      moved = true;
    } else if (target.parent) {
      const parentSiblings = target.parent.parent?.children ?? roots;
      const parentIndex = parentSiblings.indexOf(target.parent);
      const nextParent = parentSiblings[parentIndex + 1];
      if (nextParent) {
        siblings.splice(index, 1);
        nextParent.children.unshift(target);
        target.parent = nextParent;
        moved = true;
      }
    }
  }

  if (!moved) return NO_CHANGE;

  const flattened = flatten(roots, target);
  const result = renumber(flattened.lines.join("\n"));
  if (result === lines.slice(start, end)) return NO_CHANGE;

  const resultLines = result.split("\n");
  const relativeLine = cursorLine - target.start;
  const targetLine = flattened.targetLine + relativeLine;
  const cursorCh = range.from - lines.start(cursorLine);
  return {
    changes: [replaceBlock(lines, start, end, result)],
    select: {
      from: offsetAtLine(resultLines, lines.start(start), targetLine, cursorCh),
      to: offsetAtLine(resultLines, lines.start(start), targetLine, cursorCh),
    },
  };
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

/** VS Code's Duplicate Selection: the line under the caret, or the selection. */
export function duplicate(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const list = normalizeRanges(ranges);
  const changes: Change[] = [];

  for (const range of list) {
    if (range.from === range.to) {
      const line = lines.lineOf(range.from);
      changes.push({
        from: lines.end(line),
        to: lines.end(line),
        text: "\n" + lines.at(line),
      });
    } else {
      changes.push({
        from: range.to,
        to: range.to,
        text: doc.slice(range.from, range.to),
      });
    }
  }

  // `Plan.select` carries one range, so a multi-cursor keeps the editor's own.
  const only = list.length === 1 ? list[0] : undefined;
  if (!only) return { changes: order(changes) };
  if (only.from !== only.to)
    return {
      changes,
      select: { from: only.to, to: only.to + (only.to - only.from) },
    };

  const line = lines.lineOf(only.from);
  const caret = lines.end(line) + 1 + (only.from - lines.start(line));
  return { changes, select: { from: caret, to: caret } };
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
