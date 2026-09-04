export type ToolbarPosition = "top" | "following" | "fixed";

export interface ToolbarPositionVisibility {
  top: boolean;
  following: boolean;
  fixed: boolean;
}

export interface Settings {
  version: number;
  desktop: ToolbarPositionVisibility;
  mobile: ToolbarPositionVisibility;
  enableOnMobile: boolean;
  /** Enter in a table moves to the cell below, adding a row at the end. */
  bindEnterToNextRow: boolean;
  /** Pad cells with spaces so the pipes of a column line up. */
  padCellWidthWithSpaces: boolean;
  /** Reading view: click a table header to sort its rows. */
  sortTableOnHeaderClick: boolean;
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
}
type CommandKind = "registered" | "editor" | "clipboard" | "view";

/** Commands that open their own floating layer instead of acting immediately. */
type CommandPopup =
  | "color"
  | "highlight-color"
  | "case"
  | "character-panel"
  | "table-delete"
  | "table-format"
  | "table-sort";

export interface CommandSpec {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly kind: CommandKind;
  readonly registeredCommandId?: string;
  readonly requiresSelection?: boolean;
  /** Greyed out unless the caret is inside a GFM table. */
  readonly requiresTable?: boolean;
  readonly popup?: CommandPopup;
  /** Drop-down buttons stay off the command palette: alone they do nothing. */
  readonly commandPalette?: false;
}
