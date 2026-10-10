import { t } from "../i18n/i18n";
import { commandById, DROPDOWN_ITEMS } from "./command-table";
import {
  CASE_OPTIONS,
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  NATIVE_COUNT,
  NATIVE_HIGHLIGHTS,
  STANDARD_COLORS,
  type NativeHighlight,
} from "./palettes";
import type { CommandPopup, CommandSpec } from "./types";

/** What a drop-down offers: one table, so the popover and the editor menu cannot drift apart. */
export interface PopupChoice {
  readonly label: string;
  readonly icon?: string;
  /** A CSS color: the dot in front of the label, for the color palettes. */
  readonly swatch?: string;
  /** The `optionValue` the command runs with. */
  readonly value?: string;
  /** A command of its own: what the drop-downs whose items are commands carry. */
  readonly command?: CommandSpec;
  /** The property the color picker writes. It needs an anchor, so only the
   * popover draws this choice; the editor menu leaves it out. */
  readonly picker?: string;
}

export interface PopupSection {
  readonly items: readonly PopupChoice[];
  /** Columns. The editor menu lists the items flat and ignores it. */
  readonly grid?: number;
}

/** No Color and the picker: the same two entries under either palette. */
function colorExtras(property: string): PopupSection {
  return {
    items: [
      { icon: "ban", label: t("No Color"), value: `${property}:none` },
      { icon: "pipette", label: t("More colors…"), picker: property },
    ],
  };
}

/** The sections `popup` opens; `undefined` is no drop-down at all and yields nothing. */
export function popupSections(
  popup: CommandPopup | undefined,
): readonly PopupSection[] {
  switch (popup) {
    case "color":
      return [
        {
          grid: 10,
          items: STANDARD_COLORS.map((hex) => ({
            label: hex,
            swatch: hex,
            value: `color:${hex}`,
          })),
        },
        colorExtras("color"),
      ];
    case "highlight-color": {
      // The leading six are Obsidian's own, and the theme variable is what renders:
      // showing the hex would promise a color the editor never paints.
      const native = (entry: NativeHighlight): PopupChoice => ({
        label: entry.hex,
        swatch: `var(${entry.variable})`,
        value: `background:${entry.hex}`,
      });
      const swatch = (hex: string): PopupChoice => ({
        label: hex,
        swatch: hex,
        value: `background:${hex}`,
      });
      return [
        { grid: NATIVE_COUNT, items: NATIVE_HIGHLIGHTS.map(native) },
        { grid: 5, items: HIGHLIGHT_COLORS.slice(NATIVE_COUNT).map(swatch) },
        colorExtras("background"),
      ];
    }
    case "font-size":
    case "font-family": {
      const property = popup === "font-size" ? "font-size" : "font-family";
      const options = popup === "font-size" ? FONT_SIZES : FONT_FAMILIES;
      return [
        {
          items: options.map((option) => ({
            label: t(option.label),
            value: `${property}:${option.value}`,
          })),
        },
      ];
    }
    case "case":
      return [
        {
          items: CASE_OPTIONS.map((option) => ({
            label: t(option.label),
            value: option.mode,
          })),
        },
      ];
    // Everything else that is a drop-down at all: one item per command listed
    // under it. Nothing here names a pop-up, so a new one needs no case.
    default: {
      const ids = DROPDOWN_ITEMS[popup ?? ""] ?? [];
      if (ids.length === 0) return [];
      return [
        {
          items: ids.map((id) => {
            const item = commandById(id);
            return { command: item, icon: item.icon, label: item.name };
          }),
        },
      ];
    }
  }
}
