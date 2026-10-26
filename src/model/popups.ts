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
  readonly swatch?: string;
  readonly preview?: string;
  readonly dim?: boolean;
  readonly value?: string;
  readonly command?: CommandSpec;
  /** Needs an anchor, so only the popover draws it. */
  readonly picker?: string;
  readonly disabled?: boolean;
}

export interface PopupSection {
  readonly items: readonly PopupChoice[];
  readonly title?: string;
  readonly grid?: number;
}

function colorExtras(property: string): PopupSection {
  return {
    items: [
      { icon: "ban", label: t("No Color"), value: `${property}:none` },
      { icon: "pipette", label: t("More colors…"), picker: property },
    ],
  };
}

/** A generic family never dims; its name is the one label that translates. */
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

/** Absent with no API to read them; a placeholder while the read runs. */
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
  readonly localFonts?: LocalFonts;
}

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
      // The theme variable is what renders; a hex would promise another color.
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
    // One item per command; nothing here names a pop-up.
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
