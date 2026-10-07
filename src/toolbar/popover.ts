import { setTooltip } from "obsidian";
import Picker from "vanilla-picker/csp";
import { t } from "../i18n/i18n";
import { commandById, DROPDOWN_ITEMS } from "../model/command-table";
import {
  CASE_OPTIONS,
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  NATIVE_COUNT,
  NATIVE_HIGHLIGHTS,
  STANDARD_COLORS,
  type NativeHighlight,
} from "../model/palettes";
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

/** No Color and the picker: the same two entries under either palette. */
function colorExtras(
  spec: CommandSpec,
  host: ToolbarHost,
  anchor: HTMLElement,
  property: string,
): PopoverSection {
  return {
    items: [
      {
        icon: "ban",
        label: t("No Color"),
        onChoose: () => host.execute(spec, `${property}:none`),
      },
      {
        icon: "pipette",
        label: t("More colors…"),
        onChoose: () =>
          openColorPicker(anchor, host, (hex) =>
            host.execute(spec, `${property}:${hex}`),
          ),
      },
    ],
  };
}

/** The Emoji & Symbols panel is not here: it needs a search box. */
export function popoverSectionsFor(
  spec: CommandSpec,
  host: ToolbarHost,
  anchor: HTMLElement,
): readonly PopoverSection[] {
  switch (spec.popup) {
    case "color":
      return [
        {
          grid: 10,
          items: STANDARD_COLORS.map((hex) => ({
            label: hex,
            swatch: hex,
            onChoose: () => host.execute(spec, `color:${hex}`),
          })),
        },
        colorExtras(spec, host, anchor, "color"),
      ];
    case "highlight-color": {
      const swatch = (hex: string): PopoverItem => ({
        label: hex,
        swatch: hex,
        onChoose: () => host.execute(spec, `background:${hex}`),
      });
      // The leading six are Obsidian's own, and what renders is the theme
      // variable, not this hex: showing the hex would promise a color the
      // editor never paints.
      const native = (entry: NativeHighlight): PopoverItem => ({
        label: entry.hex,
        swatch: `var(${entry.variable})`,
        onChoose: () => host.execute(spec, `background:${entry.hex}`),
      });
      return [
        { grid: NATIVE_COUNT, items: NATIVE_HIGHLIGHTS.map(native) },
        { grid: 5, items: HIGHLIGHT_COLORS.slice(NATIVE_COUNT).map(swatch) },
        colorExtras(spec, host, anchor, "background"),
      ];
    }
    case "font-size":
    case "font-family": {
      const property = spec.popup === "font-size" ? "font-size" : "font-family";
      const options = spec.popup === "font-size" ? FONT_SIZES : FONT_FAMILIES;
      return [
        {
          items: options.map((option) => ({
            label: t(option.label),
            onChoose: () => host.execute(spec, `${property}:${option.value}`),
          })),
        },
      ];
    }
    case "case":
      return [
        {
          items: CASE_OPTIONS.map((option) => ({
            label: t(option.label),
            onChoose: () => host.execute(spec, option.mode),
          })),
        },
      ];
    // Everything else that is a drop-down at all: one item per command listed
    // under it, the same shape the editor menu shows. Nothing here names a
    // pop-up, so a new one needs no case of its own.
    default: {
      const ids = DROPDOWN_ITEMS[spec.popup ?? ""] ?? [];
      if (ids.length === 0) return [];
      return [
        {
          items: ids.map((id) => {
            const item = commandById(id);
            return {
              icon: item.icon,
              label: item.name,
              onChoose: () => host.execute(item),
            };
          }),
        },
      ];
    }
  }
}
