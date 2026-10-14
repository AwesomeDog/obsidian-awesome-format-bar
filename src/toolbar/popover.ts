import { setTooltip } from "obsidian";
import Picker from "vanilla-picker/csp";
import { t } from "../i18n/i18n";
import { onLocalFonts } from "../model/fonts";
import { popupSections, type PopupChoice } from "../model/popups";
import { STANDARD_COLORS } from "../model/palettes";
import type { CommandSpec } from "../model/types";
import { filterSections } from "../model/popups";
import { openFloatingLayer, type FloatingLayer } from "./floating";
import type { ToolbarHost } from "./host";
import { resolveIcon } from "./icons";

/** Sections of the plain menu: the overflow list, both color palettes, and case. */
export interface PopoverSection {
  readonly title?: string;
  readonly items: readonly PopoverItem[];
  readonly grid?: number;
}

export interface PopoverItem {
  readonly label: string;
  readonly icon?: string;
  readonly swatch?: string;
  /** A CSS font stack: the label is drawn in it. */
  readonly preview?: string;
  /** The machine does not have this font. */
  readonly dim?: boolean;
  readonly disabled?: boolean;
  readonly onChoose: () => void;
}

interface PopoverLayerOptions {
  readonly search?: boolean;
  readonly onDismiss?: () => void;
  /** Told when the sections change underneath; returns how to stop being told. */
  readonly watch?: (onChange: () => void) => () => void;
}

/** What to draw for a search term. A menu without a search box ignores it. */
type SectionsFor = (query: string) => readonly PopoverSection[];

export function openPopover(
  anchor: HTMLElement,
  sections: readonly PopoverSection[],
  onDismiss?: () => void,
): void {
  renderPopover(anchor, () => sections, { onDismiss });
}

/** The font drop-down: the same menu with a search box on top. */
export function openFontPopover(
  anchor: HTMLElement,
  sectionsFor: SectionsFor,
  onDismiss?: () => void,
): void {
  renderPopover(anchor, sectionsFor, {
    onDismiss,
    search: true,
    watch: onLocalFonts,
  });
}

function renderPopover(
  anchor: HTMLElement,
  sectionsFor: SectionsFor,
  options: PopoverLayerOptions,
): void {
  // Set once the box exists: Escape clears it before it closes the layer.
  let clearSearch: (() => boolean) | null = null;
  let unwatch: (() => void) | null = null;
  const layer = openFloatingLayer(
    anchor,
    options.onDismiss,
    () => unwatch?.(),
    () => (clearSearch ? clearSearch() : true),
  );
  const searchEl = options.search ? createSearchBox(layer.el) : null;
  const body = layer.el.createDiv();

  // Redrawn, not pruned: a filter is a new list and drawing one is cheap.
  const draw = (visible: readonly PopoverSection[]): void => {
    body.empty();
    for (const section of visible) addSection(body, section, layer);
    layer.place();
  };

  draw(sectionsFor(""));

  if (searchEl) {
    searchEl.addEventListener("input", () => draw(sectionsFor(searchEl.value)));
    clearSearch = () => {
      if (searchEl.value === "") return true;
      searchEl.value = "";
      draw(sectionsFor(""));
      return false;
    };
    searchEl.focus();
  }

  // The read can land while the menu is open: redraw, or it stays on "reading".
  if (options.watch)
    unwatch = options.watch(() => draw(sectionsFor(searchEl?.value ?? "")));
}

function addSection(
  parent: HTMLElement,
  section: PopoverSection,
  layer: FloatingLayer,
): void {
  const sectionEl = parent.createDiv({ cls: "menu-section" });
  if (section.title)
    sectionEl.createDiv({ cls: "menu-title", text: section.title });
  // Only the grid needs a wrapper, to hang the column count on.
  const list = section.grid
    ? sectionEl.createDiv({ cls: "menu-grid" })
    : sectionEl;
  if (section.grid)
    list.style.setProperty("--formatbar-menu-columns", String(section.grid));

  for (const item of section.items) {
    const entry = list.createEl("button", {
      attr: {
        "aria-disabled": String(Boolean(item.disabled)),
        type: "button",
      },
      cls: item.swatch ? "swatch" : "menu-item",
    });
    entry.disabled = Boolean(item.disabled);
    if (item.swatch) entry.style.backgroundColor = item.swatch;
    else {
      if (item.icon) resolveIcon(entry, item.icon);
      entry.createSpan({ text: item.label });
    }
    if (item.preview) entry.style.fontFamily = item.preview;
    if (item.dim) entry.addClass("is-unavailable");
    setTooltip(entry, item.label);
    if (!item.disabled)
      entry.addEventListener("click", () => {
        layer.close();
        item.onChoose();
      });
  }
}

function createSearchBox(parent: HTMLElement): HTMLInputElement {
  const wrapper = parent.createDiv({ cls: "menu-search-wrapper" });
  const icon = wrapper.createSpan({ cls: "menu-search-icon" });
  resolveIcon(icon, "search");
  return wrapper.createEl("input", {
    attr: {
      "aria-label": t("Search fonts…"),
      autocomplete: "off",
      placeholder: t("Search fonts…"),
      spellcheck: "false",
      type: "search",
    },
    cls: "menu-search-input",
  });
}

/** Renders inline in the floating layer rather than in the picker's own popup. */
function openColorPicker(
  anchor: HTMLElement,
  host: ToolbarHost,
  onPick: (hex: string) => void,
): void {
  const layer = openFloatingLayer(
    anchor,
    () => host.focusEditor(),
    () => picker.destroy(),
  );
  layer.el.addClass("is-color-picker");

  const picker = new Picker({
    alpha: false,
    cancelButton: true,
    color: STANDARD_COLORS[0],
    parent: layer.el,
    popup: false,
    // `hex` keeps eight digits even with alpha off.
    onDone: (color) => {
      onPick(color.hex.slice(0, 7));
      layer.close();
    },
  });
  layer.el
    .querySelector<HTMLButtonElement>(".picker_cancel button")
    ?.addEventListener("click", () => layer.close());

  layer.place();
}

/** One choice as the popover draws it. */
function toItem(
  spec: CommandSpec,
  host: ToolbarHost,
  anchor: HTMLElement,
  choice: PopupChoice,
): PopoverItem {
  const target = choice.command ?? spec;
  const { icon, label, swatch } = choice;
  // The picker is the one choice that needs an anchor of its own.
  const property = choice.picker;
  if (property !== undefined)
    return {
      icon,
      label,
      onChoose: () =>
        openColorPicker(anchor, host, (hex) =>
          host.execute(target, `${property}:${hex}`),
        ),
    };
  return {
    dim: choice.dim,
    disabled: choice.disabled,
    icon,
    label,
    preview: choice.preview,
    swatch,
    onChoose: () => host.execute(target, choice.value),
  };
}

/** The Emoji & Symbols panel is not here: it needs a search box. */
export function popoverSectionsFor(
  spec: CommandSpec,
  host: ToolbarHost,
  anchor: HTMLElement,
  query = "",
): readonly PopoverSection[] {
  return filterSections(popupSections(spec.popup), query).map((section) => ({
    grid: section.grid,
    items: section.items.map((choice) => toItem(spec, host, anchor, choice)),
    title: section.title,
  }));
}
