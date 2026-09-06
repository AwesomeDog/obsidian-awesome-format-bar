import { describe, expect, it } from "vitest";
import {
  insertBlockReference,
  insertCallout,
  insertHorizontalRule,
  sortHeadings,
  toggleParagraphAlignment,
} from "../src/editor-ops/blocks";
import { changeCase, convertCase } from "../src/editor-ops/case";
import { toggleInlinePair } from "../src/editor-ops/inline";
import { Lines, blocksFor } from "../src/editor-ops/lines";
import {
  duplicate,
  mergeLines,
  renumberList,
  reverseLines,
  sortLines,
  sortList,
  splitLines,
} from "../src/editor-ops/lists";
import {
  applyChanges,
  normalizeRanges,
  type Plan,
  type Range,
} from "../src/editor-ops/plan";
import { applySpanStyle } from "../src/editor-ops/spans";
import { formatDateTime } from "../src/editor-ops/text";

/** Applies a plan the way the editor would, so tests assert on text. */
function run(doc: string, plan: Plan): string {
  return applyChanges(doc, plan.changes);
}

/** `|` marks a caret, `[` and `]` mark a selection. */
function parse(input: string): { doc: string; ranges: Range[] } {
  const ranges: Range[] = [];
  let doc = "";
  let open: number | null = null;
  for (const char of input) {
    if (char === "|") {
      ranges.push({ from: doc.length, to: doc.length });
      continue;
    }
    if (char === "[") {
      open = doc.length;
      continue;
    }
    if (char === "]") {
      ranges.push({ from: open ?? doc.length, to: doc.length });
      open = null;
      continue;
    }
    doc += char;
  }
  return { doc, ranges };
}

function apply(
  input: string,
  fn: (doc: string, ranges: Range[]) => Plan,
): string {
  const { doc, ranges } = parse(input);
  return run(doc, fn(doc, ranges));
}

/** `sortHeadings` works on the note as a whole, so it takes no range. */
function sortNote(doc: string): string {
  return run(doc, sortHeadings(doc));
}

