import {
  fenceMask,
  insertBlock,
  Lines,
  replaceBlock,
  sortByText,
} from "./lines";
import {
  lineOffset,
  NO_CHANGE,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";
import { insertText } from "./text";
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

/** A size or an alias: a pipe inside `[[…]]` is not a cell edge. */
const WIKI_LINK = /!?\[\[[^\]]*\]\]/g;

/** A table row, but never a bare `---` rule. */
export function isTableLine(line: string): boolean {
  return line.replace(WIKI_LINK, "").trim().includes("|");
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

export function tableAt(doc: string, offset: number): MarkdownTable | null {
  const lines = new Lines(doc);
  return tableScan(lines, fenceMask(lines), lines.lineOf(offset));
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

/** A grid pick arrives as `3x4`: columns first, the way Word labels them. */
export function parseTableSize(
  optionValue: string,
): { columns: number; rows: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(optionValue);
  if (!match) return null;
  const columns = Number(match[1]);
  const rows = Number(match[2]);
  // The grid counts the header, and a header alone is not a table.
  return columns >= 1 && rows >= 2 ? { columns, rows } : null;
}

/** `rows` counts the header, so a Markdown table is never shorter than two. */
export function emptyTable(
  columns: number,
  rows: number,
  format: TableFormat,
): string {
  const blank = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => ""),
  );
  return renderTable(blank, [], format);
}

/** Insert `table` as a block of its own, replacing `ranges`. */
export function insertTableBlock(
  doc: string,
  ranges: readonly Range[],
  table: string,
): Plan {
  // Word leaves the caret in the first cell, which starts after `| `.
  return insertBlock(doc, ranges, table, "| ".length);
}

/** Word's Convert to Text: one tab-separated line per row, header included. */
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

/** Every table op looks the caret's table up the same way; `miss` is the answer when
 * there is none: `NO_CHANGE` for a command, `null` to let Enter and Tab through. */
function withTable<T>(
  doc: string,
  offset: number,
  miss: T,
  run: (hit: TableEditContext) => T,
): T {
  const hit = findTableEditContext(doc, offset);
  return hit ? run(hit) : miss;
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
/** A blank row at row `at`, with the caret in its first cell. */
function insertRowAt(
  doc: string,
  offset: number,
  format: TableFormat,
  at: (row: number) => number,
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ cell, columns, table }) => {
    const row = at(cell.row);
    const plan = edit(table, format, insertAt(table.rows, row, blank(columns)));
    const change = plan.changes[0];
    // Rendered line 0 is the header and line 1 the rule, so row `row` is `row + 1`.
    if (!change) return NO_CHANGE;
    const caret = change.from + cellOffset(change.text, row + 1, 0);
    return { changes: plan.changes, select: { from: caret, to: caret } };
  });
}

/** Above the header is impossible: the header is the first line by definition. */
export function insertRowAbove(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  return insertRowAt(doc, offset, format, (row) => Math.max(1, row));
}

/** Below the last row appends; below the header is the first body row. */
export function insertRowBelow(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  return insertRowAt(doc, offset, format, (row) => row + 1);
}

/** A blank column at column `at`, `delta` cells from the caret's own. */
function insertColumnAt(
  doc: string,
  offset: number,
  format: TableFormat,
  delta: number,
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ cell, table }) => {
    const at = cell.column + delta;
    return edit(
      table,
      format,
      table.rows.map((row) => insertAt(row, at, "")),
      insertAt(table.align, at, "none"),
    );
  });
}

export function insertColumnLeft(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  return insertColumnAt(doc, offset, format, 0);
}

/** Right of the last column appends. */
export function insertColumnRight(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  return insertColumnAt(doc, offset, format, 1);
}

/** Deleting the last row deletes the table: a header alone is not a table. */
export function deleteRow(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ cell, table }) =>
    table.rows.length === 1
      ? dropBlock(table)
      : edit(table, format, dropAt(table.rows, cell.row)),
  );
}

