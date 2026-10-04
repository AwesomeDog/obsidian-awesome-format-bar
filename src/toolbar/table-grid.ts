import { t } from "../i18n/i18n";
import type { CommandSpec } from "../model/types";
import { openFloatingLayer } from "./floating";
import type { ToolbarHost } from "./host";

/** Word's grid: ten columns by eight rows, swept with the mouse. */
const COLUMNS = 10;
const ROWS = 8;
/** A Markdown table of one row is only a header, which is not a table. */
const MIN_COLUMN = 1;
const MIN_ROW = 1;

/** Enter and Space come free: the cells are buttons. Arrows do not. */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** The size grid: the only popup that keeps a state while the pointer moves. */
export function openTableGrid(
  anchor: HTMLElement,
  spec: CommandSpec,
  host: ToolbarHost,
): void {
  const layer = openFloatingLayer(anchor, () => host.focusEditor());
  const label = layer.el.createDiv({ cls: "table-grid-size" });
  const grid = layer.el.createDiv({ cls: "table-grid" });
  grid.style.setProperty("--formatbar-grid-columns", String(COLUMNS));

  // Zero-based cell under the pointer, which is also the size: `3x4` is (2, 3).
  let column = MIN_COLUMN;
  let row = MIN_ROW;
  const cells: HTMLButtonElement[] = [];

  const paint = (): void => {
    const size = t("{columns} × {rows} Table", {
      columns: String(column + 1),
      rows: String(row + 1),
    });
    label.setText(size);
    for (let at = 0; at < cells.length; at++) {
      const cell = cells[at];
      if (!cell) continue;
      const picked = at % COLUMNS <= column && Math.floor(at / COLUMNS) <= row;
      cell.toggleClass("is-picked", picked);
      // One tab stop: the size is the focus, not each of the eighty cells.
      cell.tabIndex = picked && at === row * COLUMNS + column ? 0 : -1;
    }
    // Only the focused cell is ever announced, so it is the one to name.
    cells[row * COLUMNS + column]?.setAttribute("aria-label", size);
  };

  const choose = (): void => {
    layer.close();
    host.execute(spec, `${column + 1}x${row + 1}`);
  };

  const move = (nextColumn: number, nextRow: number): void => {
    column = Math.min(COLUMNS - 1, Math.max(MIN_COLUMN, nextColumn));
    row = Math.min(ROWS - 1, Math.max(MIN_ROW, nextRow));
    paint();
    cells[row * COLUMNS + column]?.focus();
  };

  for (let at = 0; at < COLUMNS * ROWS; at++) {
    const cell = grid.createEl("button", {
      attr: { "aria-label": spec.name, type: "button" },
      cls: "table-grid-cell",
    });
    const atColumn = at % COLUMNS;
    const atRow = Math.floor(at / COLUMNS);
    // Hover previews on the desktop; a touch has no hover, so the tap itself
    // has to set the size before the click chooses it.
    cell.addEventListener("mouseenter", () => move(atColumn, atRow));
    cell.addEventListener("pointerdown", () => move(atColumn, atRow));
    cell.addEventListener("click", choose);
    cells.push(cell);
  }
  grid.addEventListener("keydown", (event) => {
    const step = ARROWS[event.key];
    if (!step) return;
    event.preventDefault();
    move(column + step[0], row + step[1]);
  });

  paint();
  layer.place();
  cells[row * COLUMNS + column]?.focus();
}
