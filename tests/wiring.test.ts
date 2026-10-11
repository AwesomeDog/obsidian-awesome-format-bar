import type { App, Editor } from "obsidian";
import { describe, expect, it } from "vitest";
import { planFor, type CommandContext } from "../src/commands/dispatch";
import { COMMANDS, DROPDOWN_ITEMS } from "../src/model/command-table";
import { popupSections } from "../src/model/popups";
import type { CommandSpec } from "../src/model/types";

/** A missing case is a button that throws only when clicked: the editor-ops
 * tests call the functions directly and never go through the dispatch. */

const SPECS = COMMANDS as readonly CommandSpec[];

/** Every id a drop-down offers. Those commands are named here, not in code. */
const DROPDOWN_IDS = new Set<string>(
  Object.values(DROPDOWN_ITEMS).flatMap((ids) => [...ids]),
);

/** These two draw a layer of their own; see `runCommand`. */
const OWN_LAYER = new Set(["character-panel", "table-grid"]);

/** Commands that never reach `planFor`: their state or their editor call lives
 * in `executeSpec` or in the plugin itself. */
const ELSEWHERE = new Set([
  "undo",
  "redo",
  "increase-indent",
  "decrease-indent",
  "clear-formatting",
  "format-painter",
  "show-whitespace",
  "typewriter-mode",
]);

/** A caret in a table, so the commands that need one have one to find. */
const DOC = "| a | b |\n| --- | --- |\n| 1 | 2 |";

function context(): CommandContext {
  const editor = {
    getValue: (): string => DOC,
    getCursor: () => ({ ch: 2, line: 0 }),
    listSelections: () => [
      { anchor: { ch: 2, line: 0 }, head: { ch: 3, line: 0 } },
    ],
    posToOffset: (pos: { ch: number; line: number }): number => pos.ch,
  } as unknown as Editor;
  return { app: {} as App, editor, format: { padWidth: false } };
}

/** Whether something runs when the command is invoked. */
function routed(spec: CommandSpec): boolean {
  // Forwards to Obsidian: the registry is the implementation.
  if (spec.registeredCommandId) return true;
  // Clipboard and view commands: `runClipboard` and `toggleViewMode`.
  if (spec.kind === "clipboard" || spec.kind === "view") return true;
  // A drop-down container: the items under it are the commands that run.
  if (spec.popup && spec.commandPalette === false) return true;
  if (ELSEWHERE.has(spec.id)) return true;
  return planFor(context(), spec.id) !== null;
}

describe("command wiring", () => {
  it("gives every command an implementation", () => {
    const unrouted = SPECS.filter((spec) => !routed(spec)).map(
      (spec) => spec.id,
    );
    expect(unrouted).toEqual([]);
  });

  it("gives every drop-down items to show", () => {
    const empty = SPECS.filter((spec) => spec.popup)
      .filter((spec) => !OWN_LAYER.has(spec.popup ?? ""))
      .filter((spec) => popupSections(spec.popup).length === 0)
      .map((spec) => spec.popup);
    expect(empty).toEqual([]);
  });

  it("lists only real commands under a drop-down", () => {
    const known = new Set(SPECS.map((spec) => spec.id));
    expect([...DROPDOWN_IDS].filter((id) => !known.has(id))).toEqual([]);
  });

  it("keys drop-down items by a pop-up some command opens", () => {
    const opened = new Set(SPECS.map((spec) => spec.popup));
    const orphaned = Object.keys(DROPDOWN_ITEMS).filter(
      (key) => !opened.has(key as CommandSpec["popup"]),
    );
    expect(orphaned).toEqual([]);
  });

  it("names only real commands in the elsewhere list", () => {
    expect(
      [...ELSEWHERE].filter((id) => !SPECS.some((spec) => spec.id === id)),
    ).toEqual([]);
  });
});
