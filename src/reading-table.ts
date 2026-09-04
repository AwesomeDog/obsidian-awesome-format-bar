/** Reading view only: the rendered rows move, the file does not. */
const COLLATOR = new Intl.Collator("en-US", {
  numeric: true,
  sensitivity: "base",
});

/** Ascending, then descending, then back to the order Obsidian rendered. */
type Order = "asc" | "desc" | "none";

const NEXT: Readonly<Record<Order, Order>> = {
  asc: "desc",
  desc: "none",
  none: "asc",
};

/** On the cell, not the table: the arrow belongs to a column. */
const SORT_ATTR = "data-format-bar-sort";

interface TableState {
  column: number;
  order: Order;
  /** The row order Obsidian rendered, so the third click can restore it. */
  readonly original: readonly HTMLTableRowElement[];
}

/** WeakMap: state stays out of the HTML and drops when Obsidian re-renders. */
const STATES = new WeakMap<HTMLTableElement, TableState>();

export function sortTableOnHeaderClick(evt: MouseEvent): void {
  const target = evt.target;
  if (!(target instanceof HTMLElement)) return;

  const header = target.closest("th");
  const table = header?.closest("table");
  // Reading view only; a table in the editor belongs to the editor.
  if (!header || !table?.closest(".markdown-preview-view")) return;

  const body = table.tBodies[0];
  if (!body || body.rows.length < 2) return;

  const column = Array.from(header.parentElement?.children ?? []).indexOf(
    header,
  );
  if (column < 0) return;

  let state = STATES.get(table);
  if (!state)
    state = { column: -1, order: "none", original: Array.from(body.rows) };
  // A different column starts over at ascending; the same one cycles on.
  const order = state.column === column ? NEXT[state.order] : "asc";
  state.column = column;
  state.order = order;
  STATES.set(table, state);

  // One arrow at a time: the other headers go back to the idle one.
  for (const cell of Array.from(header.parentElement?.children ?? []))
    cell.removeAttribute(SORT_ATTR);
  if (order !== "none") header.setAttribute(SORT_ATTR, order);

  const key = (row: HTMLTableRowElement): string =>
    row.cells[column]?.textContent?.trim() ?? "";
  const rows =
    order === "none"
      ? [...state.original]
      : Array.from(body.rows).sort((a, b) =>
          order === "desc"
            ? COLLATOR.compare(key(b), key(a))
            : COLLATOR.compare(key(a), key(b)),
        );
  for (const row of rows) body.appendChild(row);
}
