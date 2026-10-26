import { describe, expect, it } from "vitest";
import { INVISIBLE, ODD_SPACE } from "../src/whitespace";

/** Sample text for Show Whitespace. The odd and invisible runs hold real
 * characters, not escapes: they are what has to be pasted. Do not tidy them. */
const SAMPLE = {
  plain: "a b\tc",
  odd: "a b c　d",
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
