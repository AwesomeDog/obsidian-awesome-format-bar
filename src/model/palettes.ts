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

/** The first six Obsidian renders as `==🟡…==`; the other ten go out as a span. */
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

/** Those six: `variable` decides the color on screen, so the swatch shows it, not `hex`. */
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

/** The six circles Obsidian writes, the six squares it accepts. */
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

export function nativeHighlightOf(hex: string): NativeHighlight | undefined {
  return NATIVE_HIGHLIGHTS.find((entry) => entry.hex === hex);
}

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

/** Relative sizes in `em`, so a span survives a theme or zoom change; `none` clears it. */
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

export interface FontOption {
  readonly name: string;
  /** No `;` (`setStyle` splits on it) and no `"` (`SPAN_WHOLE` matches to it). */
  readonly stack: string;
}

export interface FontGroup {
  readonly title: string;
  readonly fonts: readonly FontOption[];
  readonly generic?: boolean;
}

const NONE: FontOption = { name: "Default", stack: "none" };

const GENERIC: readonly FontOption[] = [
  NONE,
  { name: "Serif", stack: "serif" },
  { name: "Sans Serif", stack: "sans-serif" },
  { name: "Monospace", stack: "monospace" },
  { name: "Cursive", stack: "cursive" },
  { name: "Fantasy", stack: "fantasy" },
];

/** One named font and one generic family: a longer chain buys nothing. */
const named = (name: string, generic: string): FontOption => ({
  name,
  stack: `'${name}', ${generic}`,
});

/** Names are quoted: a family starting with a digit is invalid CSS unquoted. */
const serif = (name: string): FontOption => named(name, "serif");
const sans = (name: string): FontOption => named(name, "sans-serif");
const mono = (name: string): FontOption => named(name, "monospace");

const SERIF: readonly FontOption[] = [
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Palatino",
  "Baskerville",
  "Didot",
  "Book Antiqua",
  "Cambria",
  "Constantia",
  "Bodoni MT",
  "Century Schoolbook",
  "Iowan Old Style",
  "Charter",
  "Sitka",
  "DejaVu Serif",
  "Liberation Serif",
  "Noto Serif",
].map(serif);

const SANS_SERIF: readonly FontOption[] = [
  "Arial",
  "Arial Black",
  "Helvetica",
  "Helvetica Neue",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Segoe UI",
  "Calibri",
  "Candara",
  "Optima",
  "Futura",
  "Gill Sans",
  "Avenir",
  "Lucida Grande",
  "DejaVu Sans",
  "Noto Sans",
  "Roboto",
  "Open Sans",
  "Lato",
  "Inter",
  "Ubuntu",
].map(sans);

const MONOSPACE: readonly FontOption[] = [
  "Courier New",
  "Courier",
  "Consolas",
  "Menlo",
  "Monaco",
  "Andale Mono",
  "SF Mono",
  "DejaVu Sans Mono",
  "Liberation Mono",
  "Source Code Pro",
  "JetBrains Mono",
  "Fira Code",
  "IBM Plex Mono",
  "Ubuntu Mono",
  "Cascadia Mono",
].map(mono);

const HANDWRITING: readonly FontOption[] = [
  "Comic Sans MS",
  "Comic Neue",
  "Bradley Hand",
  "Chalkboard",
  "Brush Script MT",
  "Lucida Handwriting",
  "Segoe Script",
  "Papyrus",
  "Impact",
  "Copperplate",
].map((name) => named(name, name === "Impact" ? "sans-serif" : "cursive"));

const CHINESE: readonly FontOption[] = [
  ...[
    "PingFang SC",
    "Microsoft YaHei",
    "Heiti SC",
    "SimHei",
    "Source Han Sans SC",
  ].map(sans),
  ...["Songti SC", "SimSun", "Kaiti SC", "KaiTi", "Source Han Serif SC"].map(
    serif,
  ),
];

const EMOJI: readonly FontOption[] = [
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Noto Color Emoji",
].map(sans);

export const FONT_GROUPS: readonly FontGroup[] = [
  { title: "Generic", fonts: GENERIC, generic: true },
  { title: "Serif", fonts: SERIF },
  { title: "Sans Serif", fonts: SANS_SERIF },
  { title: "Monospace", fonts: MONOSPACE },
  { title: "Handwriting & Display", fonts: HANDWRITING },
  { title: "Chinese", fonts: CHINESE },
  { title: "Emoji", fonts: EMOJI },
];

export const ALL_FONTS: readonly FontOption[] = FONT_GROUPS.flatMap(
  (group) => group.fonts,
);

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
