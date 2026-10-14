import { t } from "../i18n/i18n";
import { commandById, DROPDOWN_ITEMS } from "./command-table";
import { isFontInstalled, localFonts, type LocalFonts } from "./fonts";
import {
  CASE_OPTIONS,
  FONT_GROUPS,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  NATIVE_COUNT,
  NATIVE_HIGHLIGHTS,
  STANDARD_COLORS,
  type FontOption,
  type NativeHighlight,
} from "./palettes";
import type { CommandPopup, CommandSpec } from "./types";

/** What a drop-down offers: one table, so the popover and the editor menu cannot drift apart. */
export interface PopupChoice {
  readonly label: string;
  readonly icon?: string;
  /** A CSS color: the dot in front of the label, for the color palettes. */
  readonly swatch?: string;
  /** A CSS font stack: draws the label in that font, for the font drop-down. */
  readonly preview?: string;
  /** Greyed out: the machine does not have this font. It stays clickable. */
  readonly dim?: boolean;
  /** The `optionValue` the command runs with. */
  readonly value?: string;
  /** A command of its own: what the drop-downs whose items are commands carry. */
  readonly command?: CommandSpec;
  /** The property the color picker writes. It needs an anchor, so only the
   * popover draws this choice; the editor menu leaves it out. */
  readonly picker?: string;
  /** Shown but not clickable: a placeholder standing in for what is still loading. */
  readonly disabled?: boolean;
}

export interface PopupSection {
  readonly items: readonly PopupChoice[];
  readonly title?: string;
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

/** One font as the drop-down offers it. A generic family never dims — every
 * machine resolves it — and its name is the one label here that translates. */
function fontChoice(
  font: FontOption,
  fonts: LocalFonts,
  generic: boolean,
): PopupChoice {
  return {
    dim: !generic && isFontInstalled(fonts, font.name) === false,
    label: generic ? t(font.name) : font.name,
    preview: font.stack === "none" ? undefined : font.stack,
    value: `font-family:${font.stack}`,
  };
}

/** The families the machine reported, under one group of their own. Absent where
 * there is no API to read them, and a placeholder while the read is running. */
function localSection(fonts: LocalFonts): PopupSection | null {
  if (fonts.kind === "unsupported") return null;
  const title = t("Local fonts");
  if (fonts.kind === "pending")
    return {
      items: [{ disabled: true, label: t("Reading installed fonts…") }],
      title,
    };
  return {
    items: fonts.extra.map((family) => ({
      label: family,
      preview: `'${family}'`,
      value: `font-family:'${family}'`,
    })),
    title,
  };
}

/** Curated fonts grouped by kind, then whatever else the machine has. */
function fontSections(fonts: LocalFonts): readonly PopupSection[] {
  const sections: PopupSection[] = FONT_GROUPS.map((group) => ({
    items: group.fonts.map((font) =>
      fontChoice(font, fonts, group.generic === true),
    ),
    title: t(group.title),
  }));
  const local = localSection(fonts);
  if (local) sections.push(local);
  return sections;
}

/** Lowercase substring anywhere in a label; a section left with nothing drops out. */
export function filterSections(
  sections: readonly PopupSection[],
  query: string,
): readonly PopupSection[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return sections;
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((choice) =>
        choice.label.toLowerCase().includes(needle),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export interface PopupOptions {
  /** Defaults to the cache filled at startup; the editor menu passes `unsupported`. */
  readonly localFonts?: LocalFonts;
}

/** The sections `popup` opens; `undefined` is no drop-down at all and yields nothing. */
export function popupSections(
  popup: CommandPopup | undefined,
  options: PopupOptions = {},
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
      return [
        {
          items: FONT_SIZES.map((option) => ({
            label: t(option.label),
            value: `font-size:${option.value}`,
          })),
        },
      ];
    case "font-family":
      return fontSections(options.localFonts ?? localFonts());
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
      const ids = popup ? (DROPDOWN_ITEMS[popup] ?? []) : [];
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
