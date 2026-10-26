import { setTooltip } from "obsidian";
import type { CommandSpec } from "../model/types";
import type { ToolbarHost } from "./host";
import { resolveIcon } from "./icons";
import { openCharPanel } from "./char-panel";
import { openFontPopover, openPopover, popoverSectionsFor } from "./popover";
import { openTableGrid } from "./table-grid";

function withHotkey(name: string, hotkey: string): string {
  return hotkey ? `${name} (${hotkey})` : name;
}

/** Panels with a layer of their own, then drop-downs, then a command at once. */
export function runCommand(
  anchor: HTMLElement,
  spec: CommandSpec,
  host: ToolbarHost,
): void {
  if (spec.popup === "character-panel") void openCharPanel(anchor, spec, host);
  else if (spec.popup === "table-grid") openTableGrid(anchor, spec, host);
  else if (spec.popup === "font-family")
    openFontPopover(
      anchor,
      (query) => popoverSectionsFor(spec, host, anchor, query),
      () => host.focusEditor(),
    );
  else if (spec.popup)
    openPopover(anchor, popoverSectionsFor(spec, host, anchor), () =>
      host.focusEditor(),
    );
  else host.execute(spec);
}

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
  // This listener runs before the delegated one, so a rebound key shows at once.
  button.addEventListener("pointerover", () => {
    button.setAttribute(
      "aria-label",
      withHotkey(host.labelFor(spec), host.hotkeyFor(spec)),
    );
  });

  // Keep the editor selection: never let the button take focus.
  button.addEventListener("pointerdown", (event) => event.preventDefault());
  button.addEventListener("click", () => runCommand(button, spec, host));
  return button;
}

export interface IconButtonOptions {
  readonly icon: string;
  readonly label: string;
  readonly onClick: () => void;
  readonly cls?: string;
}

export function createIconButton(
  parent: HTMLElement,
  options: IconButtonOptions,
): HTMLButtonElement {
  const button = parent.createEl("button", {
    attr: { "aria-label": options.label, type: "button" },
    cls: options.cls ? `clickable-icon ${options.cls}` : "clickable-icon",
  });
  resolveIcon(button, options.icon);
  setTooltip(button, options.label);
  button.addEventListener("click", options.onClick);
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
