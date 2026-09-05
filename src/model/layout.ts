import type { CommandId } from "./command-table";

/** The Ribbon's tabs and groups, plus the fixed Compact subset. */
export interface RibbonGroup {
  readonly name: string;
  readonly commands: readonly CommandId[];
}

interface RibbonTab {
  readonly id: string;
  readonly name: string;
  readonly groups: readonly RibbonGroup[];
}
export const BUILT_IN_COMMAND_TABS = [
  {
    id: "home",
    name: "Home",
    groups: [
      {
        name: "Clipboard",
        commands: ["paste", "cut", "copy", "paste-plain-text"],
      },
      {
        name: "Font",
        commands: [
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "subscript",
          "superscript",
          "inline-code",
          "inline-math",
          "highlight",
          "highlight-color",
          "font-color",
          "clear-formatting",
          "change-case",
        ],
      },
      {
        name: "Paragraph",
        commands: [
          "bullet-list",
          "numbered-list",
          "task-list",
          "quote",
          "decrease-indent",
          "increase-indent",
          "renumber-list",
          "sort-lines",
          "swap-line-up",
          "swap-line-down",
          "align-left",
          "align-center",
          "align-right",
          "align-justify",
          "horizontal-rule",
        ],
      },
      {
        name: "Styles",
        commands: [
          "heading-1",
          "heading-2",
          "heading-3",
          "heading-4",
          "heading-5",
          "heading-6",
          "remove-heading",
        ],
      },
      { name: "Editing", commands: ["undo", "redo", "find-replace"] },
    ],
  },
  {
    id: "insert",
    name: "Insert",
    groups: [
      {
        name: "Links",
        commands: [
          "internal-link",
          "external-link",
          "embed",
          "tag",
          "block-reference",
        ],
      },
      {
        name: "Blocks",
        commands: ["callout", "code-block", "math-block", "table", "comment"],
      },
      {
        name: "Media & Symbols",
        commands: ["attach-file", "emoji", "date-time"],
      },
    ],
  },
  {
    id: "view",
    name: "View",
    groups: [
      { name: "Immersive", commands: ["focus-mode", "zen-mode"] },
      {
        name: "Show",
        commands: [
          "show-whitespace",
          "show-line-numbers",
          "readable-line-length",
          "navigation-pane",
        ],
      },
      { name: "Zoom", commands: ["zoom-in", "zoom-out", "zoom-reset"] },
      {
        name: "Outlining",
        commands: ["collapse", "expand", "collapse-all", "expand-all"],
      },
    ],
  },
  {
    id: "table",
    name: "Table",
    groups: [
      {
        name: "Rows & Columns",
        commands: [
          "table-delete",
          "table-insert-rows-above",
          "table-insert-columns-left",
          "table-move-row-up",
          "table-move-row-down",
          "table-move-column-left",
          "table-move-column-right",
        ],
      },
      { name: "Format", commands: ["table-format"] },
      {
        name: "Alignment",
        commands: [
          "table-align-column-left",
          "table-align-column-center",
          "table-align-column-right",
        ],
      },
      { name: "Data", commands: ["table-sort"] },
      { name: "Clipboard", commands: ["paste-as-table"] },
    ],
  },
  {
    id: "utilities",
    name: "Utilities",
    groups: [{ name: "Utilities", commands: ["merge-lines", "split-lines"] }],
  },
] as const satisfies readonly RibbonTab[];

/** Not in `BUILT_IN_COMMAND_TABS`: its buttons are user data. */
export const PINNED_TAB = {
  id: "pinned",
  name: "Pinned",
  groups: [],
} as const satisfies RibbonTab;

export const RIBBON_TABS = [...BUILT_IN_COMMAND_TABS, PINNED_TAB] as const;

export type TabId = (typeof RIBBON_TABS)[number]["id"];

/** Compact subset: fixed in code, grouped by the separators between runs. */
export const COMPACT_GROUPS = [
  ["bold", "italic", "underline", "strikethrough", "highlight"],
  [
    "bullet-list",
    "numbered-list",
    "task-list",
    "quote",
    "decrease-indent",
    "increase-indent",
  ],
  ["undo", "redo"],
] as const satisfies readonly (readonly CommandId[])[];

export const COMPACT_ORDER = COMPACT_GROUPS.flat() as readonly CommandId[];
