import { replaceBlock } from "./lines";
import { NO_CHANGE, type Plan } from "./plan";
import { renderTable, tableAt, type TableFormat } from "./table";

/** Escaping and padding stay `renderTable`'s job, so output matches a table op. */

/** `null` means one column. Excel copies one column without any tab, so
 * reading "Smith, John" as two fields would silently corrupt it; a real CSV
 * never puts a space beside its comma, and quotes a field that holds one. */
function detectDelimiter(text: string): string | null {
  const tabs = (text.match(/\t/g) ?? []).length;
  if (tabs > 0) return "\t";
  if ((text.match(/,/g) ?? []).length === 0) return null;
  if (text.includes('"')) return ",";
  return /,\s|\s,/u.test(text) ? null : ",";
}

/** Without quoting, a cell holding a comma or newline splits silently.
 * A `null` delimiter splits on newlines only, so each line is one cell. */
function parseRows(text: string, delimiter: string | null): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') {
        cell += char;
        continue;
      }
      if (text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = false;
      continue;
    }
    if (char === '"' && cell === "") {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\r") continue;
    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

/** `null` when it cannot become a table; the caller tells the user. */
export function tableFromDelimited(
  text: string,
  format: TableFormat,
): string | null {
  const body = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (body.trim() === "") return null;

  const delimiter = detectDelimiter(body);
  const rows = parseRows(body, delimiter).map((row) =>
    row.map((cell) => cell.trim()),
  );
  while (
    rows.length > 1 &&
    (rows[rows.length - 1] ?? []).every((cell) => cell === "")
  )
    rows.pop();
  if (rows.length < 2) return null;

  // The first line becomes the header; adding one by hand beats a setting.
  return renderTable(rows, [], format);
}

/** RFC 4180: quote only when the bare cell would break the row. A leading
 * quote counts, or the reader would take it for the start of a quoted field. */
function quoteCell(cell: string, delimiter: string): string {
  const bare =
    !cell.includes(delimiter) && !cell.includes('"') && !/[\r\n]/.test(cell);
  return bare ? cell : `"${cell.replace(/"/g, '""')}"`;
}

/** Short rows pad out to the widest one: a ragged row reads as a broken file. */
export function delimitedFromTable(
  rows: readonly (readonly string[])[],
  delimiter: string,
): string {
  const columns = Math.max(0, ...rows.map((row) => row.length));
  return rows
    .map((row) =>
      Array.from({ length: columns }, (_, column) =>
        quoteCell(row[column] ?? "", delimiter),
      ).join(delimiter),
    )
    .join("\n");
}

/** Tab-separated and quoted like the Copy as TSV command: a cell holding a tab
 * would otherwise shift every column after it. */
export function tableToText(doc: string, offset: number): Plan {
  const found = tableAt(doc, offset);
  if (!found) return NO_CHANGE;
  const text = delimitedFromTable(found.rows, "\t");
  return {
    changes: [
      replaceBlock(
        found.lines,
        found.start,
        found.start + found.rows.length,
        text,
      ),
    ],
  };
}

/** Header row first: its cells name the keys, the rest become one record each.
 * Values stay strings — a `007` or `1.50` turned into a number is data loss,
 * and a Markdown table carries no type to put back. */
export function jsonFromTable(rows: readonly (readonly string[])[]): string {
  const [header, ...body] = rows;
  if (!header) return "[]";
  const keys = keysFor(header);
  return JSON.stringify(
    body.map((row) =>
      Object.fromEntries(keys.map((key, column) => [key, row[column] ?? ""])),
    ),
  );
}

/** A Markdown table allows two things JSON keys do not: a blank header and two
 * columns of the same name. Excel's Power Query fills those in as `Column3` and
 * `Name2`; matching it beats silently dropping one of the columns. */
function keysFor(header: readonly string[]): readonly string[] {
  const used = new Map<string, number>();
  return header.map((cell, index) => {
    const base = cell === "" ? `column-${index + 1}` : cell;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  });
}
