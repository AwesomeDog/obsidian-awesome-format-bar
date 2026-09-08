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

/** Word's sizes, in pt. `none` clears the property, the way the colors do. */
export const FONT_SIZES = [
  { label: "Default", value: "none" },
  { label: "9", value: "9pt" },
  { label: "10", value: "10pt" },
  { label: "11", value: "11pt" },
  { label: "12", value: "12pt" },
  { label: "14", value: "14pt" },
  { label: "16", value: "16pt" },
  { label: "18", value: "18pt" },
  { label: "20", value: "20pt" },
  { label: "24", value: "24pt" },
  { label: "28", value: "28pt" },
  { label: "36", value: "36pt" },
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
