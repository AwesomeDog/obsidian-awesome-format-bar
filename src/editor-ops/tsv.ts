import { renderTable, type TableFormat } from "./table";

/** Escaping and padding stay `renderTable`'s job, so output matches a table op. */

/** Counted over the whole text: a quoted cell may hold a newline. */
function detectDelimiter(text: string): string | null {
  const tabs = (text.match(/\t/g) ?? []).length;
  const commas = (text.match(/,/g) ?? []).length;
  if (tabs === 0 && commas === 0) return null;
  return tabs >= commas ? "\t" : ",";
}

/** Without quoting, a cell holding a comma or newline splits silently. */
function parseRows(text: string, delimiter: string): string[][] {
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
export function tableFromClipboard(
  text: string,
  format: TableFormat,
): string | null {
  const body = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (body.trim() === "") return null;

  const delimiter = detectDelimiter(body);
  if (!delimiter) return null;

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
