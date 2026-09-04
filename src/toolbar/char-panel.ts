import { Platform, setTooltip } from "obsidian";
import {
  frequentlyUsed,
  groupsOf,
  loadCharSources,
  pruneUsage,
  searchCharacters,
  type CharEntry,
} from "../model/characters";
import type { CommandSpec } from "../model/types";
import { openFloatingLayer } from "./floating";
import type { ToolbarHost } from "./host";

const FREQUENT = "Frequently used";

/** Kaomoji are whole sentences; two columns is the only readable layout. */
const COLUMNS: Readonly<Record<string, number>> = {
  emoji: 8,
  kaomoji: 2,
  symbols: 8,
};

/** Inserting does not close the panel, so several entries can go in a row. */
export async function openCharPanel(
  anchor: HTMLElement,
  spec: CommandSpec,
  host: ToolbarHost,
): Promise<void> {
  // Awaited before the layer opens: there is nothing to draw without it.
  const sources = await loadCharSources();
  const layer = openFloatingLayer(anchor, () => host.focusEditor());
  // Scrolls the grid, not the layer, so the search box stays put.
  layer.el.addClass("is-char-panel");
  const usage = host.charUsage();
  // Bounded before anything reads it: the map is re-saved on every insert.
  pruneUsage(usage);

  let sourceIndex = 0;
  let group = ""; // empty means "the default for this source"
  let query = "";
  let focusIndex = -1; // -1 is the search box
  let columns = 8;
  let items: readonly CharEntry[] = [];
  let cells: HTMLButtonElement[] = [];

  const searchEl = layer.el.createEl("input", {
    attr: {
      "aria-label": "Search characters",
      placeholder: "Search…",
      type: "search",
    },
    cls: "char-search",
  });
  const tabsEl = layer.el.createDiv({ cls: "char-tabs" });
  const groupsEl = layer.el.createDiv({ cls: "char-tabs" });
  const gridEl = layer.el.createDiv({ cls: "menu-grid" });

  /** Autofocusing a text field on mobile pops the keyboard over the panel. */
  function focusEl(el: HTMLElement): void {
    if (!Platform.isMobileApp) el.focus();
  }

  function renderTabs(
    parent: HTMLElement,
    labels: readonly string[],
    active: string,
    onPick: (label: string) => void,
  ): void {
    parent.replaceChildren();
    for (const label of labels) {
      const tab = parent.createEl("button", {
        attr: { type: "button" },
        cls: `char-tab${label === active ? " is-active" : ""}`,
        text: label,
      });
      tab.addEventListener("click", () => onPick(label));
    }
  }

  function setFocus(next: number): void {
    focusIndex = Math.max(-1, Math.min(next, cells.length - 1));
    if (focusIndex < 0) {
      focusEl(searchEl);
      return;
    }
    const cell = cells[focusIndex];
    if (!cell) return;
    focusEl(cell);
    cell.scrollIntoView({ block: "nearest" });
  }

  function pick(candidate: CharEntry): void {
    host.execute(spec, candidate.char);
    host.recordCharUsage(candidate.char);
    // Only Frequently used can reorder, so a search needs no rebuild.
    if (!query.trim()) render();
  }

  function render(): void {
    const source = sources[sourceIndex];
    if (!source) return;

    columns = COLUMNS[source.id] ?? 8;
    gridEl.style.setProperty("--formatbar-menu-columns", String(columns));
    gridEl.toggleClass("is-wide", columns <= 2);

    const searching = query.trim() !== "";
    const names = groupsOf(source.entries);
    const frequent = searching ? [] : frequentlyUsed(source.entries, usage);
    const activeGroup =
      group || (frequent.length > 0 ? FREQUENT : (names[0] ?? ""));
    // Sticky, or the first pick makes Frequently used appear under the cursor.
    group = activeGroup;

    items = searching
      ? searchCharacters(source.entries, query)
      : activeGroup === FREQUENT
        ? frequent
        : source.entries.filter((c) => c.group === activeGroup);

    renderTabs(
      tabsEl,
      sources.map((candidate) => candidate.label),
      source.label,
      (label) => {
        const next = sources.findIndex((c) => c.label === label);
        if (next < 0) return;
        sourceIndex = next;
        group = "";
        focusIndex = -1;
        render();
      },
    );

    // No chips while searching: results already span the whole source.
    renderTabs(
      groupsEl,
      searching ? [] : frequent.length > 0 ? [FREQUENT, ...names] : names,
      activeGroup,
      (label) => {
        group = label;
        focusIndex = -1;
        render();
      },
    );

    gridEl.replaceChildren();
    cells = [];
    if (items.length === 0) {
      gridEl.createDiv({ cls: "char-empty", text: "No matches" });
      return;
    }
    for (const candidate of items) {
      const cell = gridEl.createEl("button", {
        attr: { "aria-label": candidate.name, type: "button" },
        cls: "char-cell",
        text: candidate.char,
      });
      // TODO: this tooltip does not appear. The same call works on the toolbar
      setTooltip(cell, candidate.name);
      cell.addEventListener("click", () => pick(candidate));
      cells.push(cell);
    }
    setFocus(focusIndex);
  }

  searchEl.addEventListener("input", () => {
    query = searchEl.value;
    focusIndex = -1;
    render();
  });

  layer.el.addEventListener("keydown", (event) => {
    // Pop-out windows: the global `document` reports the main window's focus.
    const inSearch = searchEl.ownerDocument.activeElement === searchEl;
    switch (event.key) {
      case "ArrowLeft":
        setFocus(focusIndex - 1);
        break;
      case "ArrowRight":
        setFocus(focusIndex + 1);
        break;
      case "ArrowDown":
        setFocus(inSearch ? 0 : focusIndex + columns);
        break;
      case "ArrowUp":
        setFocus(focusIndex >= columns ? focusIndex - columns : -1);
        break;
      case "Enter": {
        const target = items[inSearch ? 0 : focusIndex];
        if (target) pick(target);
        break;
      }
      default:
        // Typing reaches the search box wherever focus currently sits.
        if (
          !inSearch &&
          event.key.length === 1 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey
        ) {
          focusEl(searchEl);
        }
        return;
    }
    event.preventDefault();
  });

  render();
  layer.place();
}
