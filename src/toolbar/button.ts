import { setTooltip } from "obsidian";
import type { CommandSpec } from "../model/types";
import type { ToolbarHost } from "./host";
import { resolveIcon } from "./icons";
import { openCharPanel } from "./char-panel";
import { openPopover, popoverSectionsFor } from "./popover";
import { openTableGrid } from "./table-grid";

/** Matches how Obsidian labels its own commands: `Bold (⌘ B)`. */
function withHotkey(name: string, hotkey: string): string {
  return hotkey ? `${name} (${hotkey})` : name;
}

/**
 * Where a click on a command goes: the two pop-ups that draw a layer of their
 * own, then the drop-downs, then a command that acts at once. Every entry
 * point a button has — the bar, the overflow list — comes through here, so a
 * new kind of pop-up is wired in one place.
 */
export function runCommand(
  anchor: HTMLElement,
  spec: CommandSpec,
  host: ToolbarHost,
): void {
  if (spec.popup === "character-panel") void openCharPanel(anchor, spec, host);
  else if (spec.popup === "table-grid") openTableGrid(anchor, spec, host);
  else if (spec.popup)
    openPopover(anchor, popoverSectionsFor(spec, host, anchor), () =>
      host.focusEditor(),
    );
  else host.execute(spec);
}

/** The single button renderer shared by both layouts. */
export function createButton(
  parent: HTMLElement,
  spec: CommandSpec,
  host: ToolbarHost,
): HTMLButtonElement {
  const button = parent.createEl("button", {
    attr: { "aria-label": spec.name, "data-command": spec.id, type: "button" },
    cls: "format-button",
  });
  resolveIcon(button, spec.icon);
  if (spec.popup) button.addClass("has-menu");
  setTooltip(button, spec.name, { placement: "top" });
  // Tooltips read `aria-label` on every pointerover, and this listener runs
  // before the delegated one, so a key rebound in Settings shows up at once.
  button.addEventListener("pointerover", () => {
    button.setAttribute(
      "aria-label",
      withHotkey(spec.name, host.hotkeyFor(spec)),
    );
  });

  // Keep the editor selection: never let the button take focus.
  button.addEventListener("pointerdown", (event) => event.preventDefault());
  button.addEventListener("click", () => runCommand(button, spec, host));
  return button;
}

export interface TabButtonOptions {
  cls: string;
  text: string;
  active: boolean;
  tabindex?: number;
  onClick?: (event: MouseEvent) => void;
  onKeydown?: (event: KeyboardEvent) => void;
}

/** Helper for segmented controls and tabs ensuring proper ARIA roles and styling. */
export function createTabButton(
  parent: HTMLElement,
  options: TabButtonOptions,
): HTMLButtonElement {
  const button = parent.createEl("button", {
    attr: {
      "aria-selected": String(options.active),
      role: "tab",
      tabindex:
        options.tabindex !== undefined
          ? String(options.tabindex)
          : options.active
            ? "0"
            : "-1",
      type: "button",
    },
    cls: `${options.cls}${options.active ? " is-active" : ""}`,
    text: options.text,
  });
  if (options.onClick) button.addEventListener("click", options.onClick);
  if (options.onKeydown) button.addEventListener("keydown", options.onKeydown);
  return button;
}
