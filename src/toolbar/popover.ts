import { setTooltip } from "obsidian";
import Picker from "vanilla-picker/csp";
import { popupSections, type PopupChoice } from "../model/popups";
import { STANDARD_COLORS } from "../model/palettes";
import type { CommandSpec } from "../model/types";
import { openFloatingLayer } from "./floating";
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
  readonly disabled?: boolean;
  readonly onChoose: () => void;
}

export function openPopover(
  anchor: HTMLElement,
  sections: readonly PopoverSection[],
  onDismiss?: () => void,
): void {
  const layer = openFloatingLayer(anchor, onDismiss);

  for (const section of sections) {
    const sectionEl = layer.el.createDiv({ cls: "menu-section" });
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
      setTooltip(entry, item.label);
      if (!item.disabled)
        entry.addEventListener("click", () => {
          layer.close();
          item.onChoose();
        });
    }
  }

  layer.place();
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
    icon,
    label,
    swatch,
    onChoose: () => host.execute(target, choice.value),
  };
}

/** The Emoji & Symbols panel is not here: it needs a search box. */
export function popoverSectionsFor(
  spec: CommandSpec,
  host: ToolbarHost,
  anchor: HTMLElement,
): readonly PopoverSection[] {
  return popupSections(spec.popup).map((section) => ({
    grid: section.grid,
    items: section.items.map((choice) => toItem(spec, host, anchor, choice)),
  }));
}
