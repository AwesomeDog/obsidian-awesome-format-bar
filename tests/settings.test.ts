import { describe, expect, it } from "vitest";
import {
  commandById,
  COMMANDS,
  DROPDOWN_ITEMS,
} from "../src/model/command-table";
import {
  BUILT_IN_COMMAND_TABS,
  COMPACT_ORDER,
  RIBBON_TABS,
  type RibbonGroup,
} from "../src/model/layout";
import { DEFAULT_PIN_ICON, pinnedSpecs } from "../src/model/pinned";
import {
  CURRENT_SETTINGS_VERSION,
  DEFAULT_SETTINGS,
  enabledToolbarPositions,
  normalizeSettings,
} from "../src/model/preferences";
import type { CommandSpec, PinnedCommand, Settings } from "../src/model/types";
import { readSettingKey, writeSettingKey } from "../src/settings";

const full = (): Settings => structuredClone(DEFAULT_SETTINGS);

/** The built-in tabs are deeply readonly; widen once for test iteration. */
const allGroups = (): RibbonGroup[] =>
  BUILT_IN_COMMAND_TABS.flatMap((tab) => [
    ...(tab.groups as readonly RibbonGroup[]),
  ]);

describe("normalizeSettings", () => {
  it("falls back to platform defaults for empty data", () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("fills only the missing fields", () => {
    const result = normalizeSettings({
      version: CURRENT_SETTINGS_VERSION,
      desktop: { following: true },
    });
    expect(result.desktop).toEqual({
      top: true,
      following: true,
      fixed: false,
    });
    expect(result.mobile).toEqual(DEFAULT_SETTINGS.mobile);
  });

  it("keeps an explicit all-false platform", () => {
    const result = normalizeSettings({
      version: CURRENT_SETTINGS_VERSION,
      desktop: { top: false, following: false, fixed: false },
    });
    expect(result.desktop).toEqual({
      top: false,
      following: false,
      fixed: false,
    });
  });

  it("resets on a version mismatch or a wrong shape", () => {
    expect(normalizeSettings({ version: 0, desktop: { top: false } })).toEqual(
      DEFAULT_SETTINGS,
    );
    expect(normalizeSettings("nonsense")).toEqual(DEFAULT_SETTINGS);
    expect(
      normalizeSettings({ version: CURRENT_SETTINGS_VERSION, desktop: 42 })
        .desktop,
    ).toEqual(DEFAULT_SETTINGS.desktop);
  });

  it("ignores non-boolean field values", () => {
    const result = normalizeSettings({
      version: CURRENT_SETTINGS_VERSION,
      desktop: { top: "yes" },
      enableOnMobile: 1,
    });
    expect(result.desktop.top).toBe(true);
    expect(result.enableOnMobile).toBe(false);
  });
});

describe("pinned commands", () => {
  const pinned = (overrides: Partial<PinnedCommand> = {}): PinnedCommand => ({
    commandId: "editor:toggle-bold",
    icon: "bold",
    name: "Bold",
    ...overrides,
  });

  it("drops entries that are not a usable command id", () => {
    const result = normalizeSettings({
      version: CURRENT_SETTINGS_VERSION,
      pinned: [
        pinned(),
        null,
        42,
        { icon: "bold", name: "Bold" },
        { commandId: "" },
      ],
    });
    expect(result.pinned).toEqual([pinned()]);
  });

  it("keeps one entry per command", () => {
    const result = normalizeSettings({
      version: CURRENT_SETTINGS_VERSION,
      pinned: [pinned(), pinned({ icon: "italic", name: "Italic" })],
    });
    expect(result.pinned).toEqual([pinned()]);
  });

  it("fills a missing icon and name", () => {
    const result = normalizeSettings({
      version: CURRENT_SETTINGS_VERSION,
      pinned: [{ commandId: "templater:insert" }],
    });
    expect(result.pinned).toEqual([
      {
        commandId: "templater:insert",
        icon: DEFAULT_PIN_ICON,
        name: "templater:insert",
      },
    ]);
  });

  it("builds specs that forward to the command they name", () => {
    const registry = new Map([["editor:toggle-bold", "Toggle bold"]]);
    const specs = pinnedSpecs([pinned()], (commandId) =>
      registry.get(commandId),
    );
    expect(specs).toEqual([
      {
        registeredCommandId: "editor:toggle-bold",
        icon: "bold",
        id: "pinned:editor:toggle-bold",
        kind: "registered",
        name: "Toggle bold",
      },
    ]);
  });
});

describe("enabledToolbarPositions", () => {
  it("returns nothing on mobile when mobile is disabled", () => {
    const settings = full();
    settings.enableOnMobile = false;
    expect(enabledToolbarPositions(settings, true)).toEqual([]);
    expect(enabledToolbarPositions(settings, false)).toEqual(["top"]);
  });

  it("does not mutate the stored settings", () => {
    const settings = full();
    settings.enableOnMobile = false;
    enabledToolbarPositions(settings, true);
    expect(settings.mobile.fixed).toBe(true);
  });

  it("reports every enabled position in a fixed order", () => {
    const settings = full();
    settings.desktop = { top: true, following: true, fixed: true };
    expect(enabledToolbarPositions(settings, false)).toEqual([
      "top",
      "following",
      "fixed",
    ]);
  });
});

describe("setting keys", () => {
  it("round-trips every nested key", () => {
    const settings = full();
    for (const key of [
      "desktop.top",
      "desktop.following",
      "desktop.fixed",
      "mobile.top",
      "mobile.following",
      "mobile.fixed",
      "enableOnMobile",
      "bindEnterToNextRow",
      "padCellWidthWithSpaces",
      "sortTableOnHeaderClick",
    ] as const) {
      writeSettingKey(settings, key, true);
      expect(readSettingKey(settings, key)).toBe(true);
      writeSettingKey(settings, key, false);
      expect(readSettingKey(settings, key)).toBe(false);
    }
  });

  it("writes one platform without touching the other", () => {
    const settings = full();
    writeSettingKey(settings, "mobile.top", true);
    expect(settings.desktop).toEqual(DEFAULT_SETTINGS.desktop);
  });
});

describe("command table contract", () => {
  it("appends Pinned to the built-in command tabs and nowhere else", () => {
    expect(BUILT_IN_COMMAND_TABS.map((tab) => tab.id)).not.toContain("pinned");
    expect(RIBBON_TABS).toHaveLength(BUILT_IN_COMMAND_TABS.length + 1);
    expect(RIBBON_TABS.map((tab) => tab.id)).toEqual([
      ...BUILT_IN_COMMAND_TABS.map((tab) => tab.id),
      "pinned",
    ]);
  });

  it("places every ribbon command in exactly one group", () => {
    // Drop-down items live in the popover, so no group lists them.
    const inDropdown = new Set(Object.values(DROPDOWN_ITEMS).flat());
    const expected = COMMANDS.map((spec) => spec.id).filter(
      (id) => !inDropdown.has(id),
    );
    const placed = allGroups().flatMap((group) => [...group.commands]);
    expect(placed).toHaveLength(expected.length);
    expect(new Set(placed).size).toBe(expected.length);
    expect([...placed].sort()).toEqual([...expected].sort());
  });

  it("places every table command in the tab Word's Layout tab matches", () => {
    expect(BUILT_IN_COMMAND_TABS[3]?.groups.map((group) => group.name)).toEqual(
      ["Rows & Columns", "Format", "Alignment", "Data", "Clipboard"],
    );
    for (const spec of COMMANDS as readonly CommandSpec[])
      if (spec.id.startsWith("table-") || spec.id === "paste-as-table")
        expect(spec.requiresTable ?? false).toBe(spec.id !== "paste-as-table");
  });

  it("keeps the compact subset valid and duplicate-free", () => {
    expect(new Set(COMPACT_ORDER).size).toBe(COMPACT_ORDER.length);
    for (const id of COMPACT_ORDER) expect(() => commandById(id)).not.toThrow();
  });

  it("gives every registered command its registry id", () => {
    for (const spec of COMMANDS)
      if (spec.kind === "registered")
        expect(spec.registeredCommandId).toBeTruthy();
  });

  /** Drop-down buttons are containers; off the palette, but with real items. */
  it("keeps dropdown buttons off the command palette", () => {
    for (const spec of COMMANDS as readonly CommandSpec[]) {
      if (!spec.popup) {
        expect(spec.commandPalette).toBeUndefined();
        continue;
      }
      expect(spec.commandPalette).toBe(false);
      if (spec.popup in DROPDOWN_ITEMS)
        expect(DROPDOWN_ITEMS[spec.popup]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