export function deleteColumn(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ cell, columns, table }) =>
    // Empties rather than deletes: the header is worth keeping.
    columns === 1
      ? edit(
          table,
          format,
          table.rows.map(() => [""]),
        )
      : edit(
          table,
          format,
          table.rows.map((row) => dropAt(row, cell.column)),
          dropAt(table.align, cell.column),
        ),
  );
}

/** Word's Delete Table: the whole block goes, newlines and all. */
export function deleteTable(doc: string, offset: number): Plan {
  const found = tableAt(doc, offset);
  return found ? dropBlock(found) : NO_CHANGE;
}

export function moveRow(
  doc: string,
  offset: number,
  format: TableFormat,
  delta: number,
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ cell, table }) => {
    const to = cell.row + delta;
    if (to < 0 || to >= table.rows.length) return NO_CHANGE;
    return edit(table, format, swapAt(table.rows, cell.row, to));
  });
}

export function moveColumn(
  doc: string,
  offset: number,
  format: TableFormat,
  delta: number,
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ cell, columns, table }) => {
    const to = cell.column + delta;
    if (to < 0 || to >= columns) return NO_CHANGE;
    return edit(
      table,
      format,
      table.rows.map((row) => swapAt(row, cell.column, to)),
      swapAt(table.align, cell.column, to),
    );
  });
}

/** The columns a selection touches: aligning a span of cells aligns them all,
 * the way Word does. A selection inside one cell still yields one column. */
function columnsInRange(table: MarkdownTable, range: Range): number[] {
  const { lines } = table;
  const last = table.start + table.rows.length;
  const columns = new Set<number>();
  for (
    let line = Math.max(table.start, lines.lineOf(range.from));
    line <= Math.min(last, lines.lineOf(range.to));
    line++
  ) {
    const from = Math.max(range.from, lines.start(line));
    // `end` is the line terminator, so a range reaching it stops at the cell.
    const to = Math.min(range.to, lines.end(line));
    if (to <= from) continue;
    columns.add(cellAt(table, from).column);
    columns.add(cellAt(table, to - 1).column);
  }
  return [...columns];
}

export function alignColumn(
  doc: string,
  offset: number,
  format: TableFormat,
  align: ColumnAlignment,
  selection?: readonly Range[],
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ cell, table }) => {
    const columns = new Set([cell.column]);
    for (const range of selection ?? [])
      for (const column of columnsInRange(table, range)) columns.add(column);
    return edit(
      table,
      format,
      table.rows,
      table.align.map((value, column) => (columns.has(column) ? align : value)),
    );
  });
}

export function formatTable(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ table }) =>
    edit(table, format, table.rows),
  );
}

export function formatAllTables(doc: string, format: TableFormat): Plan {
  const lines = new Lines(doc);
  const fenced = fenceMask(lines);
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
  return withTable(doc, offset, NO_CHANGE, ({ cell, table }) => {
    const [header, ...body] = table.rows;
    if (!header || body.length < 2) return NO_CHANGE;
    const sorted = sortByText(
      body,
      (row) => row[cell.column] ?? "",
      descending,
    );
    return edit(table, format, [header, ...sorted]);
  });
}

/** Excel's Remove Duplicates: whole rows, header excluded. `removed` is what the
 * caller reports; `null` means there was no table at all. */
