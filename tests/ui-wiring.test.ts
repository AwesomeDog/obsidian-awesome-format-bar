// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { commandById, COMMANDS } from "../src/model/command-table";
import { matchesCommand } from "../src/model/popups";
import type { CommandSpec } from "../src/model/types";
import { createButton } from "../src/toolbar/button";
import { closeFloating } from "../src/toolbar/floating";
import type { ToolbarHost, ToolbarState } from "../src/toolbar/host";
import { openSearchPopover, type PopoverSection } from "../src/toolbar/popover";

interface ElOptions {
  readonly cls?: string;
  readonly text?: string;
  readonly attr?: Readonly<Record<string, string>>;
}

function make(
  this: HTMLElement,
  tag: string,
  options?: ElOptions,
): HTMLElement {
  /** The shim implements createEl; XHTML NS still yields HTMLElement. */
  const el = this.appendChild(
    this.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", tag),
  );
  if (options?.cls) el.className = options.cls;
  if (options?.text !== undefined) el.textContent = options.text;
  for (const [key, value] of Object.entries(options?.attr ?? {}))
    el.setAttribute(key, value);
  return el;
}

/** Obsidian adds these to HTMLElement at runtime; a DOM environment does not. */
Object.assign(HTMLElement.prototype, {
  createEl(this: HTMLElement, tag: string, options?: ElOptions) {
    return make.call(this, tag, options);
  },
  createDiv(this: HTMLElement, options?: ElOptions) {
    return make.call(this, "div", options);
  },
  createSpan(this: HTMLElement, options?: ElOptions) {
    return make.call(this, "span", options);
  },
  empty(this: HTMLElement) {
    this.replaceChildren();
    return this;
  },
  addClass(this: HTMLElement, cls: string) {
    this.classList.add(cls);
    return this;
  },
  removeClass(this: HTMLElement, cls: string) {
    this.classList.remove(cls);
    return this;
  },
  toggleClass(this: HTMLElement, cls: string, value?: boolean) {
    this.classList.toggle(cls, value);
    return this;
  },
  setAttr(this: HTMLElement, key: string, value: string) {
    this.setAttribute(key, value);
    return this;
  },
  setText(this: HTMLElement, text: string) {
    this.textContent = text;
    return this;
  },
});

const SPECS = COMMANDS as readonly CommandSpec[];
const POPUPS = SPECS.filter((spec) => spec.popup);
const OWN_LAYER = new Set(["character-panel", "table-grid"]);

function makeHost(): { host: ToolbarHost; executed: string[] } {
  const executed: string[] = [];
  const host: ToolbarHost = {
    containerEl: document.body,
    positions: ["top", "following", "fixed"],
    pinnedSpecs: () => [],
    pinnedCommands: () => [],
    editPinned: () => {},
    state: (): ToolbarState => ({
      isEnabled: () => true,
      isLatched: () => false,
      inTable: false,
    }),
    execute: (spec) => {
      executed.push(spec.id);
    },
    hotkeyFor: () => "",
    labelFor: (spec) => spec.name,
    focusEditor: () => {},
    charUsage: () => ({}),
    recordCharUsage: () => {},
  };
  return { host, executed };
}

function anchorFor(spec: CommandSpec, host: ToolbarHost): HTMLButtonElement {
  const anchor = document.body.createDiv();
  return createButton(anchor, spec, host);
}

/** A panel can finish loading after the click returns. */
async function clickAndWait(
  spec: CommandSpec,
  host: ToolbarHost,
): Promise<{ button: HTMLButtonElement; layer: HTMLElement | null }> {
  const button = anchorFor(spec, host);
  button.click();
  let layer: HTMLElement | null = null;
  if (spec.popup) {
    try {
      await vi.waitFor(
        () =>
          expect(
            document.querySelector(".awesome-format-bar--menu"),
          ).not.toBeNull(),
        { interval: 10, timeout: 1000 },
      );
      layer = document.querySelector<HTMLElement>(".awesome-format-bar--menu");
    } catch {
      layer = null;
    }
  }
  return { button, layer };
}

/** A delayed panel must not be mistaken for the next command's layer. */
function clearLayers(): void {
  closeFloating();
  for (const el of Array.from(
    document.querySelectorAll(".awesome-format-bar--menu"),
  ))
    el.remove();
}

