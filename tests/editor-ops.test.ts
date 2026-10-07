import { describe, expect, it } from "vitest";
import {
  insertBlockReference,
  insertCallout,
  insertChartBlock,
  numberHeadings,
  sortHeadings,
  toggleDropCap,
  toggleParagraphAlignment,
  type HeadingNumbering,
} from "../src/editor-ops/blocks";
import { changeCase, convertCase } from "../src/editor-ops/case";
import {
  convertImageSyntax,
  insertImageAlt,
  insertImageCaption,
  isImageLine,
  resetImage,
  setAllImageSizes,
  setImageSize,
} from "../src/editor-ops/image";
import { toggleInlinePair } from "../src/editor-ops/inline";
import { Lines, blocksFor } from "../src/editor-ops/lines";
import {
  cjkSpacing,
  cleanUp,
  smartPunctuation,
} from "../src/editor-ops/normalize";
import {
  duplicate,
  mergeLines,
  moveListItem,
  renumberList,
  reverseLines,
  sortLines,
  sortList,
  splitLines,
} from "../src/editor-ops/lists";
import {
  captureFormat,
  paintFormat,
  type InlineFormat,
} from "../src/editor-ops/painter";
import {
  applyChanges,
  normalizeRanges,
  type Plan,
  type Range,
} from "../src/editor-ops/plan";
import {
  applyHighlightColor,
  applySpanStyle,
  clearOwnedInlineHtml,
} from "../src/editor-ops/spans";
import { formatDate, formatDateTime } from "../src/editor-ops/text";

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

