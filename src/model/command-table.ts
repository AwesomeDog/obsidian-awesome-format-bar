import type { CommandSpec } from "./types";

/** Adding a command starts here; everything else reads it through `commandById`. */
export const COMMANDS = [
  // Home · Clipboard
  { id: "paste", name: "Paste", icon: "clipboard-paste", kind: "clipboard" },
  {
    id: "copy",
    name: "Copy",
    icon: "copy",
    kind: "clipboard",
    requiresSelection: true,
  },
  {
    id: "cut",
    name: "Cut",
    icon: "scissors",
    kind: "clipboard",
    requiresSelection: true,
  },
  {
    id: "paste-plain-text",
    name: "Paste as Plain Text",
    icon: "clipboard-type",
    kind: "clipboard",
  },

  // Home · Font
  {
    id: "bold",
    name: "Bold",
    icon: "bold",
    kind: "registered",
    registeredCommandId: "editor:toggle-bold",
  },
  {
    id: "italic",
    name: "Italic",
    icon: "italic",
    kind: "registered",
    registeredCommandId: "editor:toggle-italics",
  },
  { id: "underline", name: "Underline", icon: "underline", kind: "editor" },
  {
    id: "strikethrough",
    name: "Strikethrough",
    icon: "strikethrough",
    kind: "registered",
    registeredCommandId: "editor:toggle-strikethrough",
  },
  {
    id: "highlight",
    name: "Highlight",
    icon: "highlighter",
    kind: "registered",
    registeredCommandId: "editor:toggle-highlight",
  },
  {
    id: "superscript",
    name: "Superscript",
    icon: "superscript",
    kind: "editor",
  },
  { id: "subscript", name: "Subscript", icon: "subscript", kind: "editor" },
  {
    id: "inline-code",
    name: "Inline Code",
    icon: "code",
    kind: "registered",
    registeredCommandId: "editor:toggle-code",
  },
  // Local: it wraps a pair, like Underline and Superscript.
  { id: "inline-math", name: "Inline Math", icon: "sigma", kind: "editor" },
  {
    id: "font-color",
    name: "Font Color",
    icon: "palette",
    kind: "editor",
    requiresSelection: true,
    popup: "color",
    commandPalette: false,
  },
  {
    id: "highlight-color",
    name: "Highlight Color",
    icon: "paint-bucket",
    kind: "editor",
    requiresSelection: true,
    popup: "highlight-color",
    commandPalette: false,
  },
  {
    id: "clear-formatting",
    name: "Clear Formatting",
    icon: "eraser",
    kind: "registered",
    registeredCommandId: "editor:clear-formatting",
  },
  {
    id: "change-case",
    name: "Change Case",
    icon: "case-upper",
    kind: "editor",
    requiresSelection: true,
    popup: "case",
    commandPalette: false,
  },

  // Home · Paragraph
  {
    id: "heading-1",
    name: "Heading 1",
    icon: "heading-1",
    kind: "registered",
    registeredCommandId: "editor:set-heading-1",
  },
  {
    id: "heading-2",
    name: "Heading 2",
    icon: "heading-2",
    kind: "registered",
    registeredCommandId: "editor:set-heading-2",
  },
  {
    id: "heading-3",
    name: "Heading 3",
    icon: "heading-3",
    kind: "registered",
    registeredCommandId: "editor:set-heading-3",
  },
  {
    id: "heading-4",
    name: "Heading 4",
    icon: "heading-4",
    kind: "registered",
    registeredCommandId: "editor:set-heading-4",
  },
  {
    id: "heading-5",
    name: "Heading 5",
    icon: "heading-5",
    kind: "registered",
    registeredCommandId: "editor:set-heading-5",
  },
  {
    id: "heading-6",
    name: "Heading 6",
    icon: "heading-6",
    kind: "registered",
    registeredCommandId: "editor:set-heading-6",
  },
  {
    id: "remove-heading",
    name: "Remove Heading",
    icon: "heading-off",
    kind: "registered",
    registeredCommandId: "editor:set-heading-0",
  },
  {
    id: "bullet-list",
    name: "Bullet List",
    icon: "list",
    kind: "registered",
    registeredCommandId: "editor:toggle-bullet-list",
  },
  {
    id: "numbered-list",
    name: "Numbered List",
    icon: "list-ordered",
    kind: "registered",
    registeredCommandId: "editor:toggle-numbered-list",
  },
  {
    id: "task-list",
    name: "Task List",
    icon: "list-checks",
    kind: "registered",
    registeredCommandId: "editor:toggle-checklist-status",
  },
  {
    id: "quote",
    name: "Quote",
    icon: "quote",
    kind: "registered",
    registeredCommandId: "editor:toggle-blockquote",
  },
  {
    id: "increase-indent",
    name: "Increase Indent",
    icon: "indent-increase",
    kind: "editor",
  },
  {
    id: "decrease-indent",
    name: "Decrease Indent",
    icon: "indent-decrease",
    kind: "editor",
  },
  {
    id: "renumber-list",
    name: "Renumber List",
    icon: "list-start",
    kind: "editor",
  },
  {
    id: "sort-lines",
    name: "Sort Lines",
    icon: "arrow-down-a-z",
    kind: "editor",
  },
  {
    id: "swap-line-up",
    name: "Swap Line Up",
    icon: "corner-right-up",
    kind: "registered",
    registeredCommandId: "editor:swap-line-up",
  },
  {
    id: "swap-line-down",
    name: "Swap Line Down",
    icon: "corner-right-down",
    kind: "registered",
    registeredCommandId: "editor:swap-line-down",
  },
  { id: "align-left", name: "Align Left", icon: "align-left", kind: "editor" },
  {
    id: "align-center",
    name: "Align Center",
    icon: "align-center",
    kind: "editor",
  },
  {
    id: "align-right",
    name: "Align Right",
    icon: "align-right",
    kind: "editor",
  },
  {
    id: "align-justify",
    name: "Align Justify",
    icon: "align-justify",
    kind: "editor",
  },
  // Local: `editor:insert-horizontal-rule` drops the surrounding blank lines.
  {
    id: "horizontal-rule",
    name: "Horizontal Rule",
    icon: "minus",
    kind: "editor",
  },

  // Home · Editing
  { id: "undo", name: "Undo", icon: "undo", kind: "editor" },
  { id: "redo", name: "Redo", icon: "redo", kind: "editor" },
  {
    id: "find-replace",
    name: "Find and Replace",
    icon: "search",
    kind: "registered",
    registeredCommandId: "editor:open-search-replace",
  },

  // Insert · Links
  {
    id: "internal-link",
    name: "Internal Link",
    icon: "brackets",
    kind: "registered",
    registeredCommandId: "editor:insert-wikilink",
  },
  {
    id: "external-link",
    name: "External Link",
    icon: "link",
    kind: "registered",
    registeredCommandId: "editor:insert-link",
  },
  {
    id: "embed",
    name: "Embed",
    icon: "file-input",
    kind: "registered",
    registeredCommandId: "editor:insert-embed",
  },
  {
    id: "tag",
    name: "Tag",
    icon: "tag",
    kind: "registered",
    registeredCommandId: "editor:insert-tag",
  },
  {
    id: "block-reference",
    name: "Block Reference",
    icon: "hash",
    kind: "editor",
  },

  // Insert · Blocks
  { id: "callout", name: "Callout", icon: "info", kind: "editor" },
  {
    id: "code-block",
    name: "Code Block",
    icon: "square-code",
    kind: "registered",
    registeredCommandId: "editor:insert-codeblock",
  },
  {
    id: "math-block",
    name: "Math Block",
    icon: "sigma",
    kind: "registered",
    registeredCommandId: "editor:insert-mathblock",
  },
  {
    id: "table",
    name: "Table",
    icon: "table",
    kind: "registered",
    registeredCommandId: "editor:insert-table",
  },
  {
    id: "comment",
    name: "Comment",
    icon: "percent",
    kind: "registered",
    registeredCommandId: "editor:toggle-comments",
  },

  // Insert · Media & Symbols
  {
    id: "attach-file",
    name: "Attach File",
    icon: "paperclip",
    kind: "registered",
    registeredCommandId: "editor:attach-file",
  },
  {
    id: "emoji",
    name: "Emoji & Symbols",
    icon: "smile",
    kind: "editor",
    popup: "character-panel",
    commandPalette: false,
  },
  { id: "date-time", name: "Date and Time", icon: "calendar", kind: "editor" },

  // View · Show
  {
    id: "show-whitespace",
    name: "Show Whitespace",
    icon: "space",
    kind: "view",
  },
  {
    id: "show-line-numbers",
    name: "Show Line Numbers",
    icon: "list-ordered",
    kind: "registered",
    registeredCommandId: "editor:toggle-line-numbers",
  },
  // View
  {
    id: "focus-mode",
    name: "Focus Mode",
    icon: "fold-horizontal",
    kind: "view",
  },
  // Real fullscreen on the view, so Obsidian's own layout is left alone.
  { id: "zen-mode", name: "Zen Mode", icon: "maximize", kind: "view" },
  // Utilities
  { id: "merge-lines", name: "Merge Lines", icon: "merge", kind: "editor" },
  { id: "split-lines", name: "Split Lines", icon: "split", kind: "editor" },

  // Table · Rows & Columns
  {
    id: "table-delete",
    name: "Delete Rows or Columns",
    icon: "trash-2",
    kind: "editor",
    requiresTable: true,
    popup: "table-delete",
    commandPalette: false,
  },
  {
    id: "table-delete-rows",
    name: "Delete Rows",
    icon: "table-row-delete",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-delete-columns",
    name: "Delete Columns",
    icon: "table-column-delete",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-insert-rows-above",
    name: "Insert Rows Above",
    icon: "panel-top-close",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-insert-columns-left",
    name: "Insert Columns to the Left",
    icon: "panel-left-close",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-move-row-up",
    name: "Move Row Up",
    icon: "arrow-up",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-move-row-down",
    name: "Move Row Down",
    icon: "arrow-down",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-move-column-left",
    name: "Move Column Left",
    icon: "arrow-left",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-move-column-right",
    name: "Move Column Right",
    icon: "arrow-right",
    kind: "editor",
    requiresTable: true,
  },

  // Table · Format
  {
    id: "table-format",
    name: "Format Tables",
    icon: "align-horizontal-distribute-center",
    kind: "editor",
    requiresTable: true,
    popup: "table-format",
    commandPalette: false,
  },
  {
    id: "table-format-table",
    name: "Format Table",
    icon: "align-horizontal-distribute-center",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-format-all-tables",
    name: "Format All Tables",
    icon: "align-horizontal-distribute-center",
    kind: "editor",
    requiresTable: true,
  },

  // Table · Alignment
  {
    id: "table-align-column-left",
    name: "Align Column Left",
    icon: "align-left",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-align-column-center",
    name: "Align Column Center",
    icon: "align-center",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-align-column-right",
    name: "Align Column Right",
    icon: "align-right",
    kind: "editor",
    requiresTable: true,
  },

  // Table · Data
  {
    id: "table-sort",
    name: "Sort Rows",
    icon: "arrow-down-az",
    kind: "editor",
    requiresTable: true,
    popup: "table-sort",
    commandPalette: false,
  },
  {
    id: "table-sort-az",
    name: "Sort Rows A to Z",
    icon: "arrow-down-az",
    kind: "editor",
    requiresTable: true,
  },
  {
    id: "table-sort-za",
    name: "Sort Rows Z to A",
    icon: "arrow-up-za",
    kind: "editor",
    requiresTable: true,
  },

  // Table · Clipboard
  {
    id: "paste-as-table",
    name: "Paste as Table",
    icon: "clipboard-paste",
    kind: "clipboard",
  },
] as const satisfies readonly CommandSpec[];

export type CommandId = (typeof COMMANDS)[number]["id"];

/** Drop-down items: no Ribbon group lists them, but each has a palette entry. */
export const TABLE_DROPDOWN_ITEMS: Readonly<
  Record<string, readonly CommandId[]>
> = {
  "table-delete": ["table-delete-rows", "table-delete-columns"],
  "table-format": ["table-format-table", "table-format-all-tables"],
  "table-sort": ["table-sort-az", "table-sort-za"],
};

const COMMAND_BY_ID = new Map<string, CommandSpec>(
  COMMANDS.map((spec) => [spec.id, spec]),
);

export function commandById(id: string): CommandSpec {
  const spec = COMMAND_BY_ID.get(id);
  if (!spec) throw new Error(`Unknown command: ${id}`);
  return spec;
}
