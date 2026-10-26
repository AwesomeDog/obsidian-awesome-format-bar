import { t } from "../i18n/i18n";
import { resolveIcon } from "./icons";

export interface SearchBox {
  readonly el: HTMLInputElement;
  clear(): void;
  /** Esc: false when it emptied the box instead of letting the layer close. */
  dismiss(): boolean;
}

export interface SearchBoxOptions {
  readonly label: string;
  readonly placeholder: string;
  readonly onChange: (query: string) => void;
  readonly onClear?: (el: HTMLInputElement) => void;
  /** Only a layer that stays open after a pick wants one. */
  readonly clearButton?: boolean;
}

export function createSearchBox(
  parent: HTMLElement,
  options: SearchBoxOptions,
): SearchBox {
  const wrapper = parent.createDiv({ cls: "menu-search-wrapper" });
  const icon = wrapper.createSpan({ cls: "menu-search-icon" });
  resolveIcon(icon, "search");
  const el = wrapper.createEl("input", {
    attr: {
      "aria-label": options.label,
      autocomplete: "off",
      placeholder: options.placeholder,
      spellcheck: "false",
      type: "search",
    },
    cls: "menu-search-input",
  });

  let clearBtn: HTMLButtonElement | null = null;
  const clear = (): void => {
    el.value = "";
    clearBtn?.addClass("is-hidden");
    options.onChange("");
    options.onClear?.(el);
  };

  if (options.clearButton) {
    clearBtn = wrapper.createEl("button", {
      attr: {
        "aria-label": t("Clear search"),
        tabindex: "-1",
        type: "button",
      },
      cls: "menu-search-clear is-hidden",
    });
    resolveIcon(clearBtn, "x");
    // The click must not reach anything listening further up.
    clearBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      clear();
    });
  }

  el.addEventListener("input", () => {
    clearBtn?.toggleClass("is-hidden", el.value === "");
    options.onChange(el.value);
  });

  return {
    clear,
    dismiss: (): boolean => {
      if (el.value === "") return true;
      clear();
      return false;
    },
    el,
  };
}
