import { Platform } from "obsidian";
import { t } from "../i18n/i18n";
import {
  frequentlyUsed,
  groupsOf,
  loadCharSources,
  pruneUsage,
  searchCharacters,
  type CharEntry,
} from "../model/characters";
import type { CommandSpec } from "../model/types";
import { createTabButton } from "./button";
import { openFloatingLayer } from "./floating";
import type { ToolbarHost } from "./host";
import { resolveIcon } from "./icons";

/** Chip label: the word it replaced was several times wider than the rest. */
const FREQUENT = "🕘";

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

  let query = "";
  let focusIndex = -1; // -1 is the search box
  let columns = 8;
  let items: readonly CharEntry[] = [];
  let cells: HTMLButtonElement[] = [];
  let sourceIndex = 0;
  let group = ""; // empty means "the default for this source"
  let lastPicked: CharEntry | null = null;
  let statusTimer: number | null = null;

  const layer = openFloatingLayer(
    anchor,
    () => host.focusEditor(),
    undefined,
    () => {
      // If search has text, Escape clears search first instead of closing the panel.
      if (query.trim() !== "") {
        clearSearch();
        return false;
      }
      return true;
    },
  );

  layer.el.addClass("is-char-panel");
  const usage = host.charUsage();
  pruneUsage(usage);

  // 1. Search Box with Icon and Clear Button
  const searchWrapper = layer.el.createDiv({ cls: "char-search-wrapper" });
  const searchIconEl = searchWrapper.createSpan({ cls: "char-search-icon" });
  resolveIcon(searchIconEl, "search");

  const searchEl = searchWrapper.createEl("input", {
    attr: {
      "aria-label": t("Search characters"),
      autocomplete: "off",
      placeholder: t("Search…"),
      spellcheck: "false",
      type: "search",
    },
    cls: "char-search-input",
  });

  const clearBtn = searchWrapper.createEl("button", {
    attr: {
      "aria-label": "Clear search",
      tabindex: "-1",
      type: "button",
    },
    cls: "char-search-clear is-hidden",
  });
  resolveIcon(clearBtn, "x");

  // 2. Top-level Source Tabs (Segmented Control: Emoji / Kaomoji / Symbols)
  const sourceTabsEl = layer.el.createDiv({
    attr: { role: "tablist" },
    cls: "char-source-tabs",
  });

  // 3. Category Navigation (Single-row horizontal scrollable chips)
  const categoryNavEl = layer.el.createDiv({
    attr: { "aria-label": "Categories", role: "tablist" },
    cls: "char-category-nav",
  });

  // Map vertical mouse wheel to horizontal scroll for convenient desktop browsing
  categoryNavEl.addEventListener(
    "wheel",
    (event: WheelEvent) => {
      if (event.deltaY && !event.deltaX) {
        event.preventDefault();
        categoryNavEl.scrollLeft += event.deltaY;
      }
    },
    { passive: false },
  );

  // 4. Character Grid
  const gridEl = layer.el.createDiv({ cls: "menu-grid" });

  // 5. Preview & Details Footer
  const footerEl = layer.el.createDiv({
    attr: { "aria-live": "polite" },
    cls: "char-preview-footer",
  });
  const previewIconEl = footerEl.createDiv({ cls: "char-preview-icon" });
  const previewDetailsEl = footerEl.createDiv({ cls: "char-preview-details" });
  const previewNameEl = previewDetailsEl.createDiv({
    cls: "char-preview-name",
  });
  const previewMetaEl = previewDetailsEl.createDiv({
    cls: "char-preview-meta",
  });

  function updatePreview(
    entry: CharEntry | null,
    statusOverride?: string,
  ): void {
    if (statusTimer) {
      window.clearTimeout(statusTimer);
      statusTimer = null;
    }

    if (entry) {
      previewIconEl.setText(entry.char);
      previewNameEl.setText(entry.name);
      previewMetaEl.setText(statusOverride ?? entry.group);
      previewMetaEl.toggleClass("is-status", Boolean(statusOverride));
    } else {
      previewIconEl.setText("✨");
      previewNameEl.setText(spec.name);
      previewMetaEl.setText(
        statusOverride ?? (lastPicked ? lastPicked.group : ""),
      );
      previewMetaEl.toggleClass("is-status", Boolean(statusOverride));
    }

    if (statusOverride) {
      statusTimer = window.setTimeout(() => {
        updatePreview(lastPicked);
      }, 1000);
    }
  }

  gridEl.addEventListener("mouseleave", () => {
    updatePreview(lastPicked);
  });

  /** Autofocusing a text field on mobile pops the keyboard over the panel. */
  function focusEl(el: HTMLElement): void {
    if (!Platform.isMobileApp) el.focus();
  }

  function clearSearch(): void {
    if (!query) return;
    searchEl.value = "";
    query = "";
    clearBtn.addClass("is-hidden");
    focusIndex = -1;
    render();
    focusEl(searchEl);
  }

  function setFocus(next: number): void {
    focusIndex = Math.max(-1, Math.min(next, cells.length - 1));
    if (focusIndex < 0) {
      focusEl(searchEl);
      updatePreview(lastPicked);
      return;
    }
    const cell = cells[focusIndex];
    if (!cell) return;
    focusEl(cell);
    cell.scrollIntoView({ block: "nearest" });
    const item = items[focusIndex];
    if (item) updatePreview(item);
  }

  function pick(candidate: CharEntry, cell?: HTMLElement): void {
    host.execute(spec, candidate.char);
    host.recordCharUsage(candidate.char);
    lastPicked = candidate;

    if (cell) {
      cell.addClass("is-inserted");
      window.setTimeout(() => cell.removeClass("is-inserted"), 250);
    }

    updatePreview(candidate, "Inserted");

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

    // 1. Render Segmented Source Tabs
    sourceTabsEl.replaceChildren();
    for (let i = 0; i < sources.length; i++) {
      const candidateSource = sources[i];
      if (!candidateSource) continue;
      createTabButton(sourceTabsEl, {
        active: i === sourceIndex,
        cls: "char-source-tab",
        onClick: () => {
          if (sourceIndex === i) return;
          sourceIndex = i;
          group = "";
          focusIndex = -1;
          render();
        },
        text: candidateSource.label,
      });
    }

    // 2. Render Category Navigation Chips (hidden when searching)
    categoryNavEl.replaceChildren();
    if (searching) {
      categoryNavEl.addClass("is-hidden");
    } else {
      categoryNavEl.removeClass("is-hidden");
      const categoryList = frequent.length > 0 ? [FREQUENT, ...names] : names;
      for (const cat of categoryList) {
        const isCatActive = cat === activeGroup;
        const chip = createTabButton(categoryNavEl, {
          active: isCatActive,
          cls: "char-category-chip",
          onClick: () => {
            if (group === cat) return;
            group = cat;
            focusIndex = -1;
            render();
            chip.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "nearest",
            });
          },
          text: cat,
        });

        if (isCatActive) {
          window.requestAnimationFrame(() => {
            chip.scrollIntoView({ block: "nearest", inline: "nearest" });
          });
        }
      }
    }

    // 3. Render Character Grid
    gridEl.replaceChildren();
    cells = [];
    if (items.length === 0) {
      gridEl.createDiv({ cls: "char-empty", text: t("No matches") });
      updatePreview(null);
      return;
    }

    for (const candidate of items) {
      const cell = gridEl.createEl("button", {
        attr: { "aria-label": candidate.name, type: "button" },
        cls: "char-cell",
        text: candidate.char,
      });
      cell.addEventListener("mouseenter", () => updatePreview(candidate));
      cell.addEventListener("focus", () => updatePreview(candidate));
      cell.addEventListener("click", () => pick(candidate, cell));
      cells.push(cell);
    }

    setFocus(focusIndex);
  }

  searchEl.addEventListener("input", () => {
    query = searchEl.value;
    clearBtn.toggleClass("is-hidden", query.length === 0);
    focusIndex = -1;
    render();
  });

  clearBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    clearSearch();
  });

  layer.el.addEventListener("keydown", (event) => {
    const inSearch = searchEl.ownerDocument.activeElement === searchEl;
    switch (event.key) {
      case "ArrowLeft":
        if (inSearch) return; // Allow normal caret navigation within search input
        setFocus(focusIndex - 1);
        break;
      case "ArrowRight":
        if (inSearch) return; // Allow normal caret navigation within search input
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
        if (target) {
          const targetCell = cells[inSearch ? 0 : focusIndex];
          pick(target, targetCell);
        }
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
  updatePreview(lastPicked);
  layer.place();
}