describe("toolbar UI wiring", () => {
  it("builds and runs every command", async () => {
    const { host, executed } = makeHost();
    const failed: string[] = [];
    for (const spec of SPECS) {
      try {
        const { button } = await clickAndWait(spec, host);
        if (button.dataset.command !== spec.id)
          failed.push(`${spec.id}: button`);
        if (!spec.popup && !executed.includes(spec.id))
          failed.push(`${spec.id}: not executed`);
      } catch (error) {
        failed.push(`${spec.id}: ${String(error)}`);
      } finally {
        clearLayers();
      }
    }
    expect(failed).toEqual([]);
  });

  it("opens every pop-up with entries and picks one", async () => {
    const { host } = makeHost();
    const failed: string[] = [];
    for (const spec of POPUPS) {
      try {
        const { layer } = await clickAndWait(spec, host);
        if (!layer) {
          failed.push(`${spec.id}: no layer`);
          continue;
        }
        if (OWN_LAYER.has(spec.popup ?? "")) continue;
        const entries = Array.from(
          layer.querySelectorAll<HTMLButtonElement>("button"),
        ).filter((entry) => entry.matches(".menu-item, .swatch"));
        if (entries.length === 0)
          failed.push(`${spec.id}: empty ${spec.popup}`);
        else entries[0]!.click();
      } catch (error) {
        failed.push(`${spec.id}: ${String(error)}`);
      } finally {
        clearLayers();
      }
    }
    expect(failed).toEqual([]);
  });
});

const SEARCH_SPECS = [
  commandById("bold"),
  commandById("italic"),
  commandById("paste-plain-text"),
];

function openCommandSearch(): {
  layer: HTMLElement;
  input: HTMLInputElement;
  picked: string[];
  dismissals: number[];
} {
  const picked: string[] = [];
  const dismissals: number[] = [];
  const sectionsFor = (query: string): PopoverSection[] => {
    const items = SEARCH_SPECS.filter((spec) =>
      matchesCommand(spec, query),
    ).map((spec) => ({
      label: spec.name,
      onChoose: () => picked.push(spec.id),
    }));
    return items.length ? [{ items }] : [];
  };
  openSearchPopover(document.body.createDiv(), sectionsFor, () =>
    dismissals.push(1),
  );
  const layer = document.querySelector<HTMLElement>(
    ".awesome-format-bar--menu",
  );
  const input = layer?.querySelector<HTMLInputElement>(".menu-search-input");
  if (!layer || !input) throw new Error("no search layer");
  return { layer, input, picked, dismissals };
}

function key(input: HTMLInputElement, name: string): void {
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: name,
    }),
  );
}

function typeSearch(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function menuItems(layer: HTMLElement): HTMLButtonElement[] {
  return Array.from(layer.querySelectorAll<HTMLButtonElement>(".menu-item"));
}

describe("ribbon command search", () => {
  afterEach(() => {
    clearLayers();
    document.body.replaceChildren();
  });

  it("highlights the first hit, moves with arrows, and runs on Enter", () => {
    const { layer, input, picked } = openCommandSearch();
    expect(menuItems(layer).map((entry) => entry.textContent)).toEqual([
      "Bold",
      "Italic",
      "Paste as Plain Text",
    ]);
    expect(menuItems(layer)[0]?.classList.contains("is-highlighted")).toBe(
      true,
    );
    key(input, "ArrowDown");
    expect(menuItems(layer)[0]?.classList.contains("is-highlighted")).toBe(
      false,
    );
    expect(menuItems(layer)[1]?.classList.contains("is-highlighted")).toBe(
      true,
    );
    key(input, "ArrowUp");
    expect(menuItems(layer)[0]?.classList.contains("is-highlighted")).toBe(
      true,
    );
    key(input, "Enter");
    expect(picked).toEqual(["bold"]);
  });

  it("filters by the English id and resets the highlight", () => {
    const { layer, input, picked } = openCommandSearch();
    key(input, "ArrowDown");
    typeSearch(input, "paste-plain-text");
    expect(menuItems(layer).map((entry) => entry.textContent)).toEqual([
      "Paste as Plain Text",
    ]);
    expect(menuItems(layer)[0]?.classList.contains("is-highlighted")).toBe(
      true,
    );
    key(input, "Enter");
    expect(picked).toEqual(["paste-plain-text"]);
  });

  it("shows an empty state that Enter cannot pick", () => {
    const { layer, input, picked } = openCommandSearch();
    typeSearch(input, "zzz");
    expect(menuItems(layer)).toHaveLength(0);
    expect(layer.querySelector(".menu-title")?.textContent).toBe("No matches");
    key(input, "Enter");
    expect(picked).toEqual([]);
  });

  it("empties the box on the first Escape and closes on the second", () => {
    const { input, dismissals } = openCommandSearch();
    typeSearch(input, "bold");
    key(input, "Escape");
    expect(input.value).toBe("");
    expect(document.querySelector(".awesome-format-bar--menu")).not.toBeNull();
    key(input, "Escape");
    expect(document.querySelector(".awesome-format-bar--menu")).toBeNull();
    expect(dismissals).toHaveLength(1);
  });
});