export function removeDuplicateRows(
  doc: string,
  offset: number,
  format: TableFormat,
): { plan: Plan; removed: number | null } {
  return withTable(
    doc,
    offset,
    { plan: NO_CHANGE, removed: null },
    ({ table }) => {
      const [header, ...body] = table.rows;
      if (!header) return { plan: NO_CHANGE, removed: null };

      const seen = new Set<string>();
      const kept = body.filter((row) => {
        // `JSON.stringify`: no separator can occur inside a cell.
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const removed = body.length - kept.length;
      if (removed === 0) return { plan: NO_CHANGE, removed };
      return { plan: edit(table, format, [header, ...kept]), removed };
    },
  );
}

/** Shift+Enter inside a cell: GFM keeps a row on one line, so the break has to be `<br>`.
 * `null` outside a table, so the editor keeps its own Shift+Enter there. */
export function insertCellBreak(
  doc: string,
  ranges: readonly Range[],
): Plan | null {
  const cells = ranges.filter((range) => tableAt(doc, range.from));
  return cells.length === 0 ? null : insertText(doc, cells, "<br>");
}

/** Transposes the header and body while regenerating the delimiter row. */
export function transposeTable(
  doc: string,
  offset: number,
  format: TableFormat,
): Plan {
  return withTable(doc, offset, NO_CHANGE, ({ cell, columns, table }) => {
    const rows = Array.from({ length: columns }, (_, column) =>
      Array.from(
        { length: table.rows.length },
        (_, row) => table.rows[row]?.[column] ?? "",
      ),
    );
    // Alignment belongs to columns; after transposition the new columns were rows.
    const align = Array.from(
      { length: table.rows.length },
      () => "none" as const,
    );
    const plan = edit(table, format, rows, align);
    const change = plan.changes[0];
    if (!change) return NO_CHANGE;

    // Keep the caret in the corresponding logical cell: (row, column) -> (column, row).
    const targetRow = Math.min(cell.column, rows.length - 1);
    const targetColumn = Math.min(cell.row, table.rows.length - 1);
    const renderedLine = targetRow === 0 ? 0 : targetRow + 1;
    const caret =
      change.from + cellOffset(change.text, renderedLine, targetColumn);
    return { changes: plan.changes, select: { from: caret, to: caret } };
  });
}

/** Offset of the first character of `column` on rendered line `line`. */
function cellOffset(rendered: string, line: number, column: number): number {
  const lines = rendered.split("\n");
  const target = lines[line] ?? "";
  const before = lineOffset(lines, line);

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
  return withTable(doc, offset, null, ({ cell, columns, table }) => {
    const rows = [...table.rows];
    if (cell.row >= rows.length - 1) rows.push(blank(columns));

    const plan = edit(table, format, rows);
    const change = plan.changes[0];
    if (!change) return null;
    // Rendered line 0 is the header and line 1 the rule, so row `i` is `i + 1`.
    const caret =
      change.from + cellOffset(change.text, cell.row + 2, cell.column);
    return { changes: plan.changes, select: { from: caret, to: caret } };
  });
}

/** Tab moves horizontally; the right edge grows the table by one column. */
export function planTableTab(
  doc: string,
  offset: number,
  format: TableFormat,
  backwards: boolean,
): Plan | null {
  return withTable(doc, offset, null, ({ cell, columns, table }) => {
    let row = cell.row;
    let column = cell.column;
    let rows = table.rows;
    let align = table.align;

    if (backwards) {
      if (column > 0) column--;
      else if (row > 0) {
        row--;
        column = columns - 1;
      }
    } else if (column + 1 < columns) column++;
    else {
      rows = table.rows.map((current) => [...current, ""]);
      align = [...table.align, "none"];
      column++;
    }

    const plan = edit(table, format, rows, align);
    const change = plan.changes[0];
    if (!change) return null;
    const renderedLine = row === 0 ? 0 : row + 1;
    const value = rows[row]?.[column] ?? "";
    const caret = change.from + cellOffset(change.text, renderedLine, column);
    if (value === "")
      return { changes: plan.changes, select: { from: caret, to: caret } };

    const lines = change.text.split("\n");
    const before = lineOffset(lines, renderedLine);
    const raw = escapeCell(value);
    const lineText = lines[renderedLine] ?? "";
    const start = Math.max(0, caret - change.from - before);
    const content = lineText.indexOf(raw, start);
    if (content < 0)
      return { changes: plan.changes, select: { from: caret, to: caret } };
    return {
      changes: plan.changes,
      select: {
        from: change.from + before + content,
        to: change.from + before + content + raw.length,
      },
    };
  });
}
