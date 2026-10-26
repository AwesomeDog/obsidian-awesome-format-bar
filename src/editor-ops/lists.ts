import {
  NO_CHANGE,
  applyChanges,
  normalizeRanges,
  offsetAtLine,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";
import {
  blocksFor,
  CJK,
  compareText,
  FENCE,
  fenceMask,
  Lines,
  replaceBlock,
  type Block,
} from "./lines";
import {
  flattenOutline,
  moveOutline,
  outlineAt,
  parseOutline,
  sortOutline,
  type Outline,
} from "./outline";

const ORDERED = /^(\s*)(\d+)([.)])(\s+)(.*)$/;
const BULLET = /^(\s*)([-*+])(\s+)(.*)$/;
function isListLine(text: string): boolean {
  return ORDERED.test(text) || BULLET.test(text);
}

const INDENTED = /^\s{2,}\S/;

function continues(text: string): boolean {
  return isListLine(text) || INDENTED.test(text);
}

/** The list `a..b` belongs to; `bridge` crosses one blank line, `fence` ends the walk. */
function listRun(
  lines: Lines,
  a: number,
  b: number,
  bridge: boolean,
  fence: boolean,
): Block {
  const takes = (text: string): boolean =>
    continues(text) && !(fence && FENCE.test(text));

  let start = a;
  while (start > 0) {
    const previous = lines.at(start - 1);
    if (takes(previous)) {
      start--;
      continue;
    }
    if (
      bridge &&
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
    if (takes(next)) {
      end++;
      continue;
    }
    if (
      bridge &&
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

function listBlock(lines: Lines, a: number, b: number): Block {
  return listRun(lines, a, b, true, false);
}

interface ListLevel {
  indent: number;
  kind: string;
  count: number;
}

/** One counter per indent level; two blank lines or a fence start a new list. */
export function renumberList(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const fenced = fenceMask(lines);
  const changes: Change[] = [];

  for (const [rawStart, rawEnd] of blocksFor(lines, ranges)) {
    const [start, end] = listBlock(lines, rawStart, rawEnd);
    const stack: ListLevel[] = [];
    let blanks = 0;

    for (let line = start; line <= end; line++) {
      const text = lines.at(line);

      if (fenced[line]) {
        stack.length = 0;
        blanks = 0;
        continue;
      }
      if (text.trim() === "") {
        blanks++;
        continue;
      }

      const ordered = ORDERED.exec(text);
      const bullet = ordered ? null : BULLET.exec(text);
      if (!ordered && !bullet) {
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

function reorderRuns(
  lines: Lines,
  ranges: readonly Range[],
  reorder: (run: readonly string[]) => string[],
): Plan {
  const changes: Change[] = [];
  const fenced = fenceMask(lines);

  for (const [a, b] of blocksFor(lines, ranges, "collapsed-paragraph")) {
    if (a === b) continue;
    const source: string[] = [];
    for (let line = a; line <= b; line++) source.push(lines.at(line));

    const result: string[] = [];
    let run: string[] = [];
    const flush = (): void => {
      if (run.length > 0) result.push(...reorder(run));
      run = [];
    };
    for (const [index, text] of source.entries()) {
      if ((fenced[a + index] ?? false) || text.trim() === "") {
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

export function sortLines(doc: string, ranges: readonly Range[]): Plan {
  return reorderRuns(new Lines(doc), ranges, (run) =>
    run.slice().sort((x, y) => compareText(x.trim(), y.trim())),
  );
}

export function reverseLines(doc: string, ranges: readonly Range[]): Plan {
  return reorderRuns(new Lines(doc), ranges, (run) => run.slice().reverse());
}

function itemLevelOf(text: string): number | null {
  const marker = ORDERED.exec(text) ?? BULLET.exec(text);
  return marker ? (marker[1] ?? "").length : null;
}

function itemsIn(lines: Lines, from: number, to: number): Outline[] {
  return parseOutline(lines, from, to, itemLevelOf);
}

/** Content after the marker, so `2. a` sorts by `a` and not by its number. */
const ITEM_TEXT = /^\s*(?:\d+[.)]|[-*+])\s*(.*)$/;

function itemText(item: Outline): string {
  return (ITEM_TEXT.exec(item.lines[0] ?? "")?.[1] ?? "").trim();
}

function moveRun(lines: Lines, line: number): Block | null {
  if (!continues(lines.at(line))) return null;
  return listRun(lines, line, line, false, true);
}

function renumber(text: string): string {
  const changes = renumberList(text, [{ from: 0, to: text.length }]).changes;
  return applyChanges(text, changes);
}

function firstListLine(lines: Lines, a: number, b: number): number {
  for (let line = a; line <= b; line++)
    if (isListLine(lines.at(line))) return line;
  return -1;
}

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
        flattenOutline(
          sortOutline(itemsIn(lines, start, end), itemText),
        ).lines.join("\n"),
      );
      if (result !== source)
        changes.push(replaceBlock(lines, start, end, result));
      start = firstListLine(lines, end + 2, last);
    }
  }
  return { changes: order(changes) };
}

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
  const roots = itemsIn(lines, start, end);
  const target = outlineAt(roots, cursorLine);
  if (!target) return NO_CHANGE;

  const moved = moveOutline(roots, target, direction);
  if (!moved) return NO_CHANGE;
  // Sorting leaves ordered items out of sequence, so they are renumbered.
  const result = renumber(moved.lines.join("\n"));
  if (result === lines.slice(start, end)) return NO_CHANGE;

  const targetLine = moved.targetLine + (cursorLine - target.start);
  const caret = offsetAtLine(
    result.split("\n"),
    lines.start(start),
    targetLine,
    range.from - lines.start(cursorLine),
  );
  return {
    changes: [replaceBlock(lines, start, end, result)],
    select: { from: caret, to: caret },
  };
}

/** Only marks that cannot end a sentence, so prose never shatters. */
const SEPARATORS = ["、", "，", ",", ";", "；", "|", "·"] as const;

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

export function splitLines(doc: string, ranges: readonly Range[]): Plan {
  const lines = new Lines(doc);
  const fenced = fenceMask(lines);
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
      .flatMap((text, index) => {
        if (fenced[a + index] ?? false) return [text];
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

export function mergeLines(doc: string, ranges: readonly Range[]): Plan {
  return reorderRuns(new Lines(doc), ranges, (run) =>
    run.length > 1 ? [joinRun(run)] : [...run],
  );
}