/** `numberHeadings` works on the note as a whole, so it takes no range. */
function numberNote(doc: string, scheme: HeadingNumbering): string {
  return run(doc, numberHeadings(doc, scheme));
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

describe("normalization", () => {
  it("converts punctuation while leaving inline code alone", () => {
    expect(apply('[He said "hi"... -- now `"raw"`]', smartPunctuation)).toBe(
      'He said “hi”… — now `"raw"`',
    );
  });

  it("keeps three or more hyphens: rules, frontmatter, table delimiters", () => {
    expect(apply("[a -- b --- c ---- d]", smartPunctuation)).toBe(
      "a — b --- c ---- d",
    );
    // No selection means the whole note, so a rule must survive untouched.
    for (const doc of [
      "a\n\n---\n\nb",
      "---\ntitle: x\n---\n\nbody",
      "| a | b |\n| --- | --- |\n| 1 | 2 |",
    ]) {
      expect(run(doc, smartPunctuation(doc, []))).toBe(doc);
    }
  });

  it("leaves a URL alone: an em dash where -- was stops it resolving", () => {
    expect(
      apply(
        "[see https://a--b.com/x and https://c.com/a...b]",
        smartPunctuation,
      ),
    ).toBe("see https://a--b.com/x and https://c.com/a...b");
  });

  it("still pairs the quotes written around a URL", () => {
    expect(
      apply('[He said "https://a--b.com is down"]', smartPunctuation),
    ).toBe("He said “https://a--b.com is down”");
  });

  it("adds spaces between CJK and Latin text", () => {
    expect(apply("[中文abc ABC中文 日本語123]", cjkSpacing)).toBe(
      "中文 abc ABC 中文 日本語 123",
    );
  });

  it("cleans common markdown issues without touching fenced code", () => {
    const doc = "a  \n\n\n* one\nhttps://example.com\n```\n* raw  \n```";
    const result = run(
      doc,
      cleanUp(doc, [{ from: 0, to: doc.length }], "trailing-spaces"),
    );
    expect(result).toContain("a\n\n\n* one");
    expect(result).toContain("* raw  ");
    expect(
      run(doc, cleanUp(doc, [{ from: 0, to: doc.length }], "bullet-style")),
    ).toContain("- one");
    expect(
      run(doc, cleanUp(doc, [{ from: 0, to: doc.length }], "bare-urls")),
    ).toContain("[https://example.com](https://example.com)");
    expect(
      run(doc, cleanUp(doc, [{ from: 0, to: doc.length }], "blank-lines")),
    ).toContain("a  \n\n* one");
    expect(
      run(
        "__bold__ and _italic_",
        cleanUp("__bold__ and _italic_", [], "emphasis-strong"),
      ),
    ).toBe("**bold** and *italic*");
  });

  it("drops invisible characters and turns NBSP into a plain space", () => {
    const doc = "a\u200bb\u00a0c\ufeffd\u00ade";
    expect(run(doc, cleanUp(doc, [], "invisible-characters"))).toBe("ab cde");
  });

  it("keeps the invisible characters that carry meaning", () => {
    // ZWJ holds an emoji family together, ZWNJ and LRM read as text.
    const doc = "a\u200db\u200cc\u200ed";
    expect(run(doc, cleanUp(doc, [], "invisible-characters"))).toBe(doc);
  });

  it("leaves invisible characters inside a code fence alone", () => {
    const doc = "a\u200bb\n```\nc\u200bd\n```";
    expect(run(doc, cleanUp(doc, [], "invisible-characters"))).toBe(
      "ab\n```\nc\u200bd\n```",
    );
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

  it("adds a font size beside a colour", () => {
    expect(
      apply('[<span style="color:#111">b</span>]', (d, r) =>
        applySpanStyle(d, r, "font-size", "1.5em"),
      ),
    ).toBe('<span style="color:#111;font-size:1.5em">b</span>');
  });

  it("keeps a comma inside a font family", () => {
    expect(
      apply('[<span style="font-family:Georgia,serif">b</span>]', (d, r) =>
        applySpanStyle(d, r, "font-size", "1.5em"),
      ),
    ).toBe('<span style="font-family:Georgia,serif;font-size:1.5em">b</span>');
  });

  it("clears the size and keeps the family", () => {
    expect(
      apply(
        '[<span style="font-family:serif;font-size:1.5em">b</span>]',
        (d, r) => applySpanStyle(d, r, "font-size", null),
      ),
    ).toBe('<span style="font-family:serif">b</span>');
  });
});

/** The emoji are the subject here, not filler: they are what 1.14 writes. */
describe("applyHighlightColor", () => {
  /** The palette's own first six, in its own order. */
  const YELLOW = "#ffff00";
  const RED = "#ff0000";
  const GREEN = "#008000";
  /** Word's other ten: no native syntax, so a span. */
  const LIME = "#00ff00";

  it("writes a native color as Obsidian's own marked highlight", () => {
    expect(apply("[word]", (d, r) => applyHighlightColor(d, r, RED))).toBe(
      "==\u{1F534}word==",
    );
  });

  it("leaves a color Obsidian cannot render as a span", () => {
    expect(apply("[word]", (d, r) => applyHighlightColor(d, r, LIME))).toBe(
      '<span style="background:#00ff00">word</span>',
    );
  });

  it("colors a highlight that has none", () => {
    expect(apply("==[word]==", (d, r) => applyHighlightColor(d, r, RED))).toBe(
      "==\u{1F534}word==",
    );
  });

  it("recolors a highlight the selection sits inside", () => {
    expect(
      apply("==\u{1F7E1}[word]==", (d, r) => applyHighlightColor(d, r, RED)),
    ).toBe("==\u{1F534}word==");
  });

  it("leaves a highlight already wearing the color alone", () => {
    expect(
      apply("==\u{1F534}[word]==", (d, r) => applyHighlightColor(d, r, RED)),
    ).toBe("==\u{1F534}word==");
  });

  it("rewrites a highlight the selection swallows whole", () => {
    expect(
      apply("[==\u{1F7E1}word==]", (d, r) => applyHighlightColor(d, r, RED)),
    ).toBe("==\u{1F534}word==");
  });

  it("takes the whole highlight away for No Color", () => {
    expect(
      apply("==\u{1F534}[word]==", (d, r) => applyHighlightColor(d, r, null)),
    ).toBe("word");
    expect(apply("==[word]==", (d, r) => applyHighlightColor(d, r, null))).toBe(
      "word",
    );
  });

  it("rewrites a background span in place instead of nesting one", () => {
    expect(
      apply('<span style="background:#ff0000">[word]</span>', (d, r) =>
        applyHighlightColor(d, r, RED),
      ),
    ).toBe("==\u{1F534}word==");
  });

  it("keeps what else the span carries", () => {
    expect(
      apply(
        '<span style="color:blue;background:#ff0000">[word]</span>',
        (d, r) => applyHighlightColor(d, r, RED),
      ),
    ).toBe('<span style="color:blue">==\u{1F534}word==');
  });

  it("drops the emoji before falling back to a span", () => {
    expect(
      apply("==\u{1F534}[word]==", (d, r) => applyHighlightColor(d, r, LIME)),
    ).toBe('==<span style="background:#00ff00">word</span>==');
  });

  it("paints every cursor in one plan", () => {
    expect(
      apply("[one] and [two]", (d, r) => applyHighlightColor(d, r, GREEN)),
    ).toBe("==\u{1F7E2}one== and ==\u{1F7E2}two==");
  });

  it("does nothing without a selection", () => {
    expect(apply("plain|", (d, r) => applyHighlightColor(d, r, YELLOW))).toBe(
      "plain",
    );
  });
});

describe("clearOwnedInlineHtml", () => {
  it("removes every plugin span style from a selected wrapper", () => {
    expect(
      apply(
        '<span style="color:red;background:yellow;font-size:1.2em;font-family:serif">[text]</span>',
        clearOwnedInlineHtml,
      ),
    ).toBe("text");
  });

  it("removes underline, subscript and superscript wrappers", () => {
    expect(
      apply("<u><sub><sup>[text]</sup></sub></u>", clearOwnedInlineHtml),
    ).toBe("text");
  });

  it("clears a touched outer wrapper even for a partial selection", () => {
    expect(
      apply('<span style="color:red">a[ b ]c</span>', clearOwnedInlineHtml),
    ).toBe("a b c");
  });

  it("leaves unrelated HTML wrappers untouched", () => {
    expect(apply("<em><u>[text]</u></em>", clearOwnedInlineHtml)).toBe(
      "<em>text</em>",
    );
  });

  it("does not pre-clear at a collapsed cursor", () => {
    expect(
      clearOwnedInlineHtml("<u>text</u>", [{ from: 3, to: 3 }]).changes,
    ).toEqual([]);
  });

  it("takes a drop cap off", () => {
    // What Clear Formatting relies on to reach the plugin's own HTML.
    expect(apply(`[${cap("3.4em")}O</span>nce]`, clearOwnedInlineHtml)).toBe(
      "Once",
    );
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

  it("sorts Chinese by pinyin rather than by code point", () => {
    expect(apply("[王五\n阿明\n李四]", sortLines)).toBe("阿明\n李四\n王五");
  });

  it("treats a blank line as a divider", () => {
    expect(apply("[c\na\n\nz\nb]", sortLines)).toBe("a\nc\n\nb\nz");
  });

  it("does not reorder across a code fence", () => {
    expect(apply("[c\na\n```\nz\nb\n```]", sortLines)).toBe(
      "a\nc\n```\nz\nb\n```",
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
      "b\na\n```\nc\nd\n```",
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

  it("sorts only a single selected list item", () => {
    expect(apply("[1. b]\n2. a\n3. c", sortList)).toBe("1. b\n2. a\n3. c");
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

describe("moveListItem", () => {
  const moveUp = (doc: string, ranges: Range[]): Plan =>
    moveListItem(doc, ranges, -1);
  const moveDown = (doc: string, ranges: Range[]): Plan =>
    moveListItem(doc, ranges, 1);

  it("moves an item and all children as one subtree", () => {
    expect(apply("|- A\n  - A1\n- B", moveDown)).toBe("- B\n- A\n  - A1");
  });

  it("moves a first child after the previous parent", () => {
    expect(apply("- A\n  - A1\n- B\n|  - B1", moveUp)).toBe(
      "- A\n  - A1\n  - B1\n- B",
    );
  });

  it("moves a last child before the next parent", () => {
    expect(apply("- A\n  - A1\n|  - A2\n- B", moveDown)).toBe(
      "- A\n  - A1\n- B\n  - A2",
    );
  });

  it("renumbers ordered lists after moving", () => {
    expect(apply("1. A\n2. B\n|3. C", moveUp)).toBe("1. A\n2. C\n3. B");
  });

  it("does nothing at root boundaries", () => {
    expect(apply("|- A\n- B", moveUp)).toBe("- A\n- B");
    expect(apply("- A\n- B|", moveDown)).toBe("- A\n- B");
  });

  it("does not cross blank lines, fences or headings", () => {
    expect(apply("|## H\n- A\n- B", moveDown)).toBe("## H\n- A\n- B");
    expect(apply("- A\n\n- B|", moveDown)).toBe("- A\n\n- B");
    expect(apply("- A\n```\n- B|\n```", moveUp)).toBe("- A\n```\n- B\n```");
    expect(apply("## H\n\n- A\n- B|\n\n## Next", moveDown)).toBe(
      "## H\n\n- A\n- B\n\n## Next",
    );
  });

  it("requires one collapsed cursor", () => {
    expect(apply("[- A\n- B]", moveDown)).toBe("- A\n- B");
    expect(
      moveDown("- A\n- B", [
        { from: 0, to: 0 },
        { from: 3, to: 3 },
      ]),
    ).toEqual({
      changes: [],
    });
  });

  it("keeps the cursor with the moved item", () => {
    const { doc, ranges } = parse("- A\n- B|");
    const plan = moveUp(doc, ranges);
    expect(run(doc, plan)).toBe("- B\n- A");
    expect(plan.select).toEqual({ from: 3, to: 3 });
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

describe("numberHeadings", () => {
  it("numbers every level of the outline", () => {
    expect(numberNote("# A\n## B\n## C\n# D", "outline")).toBe(
      "# 1. A\n## 1.1. B\n## 1.2. C\n# 2. D",
    );
  });

  it("counts a skipped level as the first of each step", () => {
    expect(numberNote("# A\n### B", "outline")).toBe("# 1. A\n### 1.1.1. B");
  });

  it("numbers each level in its own style, as Word's list library does", () => {
    expect(numberNote("# A\n## B\n### C\n## D\n# E", "multilevel")).toBe(
      "# 1) A\n## a) B\n### i) C\n## b) D\n# 2) E",
    );
  });

  it("romanises the top level", () => {
    expect(numberNote("# A\n## B\n### C\n# D", "roman")).toBe(
      "# I. A\n## A. B\n### 1. C\n# II. D",
    );
  });

  it("romanises past IV", () => {
    expect(numberNote("# a\n# b\n# c\n# d\n# e", "roman").split("\n")[3]).toBe(
      "# IV. d",
    );
  });

  it("carries on past z the way Word does", () => {
    const doc = `# A\n${Array.from({ length: 27 }, () => "## x").join("\n")}`;
    const lines = numberNote(doc, "multilevel").split("\n");
    expect(lines[lines.length - 1]).toBe("## aa) x");
  });

  it("replaces a scheme instead of stacking one on top of it", () => {
    expect(numberNote("# 1. A\n## 1.1. B", "multilevel")).toBe(
      "# 1) A\n## a) B",
    );
  });

  it("does nothing when the numbering is already right", () => {
    const once = numberNote("# A\n## B", "outline");
    expect(numberHeadings(once, "outline").changes).toEqual([]);
  });

  it("takes the numbers back off", () => {
    expect(numberNote("# 1. A\n## 1.1. B", null)).toBe("# A\n## B");
  });

  it("leaves a heading that only starts with a number alone", () => {
    expect(numberNote("## 2024 in review\n## 1. Real one", null)).toBe(
      "## 2024 in review\n## Real one",
    );
  });

  it("does not number a heading inside a code fence", () => {
    expect(numberNote("# A\n```\n# z\n```\n# B", "outline")).toBe(
      "# 1. A\n```\n# z\n```\n# 2. B",
    );
  });

  it("does not number a heading quoted in a callout", () => {
    expect(numberNote("# A\n> [!note]\n> ## z\n# B", "outline")).toBe(
      "# 1. A\n> [!note]\n> ## z\n# 2. B",
    );
  });

  it("does not number a YAML comment in front matter", () => {
    expect(
      numberNote("---\ntitle: x\n# comment\n---\n# A\n# B", "outline"),
    ).toBe("---\ntitle: x\n# comment\n---\n# 1. A\n# 2. B");
  });

  it("reads a `---` rule at the top as content, not as front matter", () => {
    expect(numberNote("---\n\n# A\n# B", "outline")).toBe(
      "---\n\n# 1. A\n# 2. B",
    );
  });

  it("does nothing in a note without headings", () => {
    expect(numberNote("b\na", "outline")).toBe("b\na");
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

  it("does not join the lines a code fence holds", () => {
    expect(apply("[a\nb\n```\nc\nd\n```]", mergeLines)).toBe(
      "a b\n```\nc\nd\n```",
    );
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

  it("does not split the lines a code fence holds", () => {
    expect(apply("[a、b\n```\nc、d\n```]", splitLines)).toBe(
      "a\nb\n```\nc、d\n```",
    );
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
    expect(apply("buy [coffee] and tea", duplicate)).toBe(
      "buy coffeecoffee and tea",
    );
  });

  /** VS Code joins a selection spanning lines the same way; no line break. */
  it("selects the copy of a selection", () => {
    const { doc, ranges } = parse("[ab]cd");
    expect(duplicate(doc, ranges).select).toEqual({ from: 2, to: 4 });
    expect(apply("[- a\n- b]", duplicate)).toBe("- a\n- b- a\n- b");
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

/** The wrapper a drop cap writes, latin and full-width. */
function cap(size: string): string {
  return `<span style="float:left;font-size:${size};line-height:.85;padding-right:.06em">`;
}

describe("toggleDropCap", () => {
  it("drops the first letter of the paragraph under the caret", () => {
    expect(apply("|Once upon a time", (d, r) => toggleDropCap(d, r))).toBe(
      `${cap("3.4em")}O</span>nce upon a time`,
    );
  });

  it("takes it off again", () => {
    const doc = `${cap("3.4em")}O</span>nce upon a time`;
    expect(apply(`|${doc}`, (d, r) => toggleDropCap(d, r))).toBe(
      "Once upon a time",
    );
  });

  it("uses a smaller size for a full-width character", () => {
    // The character is what is under test: a full-width glyph reads far
    // larger than a latin one at the same `em`.
    expect(apply("|中文 and the rest", (d, r) => toggleDropCap(d, r))).toBe(
      `${cap("2.2em")}中</span>文 and the rest`,
    );
  });

  it("leaves a heading, a list item and a quote alone", () => {
    expect(apply("|# Heading", (d, r) => toggleDropCap(d, r))).toBe(
      "# Heading",
    );
    expect(apply("|- item", (d, r) => toggleDropCap(d, r))).toBe("- item");
    expect(apply("|> quoted", (d, r) => toggleDropCap(d, r))).toBe("> quoted");
  });

  it("leaves a fenced block alone", () => {
    expect(apply("```\n|code\n```", (d, r) => toggleDropCap(d, r))).toBe(
      "```\ncode\n```",
    );
  });

  it("leaves front matter alone", () => {
    const doc = "---\ntitle: Note\n---\n\nBody text here";
    expect(run(doc, toggleDropCap(doc, [{ from: 5, to: 5 }]))).toBe(doc);
  });

  it("will not start on punctuation", () => {
    expect(apply('|"Quoted"', (d, r) => toggleDropCap(d, r))).toBe('"Quoted"');
  });

  it("does nothing inside a table row", () => {
    const doc = "| a | b |";
    expect(run(doc, toggleDropCap(doc, [{ from: 2, to: 3 }]))).toBe(doc);
  });

  it("takes one off after the paragraph became a heading", () => {
    // Taking off must not depend on the line still being running text, or a
    // cap written before the heading marker would be stuck there for good.
    const doc = `# ${cap("3.4em")}O</span>nce`;
    expect(apply(`|${doc}`, (d, r) => toggleDropCap(d, r))).toBe("# Once");
  });

  it("drops inside a paragraph that alignment wrapped", () => {
    const doc = '<div style="text-align: center">\n|Once more\n</div>';
    expect(apply(doc, (d, r) => toggleDropCap(d, r))).toBe(
      `<div style="text-align: center">\n${cap("3.4em")}O</span>nce more\n</div>`,
    );
  });

  it("adds to every paragraph of a multi-cursor selection", () => {
    const { doc, ranges } = parse("[Alpha]\n\n[Beta]");
    expect(run(doc, toggleDropCap(doc, ranges))).toBe(
      `${cap("3.4em")}A</span>lpha\n\n${cap("3.4em")}B</span>eta`,
    );
  });

  it("moves a whole selection one way", () => {
    // Half added and half removed is not a thing anyone asked for: the first
    // paragraph decides.
    const { doc, ranges } = parse(`[${cap("3.4em")}A</span>lpha]\n\n[Beta]`);
    expect(run(doc, toggleDropCap(doc, ranges))).toBe("Alpha\n\nBeta");
  });
});

/** Passed in, not read from the clock: a Gantt has to be assertable. */
const TODAY = "2026-10-07";

describe("insertions", () => {
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

  // A diagram has no empty form: an empty block renders as an error, so this
  // writes the smallest diagram of the kind, never a fence waiting to be typed.
  it("writes a Mermaid block of its own", () => {
    expect(
      apply("|", (d, r) => insertChartBlock(d, r, "flowchart", TODAY)),
    ).toBe("```mermaid\nflowchart LR\n  A --> B\n```");
    expect(
      apply("above|below", (d, r) =>
        insertChartBlock(d, r, "flowchart", TODAY),
      ),
    ).toBe("above\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\nbelow");
  });

  it("replaces the selection rather than wrapping it", () => {
    expect(
      apply("[notes]", (d, r) => insertChartBlock(d, r, "class", TODAY)),
    ).toBe("```mermaid\nclassDiagram\n  Animal <|-- Duck\n```");
  });

  it("leaves the caret at the end of the last line inside", () => {
    const plan = insertChartBlock("", [{ from: 0, to: 0 }], "flowchart", TODAY);
    const caret = plan.select?.from ?? -1;
    expect(run("", plan).slice(0, caret)).toBe(
      "```mermaid\nflowchart LR\n  A --> B",
    );
  });

  it("writes one diagram per cursor and selects none", () => {
    const plan = insertChartBlock(
      "a\nb",
      [
        { from: 0, to: 0 },
        { from: 2, to: 2 },
      ],
      "flowchart",
      TODAY,
    );
    expect(plan.select).toBeUndefined();
    expect(plan.changes).toHaveLength(2);
  });

  it("dates a Gantt task with the day it is handed", () => {
    expect(apply("|", (d, r) => insertChartBlock(d, r, "gantt", TODAY))).toBe(
      "```mermaid\ngantt\n  title Project\n  section Phase\n  Task :a1, 2026-10-07, 7d\n```",
    );
  });

  // Mermaid's radar grammar wants the brace on the label's own line; a line
  // break between them is a parse error, so the shape is worth pinning down.
  it("keeps a radar curve's brace on the label line", () => {
    expect(apply("|", (d, r) => insertChartBlock(d, r, "radar", TODAY))).toBe(
      [
        "```mermaid",
        "radar-beta",
        "  axis A, B, C",
        '  curve c1["One"]{ 0.8, 0.6, 0.9 }',
        '  curve c2["Two"]{ 0.5, 0.9, 0.4 }',
        "```",
      ].join("\n"),
    );
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

describe("formatDate", () => {
  it("uses the same fixed pattern without a time", () => {
    expect(formatDate(new Date(2026, 8, 1, 4, 41))).toBe("2026-09-01");
    expect(formatDate(new Date(2026, 0, 9, 0, 5))).toBe("2026-01-09");
  });
});

/** Wiki brackets are the test grammar's own markers, so no `parse` here. */
function size(doc: string, caret: number, width: string | null): string {
  return run(doc, setImageSize(doc, [{ from: caret, to: caret }], width));
}

function caption(
  doc: string,
  caret: number,
): { text: string; select: Range | undefined } {
  const plan = insertImageCaption(doc, [{ from: caret, to: caret }], "Caption");
  return { text: run(doc, plan), select: plan.select };
}

describe("isImageLine", () => {
  it("tells a picture from every other embed", () => {
    expect(isImageLine("![[a.png]]")).toBe(true);
    expect(isImageLine("![[folder/a.jpeg|300]]")).toBe(true);
    expect(isImageLine("text ![alt](https://x/y) more")).toBe(true);
    expect(isImageLine("![[note]]")).toBe(false);
    expect(isImageLine("![[doc.pdf]]")).toBe(false);
    expect(isImageLine("![[clip.mp3]]")).toBe(false);
  });
});

describe("setImageSize", () => {
  it("sets and clears a wiki embed's width", () => {
    expect(size("![[a.png]]", 0, "300")).toBe("![[a.png|300]]");
    expect(size("![[a.png|300]]", 0, "400")).toBe("![[a.png|400]]");
    expect(size("![[a.png|300]]", 0, null)).toBe("![[a.png]]");
  });

  it("sets a Markdown image's width in the alt text", () => {
    expect(size("![alt](https://x/y.png)", 0, "200")).toBe(
      "![alt|200](https://x/y.png)",
    );
    expect(size("![alt|200](https://x/y.png)", 0, "300")).toBe(
      "![alt|300](https://x/y.png)",
    );
    expect(size("![alt|200](https://x/y.png)", 0, null)).toBe(
      "![alt](https://x/y.png)",
    );
    // A bare width with no alt text is Obsidian's own short form.
    expect(size("![](https://x/y.png)", 0, "200")).toBe(
      "![200](https://x/y.png)",
    );
    expect(size("![200](https://x/y.png)", 0, null)).toBe(
      "![](https://x/y.png)",
    );
  });

  it("leaves the URL alone: a pipe there is part of the path", () => {
    expect(size("![alt](https://x/y.png|300)", 0, "600")).toBe(
      "![alt|600](https://x/y.png|300)",
    );
  });

  it("escapes the pipe inside a table cell", () => {
    expect(size("|![[a.png]]|b|", 1, "300")).toBe("|![[a.png\\|300]]|b|");
  });

  it("keeps an alias and writes the size after it", () => {
    expect(size("![[a.png|fig 1]]", 0, "300")).toBe("![[a.png|fig 1|300]]");
    expect(size("![[a.png|fig 1|300]]", 0, "400")).toBe("![[a.png|fig 1|400]]");
    expect(size("![[a.png|fig 1|300]]", 0, null)).toBe("![[a.png|fig 1]]");
    // Obsidian only reads the last segment, so a size that is not last is
    // alias text: the width goes after it rather than replacing it.
    expect(size("![[a.png|300|fig 1]]", 0, "400")).toBe(
      "![[a.png|300|fig 1|400]]",
    );
  });

  it("leaves a note alone and sizes a titled link", () => {
    expect(size("![[note]]", 0, "300")).toBe("![[note]]");
    expect(size('![alt](url "title")', 0, "300")).toBe(
      '![alt|300](url "title")',
    );
  });
});

describe("setAllImageSizes", () => {
  function all(doc: string, width: string | null): string {
    return run(doc, setAllImageSizes(doc, width));
  }

  it("sizes every picture in the note", () => {
    expect(all("![[a.png]]\n\n![[b.png|100]]\n", "300")).toBe(
      "![[a.png|300]]\n\n![[b.png|300]]\n",
    );
  });

  it("clears every width at once", () => {
    expect(all("![[a.png|300]]\ntext\n![[b.png|100]]", null)).toBe(
      "![[a.png]]\ntext\n![[b.png]]",
    );
  });

  it("leaves a picture that already has the width alone", () => {
    expect(all("![[a.png|300]]", "300")).toBe("![[a.png|300]]");
  });

  it("does nothing when the note has no picture", () => {
    expect(all("just text\n![[note]]", "300")).toBe("just text\n![[note]]");
  });

  it("escapes the pipe of a picture inside a table", () => {
    expect(all("|![[a.png]]|b|\n|-|-|", "300")).toBe(
      "|![[a.png\\|300]]|b|\n|-|-|",
    );
  });

  it("skips the pictures a code fence holds", () => {
    const doc = "![[a.png]]\n\n```\n![[b.png]]\n![c](d.png)\n```\n";
    expect(all(doc, "300")).toBe(
      "![[a.png|300]]\n\n```\n![[b.png]]\n![c](d.png)\n```\n",
    );
  });
});

describe("insertImageAlt", () => {
  function alt(
    doc: string,
    caret: number,
  ): {
    text: string;
    select: Range | undefined;
  } {
    const plan = insertImageAlt(doc, [{ from: caret, to: caret }], "Alt Text");
    return { text: run(doc, plan), select: plan.select };
  }

  it("writes a selected alt text into a wiki embed", () => {
    expect(alt("![[a.png]]", 0)).toEqual({
      text: "![[a.png|Alt Text]]",
      select: { from: 9, to: 17 },
    });
  });

  it("writes a selected alt text into a Markdown image", () => {
    expect(alt("![](https://x/y.png)", 0)).toEqual({
      text: "![Alt Text](https://x/y.png)",
      select: { from: 2, to: 10 },
    });
  });

  it("keeps the width and puts the alt text before it", () => {
    expect(alt("![[a.png|300]]", 0).text).toBe("![[a.png|Alt Text|300]]");
    expect(alt("![300](https://x/y.png)", 0)).toEqual({
      text: "![Alt Text|300](https://x/y.png)",
      select: { from: 2, to: 10 },
    });
  });

  it("selects an alt text that is already there", () => {
    expect(alt("![[a.png|fig 1]]", 0)).toEqual({
      text: "![[a.png|fig 1]]",
      select: { from: 9, to: 14 },
    });
  });

  it("does nothing off a picture", () => {
    expect(alt("![[note]]", 0)).toEqual({
      text: "![[note]]",
      select: undefined,
    });
  });
});

describe("resetImage", () => {
  function reset(doc: string, caret: number): string {
    return run(doc, resetImage(doc, [{ from: caret, to: caret }]));
  }

  it("drops the width and the alt text of a wiki embed", () => {
    expect(reset("![[a.png|fig 1|300]]", 0)).toBe("![[a.png]]");
  });

  it("drops the width and the alt text of a Markdown image", () => {
    expect(reset("![alt|300](https://x/y.png)", 0)).toBe(
      "![](https://x/y.png)",
    );
  });

  it("does nothing to a picture that has neither", () => {
    expect(reset("![[a.png]]", 0)).toBe("![[a.png]]");
  });

  it("does nothing off a picture", () => {
    expect(reset("![[note|300]]", 0)).toBe("![[note|300]]");
  });
});

describe("convertImageSyntax", () => {
  function convert(doc: string, caret: number): string {
    return run(doc, convertImageSyntax(doc, [{ from: caret, to: caret }]));
  }

  it("turns a wiki embed into a Markdown image and back", () => {
    expect(convert("![[a.png]]", 0)).toBe("![](a.png)");
    expect(convert("![](a.png)", 0)).toBe("![[a.png]]");
  });

  it("carries the alt text and the width across", () => {
    expect(convert("![[a.png|fig 1|300]]", 0)).toBe("![fig 1|300](a.png)");
    expect(convert("![fig 1|300](a.png)", 0)).toBe("![[a.png|fig 1|300]]");
  });

  it("swaps a space for %20 so the link stays valid", () => {
    expect(convert("![[pasted image.png]]", 0)).toBe("![](pasted%20image.png)");
    expect(convert("![](pasted%20image.png)", 0)).toBe("![[pasted image.png]]");
  });

  it("leaves an external image alone: it cannot be a wiki embed", () => {
    expect(convert("![alt](https://x/y.png)", 0)).toBe(
      "![alt](https://x/y.png)",
    );
  });

  it("does nothing off a picture", () => {
    expect(convert("![[note]]", 0)).toBe("![[note]]");
  });
});

describe("insertImageCaption", () => {
  it("writes a selected caption under the picture", () => {
    expect(caption("![[a.png]]", 0)).toEqual({
      text: "![[a.png]]\n*Caption*",
      select: { from: 12, to: 19 },
    });
  });

  it("keeps the blank line after a trailing picture", () => {
    expect(caption("![[a.png]]\n", 0)).toEqual({
      text: "![[a.png]]\n*Caption*\n",
      select: { from: 12, to: 19 },
    });
  });

  it("selects a caption that is already there", () => {
    expect(caption("![[a.png]]\n*Old*", 0)).toEqual({
      text: "![[a.png]]\n*Old*",
      select: { from: 12, to: 15 },
    });
  });

  it("pushes a following line down instead of overwriting it", () => {
    expect(caption("![[a.png]]\ntext", 0)).toEqual({
      text: "![[a.png]]\n*Caption*\ntext",
      select: { from: 12, to: 19 },
    });
  });

  it("stays inside the div a centred picture is wrapped in", () => {
    expect(
      caption('<div style="text-align: center">\n![[a.png]]\n</div>', 33),
    ).toEqual({
      text: '<div style="text-align: center">\n![[a.png]]\n*Caption*\n</div>',
      select: { from: 45, to: 52 },
    });
  });

  it("does nothing off a picture", () => {
    expect(caption("text", 0)).toEqual({ text: "text", select: undefined });
  });
});

describe("format painter", () => {
  /** `captureFormat` on the first [selection] of `input`. */
  function brush(input: string): InlineFormat {
    const { doc, ranges } = parse(input);
    const range = ranges[0];
    if (!range) throw new Error(`no selection in ${input}`);
    return captureFormat(doc, range);
  }

  /** Paints onto every [selection] of `input`. */
  function paint(input: string, format: InlineFormat): string {
    const { doc, ranges } = parse(input);
    return run(doc, paintFormat(doc, ranges, format));
  }

  /** Nothing selected is nothing worn: the brush that clears formatting. */
  const plain = brush("[plain]");

  it("captures the layer a double-clicked word sits in", () => {
    expect(brush("**[bold]**").bold).toBe(true);
    expect(paint("[word]", brush("**[bold]**"))).toBe("**word**");
  });

  it("captures nothing between two marked spans", () => {
    expect(brush("**a**[ and ]**b**")).toEqual(plain);
  });

  it("assigns, so what the source lacks comes off the target", () => {
    expect(paint("~~[struck]~~", brush("**[bold]**"))).toBe("**struck**");
  });

  it("clears formatting when the source is plain", () => {
    expect(paint("~~[struck]~~", plain)).toBe("struck");
  });

  it("never touches inline code", () => {
    expect(paint("`[code]`", plain)).toBe("`code`");
  });

  it("paints a link without taking it apart", () => {
    const doc = "[text](url)";
    const whole = [{ from: 0, to: doc.length }];
    expect(run(doc, paintFormat(doc, whole, brush("**[b]**")))).toBe(
      "**[text](url)**",
    );
  });

  it("rewrites a whole span in place instead of nesting one", () => {
    const red = brush('[<span style="color:red">red</span>]');
    const blue = '[<span style="color:blue">blue</span>]';
    expect(paint(blue, red)).toBe('<span style="color:red">blue</span>');
  });

  it("wraps a selection that is only part of a span", () => {
    const red = brush('[<span style="color:red">red</span>]');
    const inside = '<span style="color:blue">b[lue]</span>';
    expect(paint(inside, red)).toBe(
      '<span style="color:blue">b<span style="color:red">lue</span></span>',
    );
  });

  it("reads the highlight emoji as a background color", () => {
    expect(brush("==🔴[todo]==").background).toBe("#ff0000");
    expect(paint("[word]", brush("==🔴[todo]=="))).toBe("==🔴word==");
  });

  it("reads the square emoji too", () => {
    expect(brush("==🟥[todo]==").background).toBe("#ff0000");
    expect(paint("[word]", brush("==🟥[todo]=="))).toBe("==🔴word==");
  });

  it("paints a highlight that carries no color without giving it one", () => {
    expect(brush("==[todo]==").background).toBeNull();
    expect(paint("[word]", brush("==[todo]=="))).toBe("==word==");
  });

  it("leaves a color Obsidian cannot render as a span", () => {
    const lime = brush('[<span style="background:#00ff00">lime</span>]');
    expect(paint("[word]", lime)).toBe(
      '<span style="background:#00ff00">word</span>',
    );
  });

  it("turns a background span into a native highlight", () => {
    const red = brush("==🔴[todo]==");
    expect(paint('[<span style="background:#ff0000">word</span>]', red)).toBe(
      "==🔴word==",
    );
  });

  it("does not carry a drop cap's size away as a font size", () => {
    // A drop cap decorates the paragraph, not the character: its 3.4em is
    // not a font size to pass on to the next one.
    const capped = `${cap("3.4em")}O</span>nce`;
    expect(brush(`[${capped}]`).fontSize).toBeNull();
    expect(paint("[word]", brush(`[${capped}]`))).toBe("word");
  });

  it("paints over a drop cap without taking it apart", () => {
    const capped = `${cap("3.4em")}O</span>nce`;
    expect(paint(`[${capped}]`, brush("**[b]**"))).toBe(`**${capped}**`);
  });

  it("takes the emoji off with the marker, leaving none bare", () => {
    expect(paint("==🔴[todo]==", plain)).toBe("todo");
  });

  it("captures only the layer the selection starts in", () => {
    const nested = brush("**[b] <u>u</u>**");
    expect(nested.underline).toBe(false);
    expect(paint("[word]", nested)).toBe("**word**");
  });

  it("captures a marker the selection opens on", () => {
    expect(brush("[**bold** plain]").bold).toBe(true);
    expect(brush("[plain **bold**]").bold).toBe(false);
  });

  it("clears the formatting a selection carries inside itself", () => {
    expect(paint("[plain **bold** tail]", plain)).toBe("plain bold tail");
    expect(paint("[**bold** plain]", plain)).toBe("bold plain");
    expect(
      paint('[plain <span style="color:red">red</span> tail]', plain),
    ).toBe("plain red tail");
  });

  it("makes a mixed selection uniform instead of nesting markers", () => {
    const bold = brush("**[b]**");
    expect(paint("[plain **bold** tail]", bold)).toBe("**plain bold tail**");
    expect(paint("[**bold** plain]", bold)).toBe("**bold plain**");
  });

  it("splits a run the selection cuts in half", () => {
    // Only the selected characters change; the run carries on around them.
    expect(paint("x **[bol]d** y", plain)).toBe("x bol**d** y");
    expect(paint("[x **bol]d** y", plain)).toBe("x bol**d** y");
    // The run ends on the far edge, or inside the selection: same result.
    expect(paint("x **bo[ld]** y", plain)).toBe("x **bo**ld y");
    expect(paint("x **bo[ld**] y", plain)).toBe("x **bo**ld y");
  });

  it("splits a span the selection cuts in half", () => {
    const size = '<span style="font-size:3em">';
    expect(paint(`x [${size}bi]g</span> y`, plain)).toBe(
      `x bi${size}g</span> y`,
    );
    expect(paint(`x ${size}b[ig</span>] y`, plain)).toBe(
      `x ${size}b</span>ig y`,
    );
    // A strict sub-range: the size comes off the middle only.
    expect(paint(`x ${size}b[ig]g</span> y`, plain)).toBe(
      `x ${size}b</span>ig${size}g</span> y`,
    );
  });

  it("clears a font size the selection only reaches into", () => {
    const size = '<span style="font-size:3em">';
    expect(paint(`lead [up${size}to]rest</span>tail`, plain)).toBe(
      `lead upto${size}rest</span>tail`,
    );
  });

  it("paints every cursor in one plan", () => {
    const { doc, ranges } = parse("a [b] c [d] e [f]");
    expect(run(doc, paintFormat(doc, ranges, brush("**[b]**")))).toBe(
      "a **b** c **d** e **f**",
    );
  });

  // `|` is the caret marker in `parse`, so this one spells its range out.
  it("stays inside a table cell", () => {
    const row = "| a | b |";
    expect(
      run(row, paintFormat(row, [{ from: 6, to: 7 }], brush("**[b]**"))),
    ).toBe("| a | **b** |");
  });

  it("leaves a target that already wears the format alone", () => {
    expect(paint("**[bold]**", brush("**[b]**"))).toBe("**bold**");
  });
});
