import type { CommandSpec, ToolbarPosition } from "../model/types";

/** The contract a view hands to its toolbar. */

/** The toolbar never inspects the editor itself. */
export interface ToolbarState {
  readonly isEnabled: (spec: CommandSpec) => boolean;
}

export interface ToolbarHost {
  readonly containerEl: HTMLElement;
  readonly positions: readonly ToolbarPosition[];
  /** Rebuilt when the Pinned tab or overflow menu is drawn, not every refresh. */
  pinnedSpecs(): readonly CommandSpec[];
  state(): ToolbarState;
  execute(spec: CommandSpec, optionValue?: string): void;
  /** Hands the caret back after a menu closes without running anything. */
  focusEditor(): void;
  /** The live settings map: the panel prunes it in place. */
  charUsage(): Record<string, number>;
  recordCharUsage(char: string): void;
}
