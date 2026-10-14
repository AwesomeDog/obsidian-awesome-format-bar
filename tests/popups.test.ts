import { describe, expect, it } from "vitest";
import { setLanguage } from "../src/i18n/i18n";
import { DROPDOWN_ITEMS } from "../src/model/command-table";
import type { LocalFonts } from "../src/model/fonts";
import {
  filterSections,
  popupSections,
  type PopupOptions,
  type PopupSection,
} from "../src/model/popups";
import type { CommandPopup } from "../src/model/types";

const itemsOf = (popup: CommandPopup | undefined, options?: PopupOptions) =>
  popupSections(popup, options).flatMap((section) => section.items);

/** A machine holding one curated font and one of its own. */
const MACHINE: LocalFonts = {
  extra: ["MonoLisa"],
  installed: new Set(["georgia", "monolisa"]),
  kind: "ready",
};

/** A machine that cannot be read: the curated fonts, and nothing else. */
const CURATED_ONLY: PopupOptions = { localFonts: { kind: "unsupported" } };

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
      for (const item of itemsOf(popup, CURATED_ONLY))
        expect(item.value?.startsWith(`${property}:`)).toBe(true);
  });

  // A `;` or `"` in the stack would write a span nothing can read back.
  it("gives every font a stack the span can carry", () => {
    for (const item of itemsOf("font-family", CURATED_ONLY)) {
      const value = item.value ?? "";
      expect(value.startsWith("font-family:")).toBe(true);
      expect(value).not.toContain(";");
      expect(value).not.toContain('"');
    }
  });

  // One name and one generic family: a longer chain buys nothing.
  it("follows every font with one generic family and nothing else", () => {
    const bare = [
      "none",
      "serif",
      "sans-serif",
      "monospace",
      "cursive",
      "fantasy",
    ];
    for (const item of itemsOf("font-family", CURATED_ONLY)) {
      const stack = (item.value ?? "").slice("font-family:".length);
      if (bare.includes(stack)) continue;
      expect(stack).toMatch(
        /^'[^']+', (serif|sans-serif|monospace|cursive|fantasy)$/,
      );
    }
  });

  it("clears the property for Default", () => {
    const item = itemsOf("font-family", CURATED_ONLY).find(
      (choice) => choice.label === "Default",
    );
    expect(item?.value).toBe("font-family:none");
    expect(item?.preview).toBeUndefined();
  });

  // A font's own name has to reach the note as the machine spells it.
  it("translates the generic families and leaves a font's own name alone", () => {
    const labels = (section?: PopupSection): string[] =>
      (section?.items ?? []).map((choice) => choice.label);
    try {
      setLanguage("zh");
      const [generic, serif] = popupSections("font-family", CURATED_ONLY);
      expect(labels(generic)).not.toContain("Serif");
      expect(labels(generic)).not.toContain("Default");
      expect(labels(serif)).toContain("Times New Roman");
    } finally {
      setLanguage("en");
    }
  });

  it("dims a font the machine lacks, and never a generic family", () => {
    const dimmed = new Map(
      itemsOf("font-family", { localFonts: MACHINE }).map((choice) => [
        choice.label,
        choice.dim === true,
      ]),
    );
    expect(dimmed.get("Georgia")).toBe(false);
    expect(dimmed.get("Optima")).toBe(true);
    for (const generic of [
      "Serif",
      "Sans Serif",
      "Monospace",
      "Cursive",
      "Fantasy",
    ])
      expect(dimmed.get(generic)).toBe(false);
  });

  it("lists the machine's own fonts under a group of their own", () => {
    const sections = popupSections("font-family", { localFonts: MACHINE });
    const last = sections[sections.length - 1];
    expect(last?.title).toBe("Local fonts");
    expect(last?.items.map((choice) => choice.value)).toEqual([
      "font-family:'MonoLisa'",
    ]);
  });

  it("waits for the machine's fonts with an entry that does nothing", () => {
    const sections = popupSections("font-family", {
      localFonts: { kind: "pending" },
    });
    expect(sections[sections.length - 1]?.items).toEqual([
      { disabled: true, label: "Reading installed fonts…" },
    ]);
  });

  it("offers no group at all where the machine cannot be read", () => {
    const sections = popupSections("font-family", {
      localFonts: { kind: "unsupported" },
    });
    expect(sections.map((section) => section.title)).not.toContain(
      "Local fonts",
    );
  });

  it("offers nothing for a command with no drop-down", () => {
    expect(itemsOf(undefined)).toEqual([]);
  });
});

describe("filterSections", () => {
  const sections = popupSections("font-family", CURATED_ONLY);

  it("returns everything for an empty query", () => {
    expect(filterSections(sections, "  ")).toBe(sections);
  });

  it("matches anywhere in the label, whatever the case", () => {
    const found = filterSections(sections, "MONO").flatMap((section) =>
      section.items.map((choice) => choice.label),
    );
    expect(found).toContain("JetBrains Mono");
    expect(found).toContain("Monospace");
  });

  it("drops a section with nothing left", () => {
    const found = filterSections(sections, "Courier");
    expect(found.map((section) => section.title)).toEqual(["Monospace"]);
  });

  it("leaves the local fonts out while they are still being read", () => {
    const pending = popupSections("font-family", {
      localFonts: { kind: "pending" },
    });
    expect(filterSections(pending, "MonoLisa")).toEqual([]);
  });
});
