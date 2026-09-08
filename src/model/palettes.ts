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
