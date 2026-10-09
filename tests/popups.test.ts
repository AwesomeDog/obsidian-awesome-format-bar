import { describe, expect, it } from "vitest";
import { DROPDOWN_ITEMS } from "../src/model/command-table";
import { popupSections } from "../src/model/popups";
import type { CommandPopup } from "../src/model/types";

const itemsOf = (popup: CommandPopup | undefined) =>
  popupSections(popup).flatMap((section) => section.items);

describe("popupSections", () => {
  it("offers one item per command listed under a drop-down", () => {
    for (const [popup, ids] of Object.entries(DROPDOWN_ITEMS)) {
      const items = itemsOf(popup as CommandPopup);
      expect(items.map((item) => item.command?.id)).toEqual([...ids]);
      // A drop-down item is a command of its own: no option value of the popup's.
      for (const item of items) expect(item.value).toBeUndefined();
    }
  });

  it("carries the color palettes as option values", () => {
    const colors = itemsOf("color");
    expect(colors[0]).toMatchObject({
      label: "#c00000",
      swatch: "#c00000",
      value: "color:#c00000",
    });
    // No Color last but one, then the picker the editor menu cannot draw.
    expect(colors[colors.length - 2]).toMatchObject({
      icon: "ban",
      value: "color:none",
    });
    expect(colors[colors.length - 1]).toMatchObject({ picker: "color" });
    expect(itemsOf("highlight-color")[0]).toMatchObject({
      swatch: "var(--highlight-background-yellow)",
      value: "background:#ffff00",
    });
  });

  it("writes the property the font drop-downs share", () => {
    for (const [popup, property] of [
      ["font-size", "font-size"],
      ["font-family", "font-family"],
    ] as const)
      for (const item of itemsOf(popup))
        expect(item.value?.startsWith(`${property}:`)).toBe(true);
  });

  it("offers nothing for a command with no drop-down", () => {
    expect(itemsOf(undefined)).toEqual([]);
  });
});
