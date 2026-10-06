/** Popover contents: colors and case modes. Content, not behavior. */

/** Fixed, not theme variables: these become document content. */
export const STANDARD_COLORS = [
  "#c00000",
  "#ff0000",
  "#ffc000",
  "#ffff00",
  "#92d050",
  "#00b050",
  "#00b0f0",
  "#0070c0",
  "#002060",
  "#7030a0",
] as const;

/**
 * Word's highlighter palette (15) plus Orange, which Word's font palette has
 * and its highlighter does not. The first six are the ones Obsidian renders
 * natively, as `==` followed by an emoji; the other ten have no native syntax
 * and go out as `<span style="background:…">`.
 */
export const HIGHLIGHT_COLORS: readonly string[] = [
  "#ffff00", // Yellow   → ==🟡…==
  "#ff0000", // Red      → ==🔴…==
  "#ffc000", // Orange   → ==🟠…==
  "#008000", // Green    → ==🟢…==
  "#0000ff", // Blue     → ==🔵…==
  "#800080", // Violet   → ==🟣…==
  // Word's other ten, in Word's own relative order.
  "#00ff00",
  "#00ffff",
  "#ff00ff",
  "#000080",
  "#008080",
  "#800000",
  "#808000",
  "#c0c0c0",
  "#808080",
  "#000000",
];

/** How many of `HIGHLIGHT_COLORS` Obsidian renders natively: the leading slice. */
export const NATIVE_COUNT = 6;

/**
 * Those six. `variable` is what decides the color on screen, so it is also
 * what the palette swatch has to show: painting `hex` there would promise a
 * color the editor never renders.
 */
export const NATIVE_HIGHLIGHTS = [
  {
    emoji: "\u{1F7E1}",
    hex: "#ffff00",
    name: "yellow",
    variable: "--highlight-background-yellow",
  },
  {
    emoji: "\u{1F534}",
    hex: "#ff0000",
    name: "red",
    variable: "--highlight-background-red",
  },
  {
    emoji: "\u{1F7E0}",
    hex: "#ffc000",
    name: "orange",
    variable: "--highlight-background-orange",
  },
  {
    emoji: "\u{1F7E2}",
    hex: "#008000",
    name: "green",
    variable: "--highlight-background-green",
  },
  {
    emoji: "\u{1F535}",
    hex: "#0000ff",
    name: "blue",
    variable: "--highlight-background-blue",
  },
  {
    emoji: "\u{1F7E3}",
    hex: "#800080",
    name: "purple",
    variable: "--highlight-background-purple",
  },
] as const;

export type NativeHighlight = (typeof NATIVE_HIGHLIGHTS)[number];

/**
 * Every emoji Obsidian reads as a highlight color: the six circles it writes,
 * and the six squares it accepts as well. Values index into
 * `HIGHLIGHT_COLORS`.
 */
const HIGHLIGHT_EMOJI: Readonly<Record<string, number>> = {
  "\u{1F7E1}": 0,
  "\u{1F7E8}": 0,
  "\u{1F534}": 1,
  "\u{1F7E5}": 1,
  "\u{1F7E0}": 2,
  "\u{1F7E7}": 2,
  "\u{1F7E2}": 3,
  "\u{1F7E9}": 3,
  "\u{1F535}": 4,
  "\u{1F7E6}": 4,
  "\u{1F7E3}": 5,
  "\u{1F7EA}": 5,
};

/** The native highlight `hex` stands for, or `undefined` for the other ten. */
export function nativeHighlightOf(hex: string): NativeHighlight | undefined {
  return NATIVE_HIGHLIGHTS.find((entry) => entry.hex === hex);
}

/** The highlight emoji at `at`: the hex it stands for, and how wide it is. */
export function highlightEmojiAt(
  doc: string,
  at: number,
): { hex: string; length: number } | null {
  const point = doc.codePointAt(at);
  if (point === undefined) return null;
  const emoji = String.fromCodePoint(point);
  const index = HIGHLIGHT_EMOJI[emoji];
  if (index === undefined) return null;
  const hex = HIGHLIGHT_COLORS[index];
  return hex === undefined ? null : { hex, length: emoji.length };
}

/**
 * Relative sizes, in `em` — they scale with the surrounding text, so a span
 * survives a theme or zoom change. `none` clears the property, like the colors.
 */
export const FONT_SIZES = [
  { label: "Default", value: "none" },
  { label: "0.5", value: "0.5em" },
  { label: "0.75", value: "0.75em" },
  { label: "0.9", value: "0.9em" },
  { label: "1.25", value: "1.25em" },
  { label: "1.5", value: "1.5em" },
  { label: "2", value: "2em" },
  { label: "3", value: "3em" },
] as const;

/**
 * CSS generic families only: a named font renders only where it is installed.
 * A value must also hold no `;`, which `editStyle` splits pairs on — a chain of
 * fallbacks can only be written with commas.
 */
export const FONT_FAMILIES = [
  { label: "Default", value: "none" },
  { label: "Serif", value: "serif" },
  { label: "Sans Serif", value: "sans-serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Cursive", value: "cursive" },
] as const;

/** Label and mode travel together, so they cannot drift apart. */
export const CASE_OPTIONS = [
  { label: "UPPERCASE", mode: "upper" },
  { label: "lowercase", mode: "lower" },
  { label: "Capitalize Each Word", mode: "capitalize" },
  { label: "tOGGLE cASE", mode: "toggle" },
  { label: "camelCase", mode: "camel" },
  { label: "PascalCase", mode: "pascal" },
  { label: "snake_case", mode: "snake" },
  { label: "kebab-case", mode: "kebab" },
] as const;
