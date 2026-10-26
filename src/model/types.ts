export type ToolbarPosition = "top" | "following" | "fixed";

export type ToolbarToggle = ToolbarPosition | "editorMenu";

export interface ToolbarVisibility {
  top: boolean;
  following: boolean;
  fixed: boolean;
  editorMenu: boolean;
}

export interface Settings {
  version: number;
  desktop: ToolbarVisibility;
  mobile: ToolbarVisibility;
  enableOnMobile: boolean;
  tableKeyNavigation: boolean;
  padCellWidthWithSpaces: boolean;
  sortTableOnHeaderClick: boolean;
  /** Source mode: spaces and tabs marked, odd spaces in orange, zero-width
   * characters replaced by a marker standing in for them. */
  showWhitespace: boolean;
  /** Inserted character -> how many times it was picked. Drives Frequently used. */
  charUsage: Record<string, number>;
  pinned: readonly PinnedCommand[];
}

export interface PinnedCommand {
  readonly commandId: string;
  readonly icon: string;
  /** Captured at pin time; the fallback when a command's plugin is gone. */
  readonly name: string;
  readonly group?: string;
}
type CommandKind = "registered" | "editor" | "clipboard" | "view";

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
  readonly requiresTable?: boolean;
  readonly requiresImage?: boolean;
  readonly desktopOnly?: boolean;
  readonly popup?: CommandPopup;
  /** Drop-down buttons stay off the command palette: alone they do nothing. */
  readonly commandPalette?: false;
}
