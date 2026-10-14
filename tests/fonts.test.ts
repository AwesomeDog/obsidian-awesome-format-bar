import { describe, expect, it, vi } from "vitest";
import {
  isSafeFamily,
  isFontInstalled,
  splitLocalFonts,
  type LocalFonts,
} from "../src/model/fonts";
import { ALL_FONTS } from "../src/model/palettes";

describe("isSafeFamily", () => {
  it("rejects what would break the span it is written into", () => {
    for (const name of [
      "",
      "Times; New Roman",
      'Times "New" Roman',
      "Times 'New' Roman",
      "Times\\New",
      "Times<New>",
    ])
      expect(isSafeFamily(name)).toBe(false);
  });

  it("accepts a name with spaces and digits", () => {
    expect(isSafeFamily("GB18030 Bitmap")).toBe(true);
    expect(isSafeFamily("Times New Roman")).toBe(true);
  });
});

describe("splitLocalFonts", () => {
  it("keeps each family once, however it is cased", () => {
    const { installed, extra } = splitLocalFonts([
      "MonoLisa",
      "monolisa",
      "MonoLisa",
    ]);
    expect([...installed]).toEqual(["monolisa"]);
    expect(extra).toEqual(["MonoLisa"]);
  });

  it("leaves out what the curated groups already offer", () => {
    const curated = ALL_FONTS[0]?.name ?? "";
    const { installed, extra } = splitLocalFonts([curated, "MonoLisa"]);
    expect(installed.has(curated.toLowerCase())).toBe(true);
    expect(extra).toEqual(["MonoLisa"]);
  });

  it("drops a family the note could not carry", () => {
    const { installed, extra } = splitLocalFonts(["Bad;Family", "Good One"]);
    expect([...installed]).toEqual(["good one"]);
    expect(extra).toEqual(["Good One"]);
  });

  it("sorts what is left", () => {
    const { extra } = splitLocalFonts(["Zebra", "Apple", "Mango"]);
    expect(extra).toEqual(["Apple", "Mango", "Zebra"]);
  });
});

// The read itself only ever runs in the renderer, so the test stands one up.
describe("onLocalFonts", () => {
  it("tells whoever asked, once the machine has been read", async () => {
    vi.resetModules();
    vi.stubGlobal("window", {
      queryLocalFonts: async () => [{ family: "MonoLisa" }],
    });
    const fonts = await import("../src/model/fonts");

    let told = 0;
    const stop = fonts.onLocalFonts(() => {
      told += 1;
    });
    expect(fonts.localFonts().kind).toBe("pending");
    expect(told).toBe(0);

    fonts.loadLocalFonts();
    await vi.waitFor(() => expect(told).toBe(1));
    expect(fonts.isFontInstalled(fonts.localFonts(), "MonoLisa")).toBe(true);

    stop();
    vi.unstubAllGlobals();
  });
});

describe("isFontInstalled", () => {
  const ready: LocalFonts = {
    extra: [],
    installed: new Set(["georgia"]),
    kind: "ready",
  };

  it("answers only once the machine has been read", () => {
    expect(isFontInstalled({ kind: "pending" }, "Georgia")).toBeNull();
    expect(isFontInstalled({ kind: "unsupported" }, "Georgia")).toBeNull();
    expect(isFontInstalled(ready, "Georgia")).toBe(true);
    expect(isFontInstalled(ready, "Optima")).toBe(false);
  });
});
