import type {
  CommandSpec,
  PinnedCommand,
  ToolbarPosition,
} from "../model/types";

export interface ToolbarState {
  readonly isEnabled: (spec: CommandSpec) => boolean;
  /** A mode this command has switched on: its button stays lit until it ends. */
  readonly isLatched: (spec: CommandSpec) => boolean;
  readonly inTable: boolean;
}

export interface ToolbarHost {
  readonly containerEl: HTMLElement;
  readonly positions: readonly ToolbarPosition[];
  pinnedSpecs(): readonly CommandSpec[];
  pinnedCommands(): readonly PinnedCommand[];
  editPinned(): void;
  state(): ToolbarState;
  execute(spec: CommandSpec, optionValue?: string): void;
  hotkeyFor(spec: CommandSpec): string;
  labelFor(spec: CommandSpec): string;
  focusEditor(): void;
  /** The live settings map: the panel prunes it in place. */
  charUsage(): Record<string, number>;
  recordCharUsage(char: string): void;
}