describe("ranges", () => {
  it("sorts, orients and merges overlaps", () => {
    expect(
      normalizeRanges([
        { from: 9, to: 4 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
      ]),
    ).toEqual([
      { from: 0, to: 3 },
      { from: 4, to: 9 },
    ]);
  });

  it("keeps distinct carets", () => {
    expect(
      normalizeRanges([
        { from: 5, to: 5 },
        { from: 1, to: 1 },
      ]),
    ).toEqual([
      { from: 1, to: 1 },
      { from: 5, to: 5 },
    ]);
  });
});

describe("Lines", () => {
  it("indexes offsets and lines both ways", () => {
    const lines = new Lines("ab\ncd\n\nef");
    expect(lines.count).toBe(4);
    expect(lines.at(1)).toBe("cd");
    expect(lines.at(2)).toBe("");
    expect(lines.lineOf(0)).toBe(0);
    expect(lines.lineOf(3)).toBe(1);
    expect(lines.lineOf(6)).toBe(2);
    expect(lines.slice(0, 1)).toBe("ab\ncd");
  });
});

describe("blocksFor", () => {
  it("excludes a line the selection only touches at its start", () => {
    const lines = new Lines("a\nb\nc");
    expect(blocksFor(lines, [{ from: 0, to: 2 }])).toEqual([[0, 0]]);
  });

  it("expands to paragraph bounds", () => {
    const lines = new Lines("a\nb\n\nc");
    expect(blocksFor(lines, [{ from: 2, to: 2 }], "paragraph")).toEqual([
      [0, 1],
    ]);
  });
});

describe("toggleInlinePair", () => {
  const u = (doc: string, ranges: Range[]): Plan =>
    toggleInlinePair(doc, ranges, "<u>", "</u>");

  it("wraps a selection", () => {
    expect(apply("a [bc] d", u)).toBe("a <u>bc</u> d");
  });

  it("unwraps when the markers are inside the selection", () => {
    expect(apply("a [<u>bc</u>] d", u)).toBe("a bc d");
  });

  it("unwraps when the selection sits between the markers", () => {
    expect(apply("a <u>[bc]</u> d", u)).toBe("a bc d");
  });

  it("inserts an empty pair and centres the caret", () => {
    const { doc, ranges } = parse("a |b");
    const plan = u(doc, ranges);
    expect(run(doc, plan)).toBe("a <u></u>b");
    expect(plan.select).toEqual({ from: 5, to: 5 });
  });

  it("handles multiple selections in one plan", () => {
    expect(apply("[a] and [b]", u)).toBe("<u>a</u> and <u>b</u>");
  });

  it("toggles symmetric markers only when adjacent", () => {
    const math = (doc: string, ranges: Range[]): Plan =>
      toggleInlinePair(doc, ranges, "$", "$");
    expect(apply("$[x]$", math)).toBe("x");
    expect(apply("[x]", math)).toBe("$x$");
  });
});

describe("applySpanStyle", () => {
  it("wraps a selection in a colour span", () => {
    expect(
      apply("a [b] c", (d, r) => applySpanStyle(d, r, "color", "#e03131")),
    ).toBe('a <span style="color:#e03131">b</span> c');
  });

  it("replaces the same property in place", () => {
    expect(
      apply('[<span style="color:#111">b</span>]', (d, r) =>
        applySpanStyle(d, r, "color", "#222"),
      ),
    ).toBe('<span style="color:#222">b</span>');
  });

  it("clears only the target property and keeps the other", () => {
    expect(
      apply('[<span style="color:#111;background:#eee">b</span>]', (d, r) =>
        applySpanStyle(d, r, "color", null),
      ),
    ).toBe('<span style="background:#eee">b</span>');
  });

  it("drops the span once its last property is cleared", () => {
    expect(
      apply('<span style="color:#111">[b]</span>', (d, r) =>
        applySpanStyle(d, r, "color", null),
      ),
    ).toBe("b");
  });

  it("ignores a collapsed cursor", () => {
    expect(
      applySpanStyle("ab", [{ from: 1, to: 1 }], "color", "#111").changes,
    ).toHaveLength(0);
  });
});

describe("case", () => {
  it("converts each mode", () => {
    expect(convertCase("hello world", "upper")).toBe("HELLO WORLD");
    expect(convertCase("Hello", "lower")).toBe("hello");
    expect(convertCase("hello wORLD", "capitalize")).toBe("Hello World");
    expect(convertCase("Hello", "toggle")).toBe("hELLO");
  });

  it("only rewrites the selection", () => {
    expect(apply("keep [this] keep", (d, r) => changeCase(d, r, "upper"))).toBe(
      "keep THIS keep",
    );
  });
});

describe("renumberList", () => {
  it("fixes a flat run", () => {
    expect(apply("|1. a\n1. b\n1. c", renumberList)).toBe("1. a\n2. b\n3. c");
  });

  it("gives nested levels their own counters", () => {
    const input = "|1. a\n  1. x\n  1. y\n5. b";
    expect(apply(input, renumberList)).toBe("1. a\n  1. x\n  2. y\n2. b");
  });

  it("continues across a single blank line", () => {
    expect(apply("|1. a\n\n7. b", renumberList)).toBe("1. a\n\n2. b");
  });

  it("restarts after an intervening paragraph", () => {
    const input = "1. a\n2. b\n\ntext\n\n|4. c\n9. d";
    expect(apply(input, renumberList)).toBe("1. a\n2. b\n\ntext\n\n1. c\n2. d");
  });

  it("keeps lazy continuation lines out of the numbering", () => {
    expect(apply("|1. a\n   more text\n1. b", renumberList)).toBe(
      "1. a\n   more text\n2. b",
    );
  });
});

describe("sortLines", () => {
  it("sorts numerically rather than lexically", () => {
    expect(apply("[10\n9\n1]", sortLines)).toBe("1\n9\n10");
  });

  it("is stable for equal keys", () => {
    expect(apply("[b\nB\na]", sortLines)).toBe("a\nb\nB");
  });

  it("treats a blank line as a divider", () => {
    expect(apply("[c\na\n\nz\nb]", sortLines)).toBe("a\nc\n\nb\nz");
  });

  it("does not reorder across a code fence", () => {
    expect(apply("[c\na\n```\nz\nb\n```]", sortLines)).toBe(
      "a\nc\n```\nb\nz\n```",
    );
  });
});

describe("reverseLines", () => {
  it("reverses the selected lines", () => {
    expect(apply("[a\nb\nc]", reverseLines)).toBe("c\nb\na");
  });

  it("reverses each side of a blank line", () => {
    expect(apply("[a\nb\n\nc\nd]", reverseLines)).toBe("b\na\n\nd\nc");
  });

  it("does not reorder across a code fence", () => {
    expect(apply("[a\nb\n```\nc\nd\n```]", reverseLines)).toBe(
      "b\na\n```\nd\nc\n```",
    );
  });
});

describe("sortList", () => {
  it("sorts a list level by level", () => {
    expect(apply("[- b\n  - z\n  - a\n- a]", sortList)).toBe(
      "- a\n- b\n  - a\n  - z",
    );
  });

  it("keeps a continuation line with its item", () => {
    expect(apply("[- b\n  note\n- a]", sortList)).toBe("- a\n- b\n  note");
  });

  it("sorts by the item's text and renumbers ordered items", () => {
    expect(apply("[1. b\n2. a]", sortList)).toBe("1. a\n2. b");
  });

  it("leaves a selection that holds no list alone", () => {
    expect(apply("[b\na]", sortList)).toBe("b\na");
  });

  it("leaves the paragraph above the list alone", () => {
    expect(apply("intro\n[- b\n- a]", sortList)).toBe("intro\n- a\n- b");
  });

  it("sorts only the selected items", () => {
    expect(apply("[- c\n- a]\n- z\n- b", sortList)).toBe("- a\n- c\n- z\n- b");
  });

  it("sorts the whole list from a bare cursor", () => {
    expect(apply("|- c\n- a", sortList)).toBe("- a\n- c");
  });

  it("keeps two lists separated by a blank line apart", () => {
    expect(apply("[- d\n- c\n\n- b\n- a]", sortList)).toBe(
      "- c\n- d\n\n- a\n- b",
    );
  });

  it("leaves a loose list alone rather than moving its blank lines", () => {
    expect(apply("[- d\n\n- c\n\n- b]", sortList)).toBe("- d\n\n- c\n\n- b");
  });
});

describe("sortHeadings", () => {
  it("sorts sibling headings and carries their sections along", () => {
    expect(sortNote("# B\nbody B\n# A\nbody A")).toBe(
      "# A\nbody A\n# B\nbody B",
    );
  });

  it("sorts each level on its own", () => {
    expect(sortNote("# B\n## z\n## a\n# A")).toBe("# A\n# B\n## a\n## z");
  });

  it("leaves what sits above the first heading alone", () => {
    expect(sortNote("---\ntitle: x\n---\n# B\n# A")).toBe(
      "---\ntitle: x\n---\n# A\n# B",
    );
  });

  it("does not sort a heading inside a code fence", () => {
    expect(sortNote("# B\n```\n# z\n# a\n```\n# A")).toBe(
      "# A\n# B\n```\n# z\n# a\n```",
    );
  });

  it("does not sort a heading quoted in a callout", () => {
    expect(sortNote("# B\n> [!note]\n> ## z\n> ## a\n# A")).toBe(
      "# A\n# B\n> [!note]\n> ## z\n> ## a",
    );
  });

  it("keeps the note's trailing newline", () => {
    expect(sortNote("# B\n# A\n")).toBe("# A\n# B\n");
  });

  it("does nothing in a note without headings", () => {
    expect(sortNote("b\na")).toBe("b\na");
  });
});

describe("mergeLines", () => {
  it("joins the selected lines into one", () => {
    expect(apply("[a\nb\nc]", mergeLines)).toBe("a b c");
  });

  it("keeps a blank line as a divider", () => {
    expect(apply("[a\nb\n\nc\nd]", mergeLines)).toBe("a b\n\nc d");
  });

  it("keeps the indentation of the first line", () => {
    expect(apply("[  a\n  b]", mergeLines)).toBe("  a b");
  });

  it("joins CJK without inserting a space", () => {
    expect(apply("[中文\n中文]", mergeLines)).toBe("中文中文");
  });
});

describe("splitLines", () => {
  it("splits at the separator the text uses most", () => {
    expect(apply("[a、b、c]", splitLines)).toBe("a\nb\nc");
  });

  it("prefers the separator used more than once", () => {
    expect(apply("[a、b,c、d]", splitLines)).toBe("a\nb,c\nd");
  });

  it("does nothing where there is no separator", () => {
    expect(apply("[a\nb]", splitLines)).toBe("a\nb");
  });
});

describe("duplicate", () => {
  it("copies the line below the caret", () => {
    expect(apply("a|\nb", duplicate)).toBe("a\na\nb");
    expect(apply("ab|", duplicate)).toBe("ab\nab");
  });

  it("puts the caret on the copy, at the same column", () => {
    const { doc, ranges } = parse("ab|cd");
    expect(duplicate(doc, ranges).select).toEqual({ from: 7, to: 7 });
  });

  it("copies the selection right after itself", () => {
    expect(apply("买 [咖啡] 和茶", duplicate)).toBe("买 咖啡咖啡 和茶");
  });

  /** VS Code joins a selection spanning lines the same way; no line break. */
  it("selects the copy of a selection", () => {
    const { doc, ranges } = parse("[ab]cd");
    expect(duplicate(doc, ranges).select).toEqual({ from: 2, to: 4 });
    expect(apply("[- 甲\n- 乙]", duplicate)).toBe("- 甲\n- 乙- 甲\n- 乙");
  });

  it("duplicates an empty line", () => {
    expect(apply("a\n|\n", duplicate)).toBe("a\n\n\n");
  });

  it("duplicates each cursor's line", () => {
    const { doc, ranges } = parse("a|\nb|");
    // `Plan.select` holds one range, so the editor maps the cursors itself.
    expect(duplicate(doc, ranges).select).toBeUndefined();
    expect(run(doc, duplicate(doc, ranges))).toBe("a\na\nb\nb");
  });
});

describe("toggleParagraphAlignment", () => {
  it("wraps a paragraph", () => {
    expect(
      apply("|text", (d, r) => toggleParagraphAlignment(d, r, "center")),
    ).toBe('<div style="text-align: center">\ntext\n</div>');
  });

  it("unwraps the same alignment", () => {
    const doc = '<div style="text-align: center">\n|text\n</div>';
    expect(apply(doc, (d, r) => toggleParagraphAlignment(d, r, "center"))).toBe(
      "text",
    );
  });

  it("switches alignment in place", () => {
    const doc = '<div style="text-align: center">\n|text\n</div>';
    expect(apply(doc, (d, r) => toggleParagraphAlignment(d, r, "right"))).toBe(
      '<div style="text-align: right">\ntext\n</div>',
    );
  });

  it("removes an empty wrapper without overlapping changes", () => {
    // Touching lines share a newline; removing them separately overlaps.
    const { doc, ranges } = parse('<div style="text-align: center">\n|</div>');
    const plan = toggleParagraphAlignment(doc, ranges, "center");
    plan.changes.forEach((change, index) => {
      if (index > 0)
        expect(change.from).toBeGreaterThanOrEqual(
          plan.changes[index - 1]?.to ?? 0,
        );
    });
    expect(run(doc, plan)).toBe("");
  });
});

describe("insertions", () => {
  it("adds a rule after the paragraph", () => {
    expect(apply("|a", insertHorizontalRule)).toBe("a\n\n---");
  });

  it("quotes a selection into a callout", () => {
    expect(apply("[a\nb]", (d, r) => insertCallout(d, r, "note"))).toBe(
      "> [!note]\n> a\n> b",
    );
    expect(apply("[a]", (d, r) => insertCallout(d, r, "tip"))).toBe(
      "> [!tip]\n> a",
    );
  });

  it("appends a block id once", () => {
    expect(apply("|text", (d, r) => insertBlockReference(d, r, "abc123"))).toBe(
      "text ^abc123",
    );
    expect(
      insertBlockReference("text ^abc123", [{ from: 0, to: 0 }], "new").changes,
    ).toHaveLength(0);
  });
});

describe("formatDateTime", () => {
  it("uses a fixed 24-hour pattern", () => {
    expect(formatDateTime(new Date(2026, 8, 1, 4, 41))).toBe(
      "2026-09-01 04:41",
    );
    expect(formatDateTime(new Date(2026, 0, 9, 0, 5))).toBe("2026-01-09 00:05");
  });
});
