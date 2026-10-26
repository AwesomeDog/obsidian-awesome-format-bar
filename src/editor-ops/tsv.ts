import { replaceBlock } from "./lines";
import { NO_CHANGE, type Plan } from "./plan";
import { renderTable, tableAt, type TableFormat } from "./table";

/** `null` means one column, so "Smith, John" does not read as two. */
function detectDelimiter(text: string): string | null {
  const tabs = (text.match(/\t/g) ?? []).length;
  if (tabs > 0) return "\t";
  if ((text.match(/,/g) ?? []).length === 0) return null;
  if (text.includes('"')) return ",";
  return /,\s|\s,/u.test(text) ? null : ",";
}

/** Without quoting, a cell holding a comma or newline splits silently. */
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

  return renderTable(rows, [], format);
}

/** RFC 4180: quote only when the bare cell would break the row. */
function quoteCell(cell: string, delimiter: string): string {
  const bare =
    !cell.includes(delimiter) && !cell.includes('"') && !/[\r\n]/.test(cell);
  return bare ? cell : `"${cell.replace(/"/g, '""')}"`;
}

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

/** Values stay strings: a `007` turned into a number is data loss. */
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

/** A blank header or a duplicate name is filled in, the way Power Query does. */
function keysFor(header: readonly string[]): readonly string[] {
  const used = new Map<string, number>();
  return header.map((cell, index) => {
    const base = cell === "" ? `column-${index + 1}` : cell;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  });
}
