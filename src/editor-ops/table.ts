import { Lines, replaceBlock } from "./lines";
import { NO_CHANGE, order, type Change, type Plan } from "./plan";
import { displayWidth, padToWidth } from "./width";

export type ColumnAlignment = "none" | "left" | "center" | "right";

export interface TableFormat {
  readonly padWidth: boolean;
}

export interface MarkdownTable {
  readonly lines: Lines;
  /** Header line; the delimiter row is `start + 1`. */
  readonly start: number;
  /** Header first, body after. The delimiter row is not a row. */
  readonly rows: readonly (readonly string[])[];
  readonly align: readonly ColumnAlignment[];
}
const DELIMITER = /^:?-+:?$/;
const DELIMITER_ROW = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/;

/** Captured markers: a ``` block never closes on `~~~`; a miss reformats code. */
const FENCE = /^\s*(`{3,}|~{3,}|\${2,})/;

/** A pipe, or a bare delimiter row — but never a bare `---` rule. */
export function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith("|")) return true;
  return trimmed.includes("|") && DELIMITER_ROW.test(trimmed);
}

/** Pipes inside a fence are content, not cells. */
function fencedLines(lines: Lines): boolean[] {
  const inside = new Array<boolean>(lines.count).fill(false);
  let open = "";
  for (let line = 0; line < lines.count; line++) {
    const text = lines.at(line);
    const marker = FENCE.exec(text)?.[1] ?? "";
    if (open === "") {
      if (marker === "") continue;
      // A single-line `$$…$$` cancels out, so only an odd count opens a block.
      if (marker[0] === "$" && (text.match(/\$\$/g) ?? []).length % 2 === 0) {
        inside[line] = true;
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
    inside[line] = true;
  }
  return inside;
}

function splitCells(text: string): string[] {
  const cells: string[] = [];
  let cell = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\\" && text[i + 1] === "|") {
      cell += "|";
      i++;
      continue;
    }
    if (char === "|") {
      cells.push(cell);
      cell = "";
      continue;
    }
    cell += char;
  }
  cells.push(cell);
  return cells;
}

/** Cells of one row, outer pipes dropped, `\|` unescaped, each cell trimmed. */
function splitRow(line: string): string[] {
  let text = line.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|") && !text.endsWith("\\|")) text = text.slice(0, -1);
  return splitCells(text).map((cell) => cell.trim());
}

function isDelimiter(line: string): boolean {
  const cells = splitRow(line);
  return cells.length > 0 && cells.every((cell) => DELIMITER.test(cell));
}

function columnAlignmentOf(cell: string): ColumnAlignment {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return "none";
}

function parseBlock(
  lines: Lines,
  lo: number,
  hi: number,
): MarkdownTable | null {
  if (hi < lo + 1 || !isDelimiter(lines.at(lo + 1))) return null;
  const rows = [splitRow(lines.at(lo))];
  for (let line = lo + 2; line <= hi; line++)
    rows.push(splitRow(lines.at(line)));
  return {
    align: splitRow(lines.at(lo + 1)).map(columnAlignmentOf),
    lines,
    rows,
    start: lo,
  };
}

/** Shared by the caret lookup and the document scan, so both agree on a table. */
function tableScan(
  lines: Lines,
  fenced: readonly boolean[],
  line: number,
): MarkdownTable | null {
  if (fenced[line] || !isTableLine(lines.at(line))) return null;
  let lo = line;
  while (lo > 0 && !fenced[lo - 1] && isTableLine(lines.at(lo - 1))) lo--;
  let hi = line;
  while (
    hi + 1 < lines.count &&
    !fenced[hi + 1] &&
    isTableLine(lines.at(hi + 1))
  )
    hi++;
  return parseBlock(lines, lo, hi);
}

function tableAt(doc: string, offset: number): MarkdownTable | null {
  const lines = new Lines(doc);
  return tableScan(lines, fencedLines(lines), lines.lineOf(offset));
}

interface TableCellPosition {
  /** 0 is the header row; the delimiter row counts as the header. */
  readonly row: number;
  readonly column: number;
}

function cellAt(table: MarkdownTable, offset: number): TableCellPosition {
  const { lines } = table;
  const line = lines.lineOf(offset);
  const row = line <= table.start + 1 ? 0 : line - table.start - 1;
  const stop = Math.min(offset, lines.end(line));
  let pipes = 0;
  for (let i = lines.start(line); i < stop; i++) {
    const char = lines.text[i];
    if (char === "\\") i++;
    else if (char === "|") pipes++;
  }
  return { column: Math.max(0, pipes - 1), row };
}
function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

/** The column count is the widest row; short rows pad with empty cells. */
export function renderTable(
  rows: readonly (readonly string[])[],
  align: readonly ColumnAlignment[],
  format: TableFormat,
): string {
  const columns = Math.max(align.length, ...rows.map((row) => row.length));
  const cells = rows.map((row) =>
    Array.from({ length: columns }, (_, i) => escapeCell(row[i] ?? "")),
  );

  // Widths once per column: `draw` would re-scan the column on every cell.
  const widths = Array.from({ length: columns }, (_, column) =>
    format.padWidth
      ? Math.max(3, ...cells.map((row) => displayWidth(row[column] ?? "")))
      : 3,
  );
  const width = (column: number): number => widths[column] ?? 3;

  const rule = (column: number): string => {
    const dashes = width(column);
    switch (align[column] ?? "none") {
      case "center":
        return `:${"-".repeat(dashes - 2)}:`;
      case "left":
        return `:${"-".repeat(dashes - 1)}`;
      case "right":
        return `${"-".repeat(dashes - 1)}:`;
      default:
        return "-".repeat(dashes);
    }
  };

  const draw = (cells: readonly string[]): string =>
    `| ${cells
      .map((cell, column) =>
        format.padWidth ? padToWidth(cell, width(column)) : cell,
      )
      .join(" | ")} |`;

  const out = [draw(cells[0] ?? [])];
  out.push(
    `| ${Array.from({ length: columns }, (_, i) => rule(i)).join(" | ")} |`,
  );
  for (const row of cells.slice(1)) out.push(draw(row));
  return out.join("\n");
}
interface TableEditContext {
  readonly cell: TableCellPosition;
  readonly columns: number;
  readonly table: MarkdownTable;
}

const blank = (columns: number): string[] =>
  Array.from({ length: columns }, () => "");

/** Rows padded to one width, so the ops below index columns unchecked. */
function findTableEditContext(
  doc: string,
  offset: number,
): TableEditContext | null {
  const found = tableAt(doc, offset);
  if (!found) return null;
  const columns = Math.max(
    found.align.length,
    ...found.rows.map((row) => row.length),
  );
  const table: MarkdownTable = {
    align: Array.from({ length: columns }, (_, i) => found.align[i] ?? "none"),
    lines: found.lines,
    rows: found.rows.map((row) =>
      Array.from({ length: columns }, (_, i) => row[i] ?? ""),
    ),
    start: found.start,
  };
  const at = cellAt(found, offset);
  return {
    cell: {
      column: Math.min(at.column, Math.max(0, columns - 1)),
      row: at.row,
    },
    columns,
    table,
  };
}

function edit(
  table: MarkdownTable,
  format: TableFormat,
  rows: readonly (readonly string[])[],
  align: readonly ColumnAlignment[] = table.align,
): Plan {
  // Keeps the indent: rewriting flush left pulls the table out of its list.
  const indent = /^[ \t]*/.exec(table.lines.at(table.start))?.[0] ?? "";
  const text = renderTable(rows, align, format)
    .split("\n")
    .map((line) => indent + line)
    .join("\n");
  return {
    changes: [
      replaceBlock(
        table.lines,
        table.start,
        // The old row count, not the new one: this is the range being replaced.
        table.start + table.rows.length,
        text,
      ),
    ],
  };
}

/** Deletes the block, taking the newline above it when it ends the file. */
function dropBlock(table: MarkdownTable): Plan {
  const { lines } = table;
  const last = table.start + table.rows.length;
  if (last + 1 < lines.count)
    return {
      changes: [
        { from: lines.start(table.start), to: lines.start(last + 1), text: "" },
      ],
    };
  const from =
    table.start > 0 ? lines.end(table.start - 1) : lines.start(table.start);
  return { changes: [{ from, to: lines.end(last), text: "" }] };
}

function insertAt<T>(list: readonly T[], at: number, item: T): T[] {
  return [...list.slice(0, at), item, ...list.slice(at)];
}

function dropAt<T>(list: readonly T[], at: number): T[] {
  return [...list.slice(0, at), ...list.slice(at + 1)];
}

function swapAt<T>(list: readonly T[], a: number, b: number): T[] {
  const out = [...list];
  const from = out[a];
  const to = out[b];
  if (from !== undefined && to !== undefined) {
    out[a] = to;
    out[b] = from;
  }
  return out;
}
/** Above the header is impossible: the header is the first line by definition. */
export function insertRowAbove(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return NO_CHANGE;
  const { cell, columns, table } = hit;
  const at = Math.max(1, cell.row);
  const plan = edit(table, format, insertAt(table.rows, at, blank(columns)));
  const change = plan.changes[0];
  if (!change) return NO_CHANGE;
  // Rendered line 0 is the header and line 1 the rule, so row `at` is `at + 1`.
  const caret = change.from + cellOffset(change.text, at + 1, 0);
  return { changes: plan.changes, select: { from: caret, to: caret } };
}

export function insertColumnLeft(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return NO_CHANGE;
  const { cell, table } = hit;
  return edit(
    table,
    format,
    table.rows.map((row) => insertAt(row, cell.column, "")),
    insertAt(table.align, cell.column, "none"),
  );
}

/** Deleting the last row deletes the table: a header alone is not a table. */
export function deleteRow(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return NO_CHANGE;
  const { cell, table } = hit;
  if (table.rows.length === 1) return dropBlock(table);
  return edit(table, format, dropAt(table.rows, cell.row));
}

export function deleteColumn(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return NO_CHANGE;
  const { cell, columns, table } = hit;
  // Empties rather than deletes: the header is worth keeping.
  if (columns === 1)
    return edit(
      table,
      format,
      table.rows.map(() => [""]),
    );
  return edit(
    table,
    format,
    table.rows.map((row) => dropAt(row, cell.column)),
    dropAt(table.align, cell.column),
  );
}

export function moveRow(
  doc: string,
  offset: number,
  format: TableFormat,
  delta: number,
): Plan {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return NO_CHANGE;
  const { cell, table } = hit;
  const to = cell.row + delta;
  if (to < 0 || to >= table.rows.length) return NO_CHANGE;
  return edit(table, format, swapAt(table.rows, cell.row, to));
}

export function moveColumn(
  doc: string,
  offset: number,
  format: TableFormat,
  delta: number,
): Plan {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return NO_CHANGE;
  const { cell, columns, table } = hit;
  const to = cell.column + delta;
  if (to < 0 || to >= columns) return NO_CHANGE;
  return edit(
    table,
    format,
    table.rows.map((row) => swapAt(row, cell.column, to)),
    swapAt(table.align, cell.column, to),
  );
}

export function alignColumn(
  doc: string,
  offset: number,
  format: TableFormat,
  align: ColumnAlignment,
): Plan {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return NO_CHANGE;
  const { cell, table } = hit;
  return edit(
    table,
    format,
    table.rows,
    table.align.map((value, column) =>
      column === cell.column ? align : value,
    ),
  );
}

export function formatTable(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  const hit = findTableEditContext(doc, offset);
  return hit ? edit(hit.table, format, hit.table.rows) : NO_CHANGE;
}

export function formatAllTables(doc: string, format: TableFormat): Plan {
  const lines = new Lines(doc);
  const fenced = fencedLines(lines);
  const changes: Change[] = [];
  let line = 0;
  while (line < lines.count) {
    const table = tableScan(lines, fenced, line);
    if (!table) {
      line++;
      continue;
    }
    changes.push(...edit(table, format, table.rows).changes);
    // `rows` leaves out the delimiter row, so the block spans one line more.
    line = table.start + table.rows.length + 1;
  }
  return { changes: order(changes) };
}

/** Sorts the body by the column under the caret. The header never moves. */
export function sortRows(
  doc: string,
  offset: number,
  format: TableFormat,
  descending: boolean,
): Plan {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return NO_CHANGE;
  const { cell, table } = hit;
  const [header, ...body] = table.rows;
  if (!header || body.length < 2) return NO_CHANGE;
  const collator = new Intl.Collator("en-US", {
    numeric: true,
    sensitivity: "base",
  });
  const key = (row: readonly string[]): string => row[cell.column] ?? "";
  const sorted = body
    .slice()
    .sort((a, b) =>
      descending
        ? collator.compare(key(b), key(a))
        : collator.compare(key(a), key(b)),
    );
  return edit(table, format, [header, ...sorted]);
}
/** Offset of the first character of `column` on rendered line `line`. */
function cellOffset(rendered: string, line: number, column: number): number {
  const lines = rendered.split("\n");
  const target = lines[line] ?? "";
  let before = 0;
  for (let i = 0; i < line; i++) before += (lines[i] ?? "").length + 1;

  let pipes = 0;
  for (let i = 0; i < target.length; i++) {
    const char = target[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char !== "|") continue;
    pipes++;
    if (pipes === column + 1) return before + i + 2;
  }
  return before + target.length;
}

/** `null` outside a table, so the caller lets Enter through. */
export function planTableEnter(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan | null {
  const hit = findTableEditContext(doc, offset);
  if (!hit) return null;
  const { cell, columns, table } = hit;

  const rows = [...table.rows];
  if (cell.row >= rows.length - 1) rows.push(blank(columns));

  const plan = edit(table, format, rows);
  const change = plan.changes[0];
  if (!change) return null;
  // Rendered line 0 is the header and line 1 the rule, so row `i` is `i + 1`.
  const caret =
    change.from + cellOffset(change.text, cell.row + 2, cell.column);
  return { changes: plan.changes, select: { from: caret, to: caret } };
}
