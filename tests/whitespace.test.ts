import { describe, expect, it } from "vitest";
import { INVISIBLE, ODD_SPACE } from "../src/whitespace";

/**
 * Sample text for **Show Whitespace**. Copy a line, paste it into a note,
 * switch the pane to Source mode and run the command — Live Preview draws
 * none of this.
 *
 * The odd and invisible runs below hold **real** characters, not `\u` escapes:
 * that is the whole point, they are what has to be pasted. They are invisible
 * here too, so the letters threaded between them are the only way to see where
 * each one sits. Do not tidy them away; these tests are what keeps them.
 */
const SAMPLE = {
  /** A plain space and a tab: CodeMirror draws both on its own. */
  plain: "a b\tc",
  /** U+00A0, U+2000, U+3000 — one orange dot each. */
  odd: "a b c　d",
  /** U+200B U+200C U+200D U+200E U+200F U+2060 U+00AD U+FEFF — markers. */
  invisible: "a​b‌c‍d‎e‏f⁠g­h﻿i",
};

describe("show whitespace", () => {
  it("marks every odd space", () => {
    expect(SAMPLE.odd.match(ODD_SPACE)).toHaveLength(3);
  });

  it("marks every invisible character", () => {
    expect(SAMPLE.invisible.match(INVISIBLE)).toHaveLength(8);
  });

  it("leaves a plain space and a tab to CodeMirror", () => {
    expect(SAMPLE.plain.match(ODD_SPACE)).toBeNull();
    expect(SAMPLE.plain.match(INVISIBLE)).toBeNull();
  });
});
