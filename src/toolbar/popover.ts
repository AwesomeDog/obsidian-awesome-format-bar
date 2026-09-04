import { setTooltip } from "obsidian";
import Picker from "vanilla-picker/csp";
import { commandById, TABLE_DROPDOWN_ITEMS } from "../model/command-table";
import { CASE_OPTIONS, STANDARD_COLORS } from "../model/palettes";
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
        attr: { type: "button" },
        cls: item.swatch ? "swatch" : "menu-item",
      });
      if (item.swatch) entry.style.backgroundColor = item.swatch;
      else {
        if (item.icon) resolveIcon(entry, item.icon);
        entry.createSpan({ text: item.label });
      }
      setTooltip(entry, item.label);
      entry.addEventListener("click", () => {
        layer.close();
        item.onChoose();
      });
    }
  }

  layer.place();
}

/** Its own popup mode nests a panel inside the button; unused. */
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

  layer.place();
}

/** The Emoji & Symbols panel is not here: it needs a search box. */
export function popoverSectionsFor(
  spec: CommandSpec,
  host: ToolbarHost,
  anchor: HTMLElement,
): readonly PopoverSection[] {
  switch (spec.popup) {
    case "color":
    case "highlight-color": {
      const property = spec.popup === "color" ? "color" : "background";
      return [
        {
          grid: 10,
          items: STANDARD_COLORS.map((hex) => ({
            label: hex,
            swatch: hex,
            onChoose: () => host.execute(spec, `${property}:${hex}`),
          })),
        },
        {
          items: [
            {
              icon: "ban",
              label: "No Color",
              onChoose: () => host.execute(spec, `${property}:none`),
            },
            {
              icon: "pipette",
              label: "More colors…",
              onChoose: () =>
                openColorPicker(anchor, host, (hex) =>
                  host.execute(spec, `${property}:${hex}`),
                ),
            },
          ],
        },
      ];
    }
    case "case":
      return [
        {
          items: CASE_OPTIONS.map((option) => ({
            label: option.label,
            onChoose: () => host.execute(spec, option.mode),
          })),
        },
      ];
    case "table-delete":
    case "table-format":
    case "table-sort":
      return [
        {
          items: (TABLE_DROPDOWN_ITEMS[spec.popup ?? ""] ?? []).map((id) => {
            const item = commandById(id);
            return {
              icon: item.icon,
              label: item.name,
              onChoose: () => host.execute(item),
            };
          }),
        },
      ];
    default:
      return [];
  }
}
