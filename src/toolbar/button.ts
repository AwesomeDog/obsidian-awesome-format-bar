import { setTooltip } from "obsidian";
import type { CommandSpec } from "../model/types";
import type { ToolbarHost } from "./host";
import { resolveIcon } from "./icons";
import { openCharPanel } from "./char-panel";
import { openPopover, popoverSectionsFor } from "./popover";

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

  // Keep the editor selection: never let the button take focus.
  button.addEventListener("pointerdown", (event) => event.preventDefault());
  button.addEventListener("click", () => {
    if (spec.popup === "character-panel")
      void openCharPanel(button, spec, host);
    else if (spec.popup)
      openPopover(button, popoverSectionsFor(spec, host, button), () =>
        host.focusEditor(),
      );
    else host.execute(spec);
  });
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
