export type ToolbarPosition = "top" | "following" | "fixed";

/** Where the bar shows, plus the editor menu: one switch per place. */
export type ToolbarToggle = ToolbarPosition | "editorMenu";

export interface ToolbarVisibility {
  top: boolean;
  following: boolean;
  fixed: boolean;
  /** The editor's own menu: every command under one submenu of its own. */
  editorMenu: boolean;
}

export interface Settings {
  version: number;
  desktop: ToolbarVisibility;
  mobile: ToolbarVisibility;
  enableOnMobile: boolean;
  /** Source mode: Enter and Tab walk a table's cells instead of the text. */
  tableKeyNavigation: boolean;
  /** Pad cells with spaces so the pipes of a column line up. */
  padCellWidthWithSpaces: boolean;
  /** Reading view: click a table header to sort its rows. */
  sortTableOnHeaderClick: boolean;
  /** Source mode: spaces and tabs marked, odd spaces in orange, zero-width
   * characters replaced by a marker standing in for them. */
  showWhitespace: boolean;
  /** Inserted character -> how many times it was picked. Drives Frequently used. */
  charUsage: Record<string, number>;
  /** Obsidian commands the user pinned onto the Ribbon's Pinned tab. */
  pinned: readonly PinnedCommand[];
}

/** Replaced wholesale on change, so a mutation is a visible assignment. */
export interface PinnedCommand {
  /** Registry id, e.g. `editor:toggle-bold` or `templater:insert`. */
  readonly commandId: string;
  /** Icon name as `setIcon` takes it, `lucide-` prefix stripped. */
  readonly icon: string;
  /** Captured at pin time; the fallback when a command's plugin is gone. */
  readonly name: string;
  /** Optional user label; absent entries belong to the default group. */
  readonly group?: string;
}
type CommandKind = "registered" | "editor" | "clipboard" | "view";

/** Commands that open their own floating layer instead of acting immediately. */
export type CommandPopup =
  | "color"
  | "highlight-color"
  | "font-size"
  | "font-family"
  | "case"
  | "character-panel"
  | "callout"
  | "number-headings"
  | "image-size"
  | "image-size-all"
  | "table-delete"
  | "table-format"
  | "table-sort"
  | "table-copy-as"
  | "table-grid"
  | "chart"
  | "clean-up"
  | "select";

export interface CommandSpec {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly kind: CommandKind;
  readonly registeredCommandId?: string;
  readonly requiresSelection?: boolean;
  /** Greyed out unless the caret is inside a GFM table. */
  readonly requiresTable?: boolean;
  /** Greyed out unless the caret is on a line holding a picture. */
  readonly requiresImage?: boolean;
  /** Greyed out off the desktop app: the interaction needs a mouse. */
  readonly desktopOnly?: boolean;
  readonly popup?: CommandPopup;
  /** Drop-down buttons stay off the command palette: alone they do nothing. */
  readonly commandPalette?: false;
}
