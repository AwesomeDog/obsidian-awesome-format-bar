import type { App } from "obsidian";
import { describe, expect, it } from "vitest";
import { registeredHotkey } from "../src/commands/registered";

/** Stands in for the HotkeyManager: what it prints is what the tooltip shows. */
function appWithKeys(keys: Record<string, string>): App {
  return {
    hotkeyManager: {
      printHotkeyForCommand: (id: string): string => keys[id] ?? "",
    },
  } as unknown as App;
}

describe("registeredHotkey", () => {
  it("prints the key a command is bound to", () => {
    const app = appWithKeys({ "editor:toggle-bold": "⌘ B" });
    expect(registeredHotkey(app, "editor:toggle-bold")).toBe("⌘ B");
  });

  it("prints the key the user assigned to an own command", () => {
    const app = appWithKeys({ "awesome-format-bar:bold": "Ctrl + Shift + X" });
    expect(registeredHotkey(app, "awesome-format-bar:bold")).toBe(
      "Ctrl + Shift + X",
    );
  });

  it("is empty for an unbound command", () => {
    expect(registeredHotkey(appWithKeys({}), "awesome-format-bar:bold")).toBe(
      "",
    );
  });

  it("is empty when the app has no hotkey manager", () => {
    expect(registeredHotkey({} as App, "editor:toggle-bold")).toBe("");
  });
});
