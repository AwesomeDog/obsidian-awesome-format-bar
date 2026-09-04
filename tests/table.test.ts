import { describe, expect, it } from "vitest";
import { applyChanges, type Plan } from "../src/editor-ops/plan";
import {
  alignColumn,
  deleteColumn,
  deleteRow,
  formatAllTables,
  formatTable,
  insertColumnLeft,
  insertRowAbove,
  moveColumn,
  planTableEnter,
  moveRow,
  sortRows,
  type TableFormat,
} from "../src/editor-ops/table";
import { tableFromClipboard } from "../src/editor-ops/tsv";

const PADDED: TableFormat = { padWidth: true };
const TIGHT: TableFormat = { padWidth: false };

/** `^` marks the caret. Tables own every `|`, so a plain marker is not an option. */
function caret(input: string): { doc: string; offset: number } {
  const at = input.indexOf("^");
  return { doc: input.replace("^", ""), offset: at < 0 ? 0 : at };
}

function run(input: string, fn: (doc: string, at: number) => Plan): string {
  const { doc, offset } = caret(input);
  return applyChanges(doc, fn(doc, offset).changes);
}

describe("formatTable", () => {
  it("pads every cell to the widest one in its column", () => {
    expect(
      run("|a|b|\n|-|-|\n|c^|d|", (doc, at) => formatTable(doc, at, PADDED)),
    ).toBe(["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"));
  });

  it("writes a fixed three-dash rule when padding is off", () => {
    expect(
      run("|a|b|\n|-|-|\n|c^|d|", (doc, at) => formatTable(doc, at, TIGHT)),
    ).toBe(["| a | b |", "| --- | --- |", "| c | d |"].join("\n"));
  });

  it("pads short rows out to the widest row", () => {
    expect(
      run("|a|b|c|\n|-|-|-|\n|1^|", (doc, at) => formatTable(doc, at, PADDED)),
    ).toBe(
      [
        "| a   | b   | c   |",
        "| --- | --- | --- |",
        "| 1   |     |     |",
      ].join("\n"),
    );
  });

  it("keeps an escaped pipe escaped and counts it as two characters", () => {
    expect(
      run("|x|y|\n|-|-|\n|a\\|^b|c|", (doc, at) =>
        formatTable(doc, at, PADDED),
      ),
    ).toBe(["| x    | y   |", "| ---- | --- |", "| a\\|b | c   |"].join("\n"));
  });

  it("keeps the alignment of every column", () => {
    expect(
      run("|a|b|\n|-|:-:|\n|c^|d|", (doc, at) => formatTable(doc, at, PADDED)),
    ).toBe(["| a   | b   |", "| --- | :-: |", "| c   | d   |"].join("\n"));
  });

  it("pads CJK by display width, so the pipes line up", () => {
    expect(
      run("|中文|a|\n|-|-|\n|^b|c|", (doc, at) => formatTable(doc, at, PADDED)),
    ).toBe(["| 中文 | a   |", "| ---- | --- |", "| b    | c   |"].join("\n"));
  });

  it("does nothing outside a table", () => {
    const doc = "just text\nand|more^";
    expect(applyChanges(doc, formatTable(doc, 12, PADDED).changes)).toBe(doc);
  });

  it("ignores pipes inside a fenced code block", () => {
    const fenced = ["```sh", "|a|b|", "|-|-|", "|^c|d|", "```"].join("\n");
    expect(run(fenced, (doc, at) => formatTable(doc, at, PADDED))).toBe(
      fenced.replace("^", ""),
    );
  });

  it("does not leave a one-line $$ block open", () => {
    // Paired `$$` on one line: a miscount disables every table below it.
    const doc = ["$$ a + b = c $$", "", "|a|b|", "|-|-|", "|^c|d|"].join("\n");
    expect(run(doc, (text, at) => formatTable(text, at, PADDED))).toBe(
      [
        "$$ a + b = c $$",
        "",
        "| a   | b   |",
        "| --- | --- |",
        "| c   | d   |",
      ].join("\n"),
    );
  });

  it("keeps the indentation of a table nested in a list item", () => {
    // Rewriting it flush left would pull the table out of the list.
    const doc = ["- item", "  |a|b|", "  |-|-|", "  |^c|d|"].join("\n");
    expect(run(doc, (text, at) => formatTable(text, at, PADDED))).toBe(
      ["- item", "  | a   | b   |", "  | --- | --- |", "  | c   | d   |"].join(
        "\n",
      ),
    );
  });
});

describe("formatAllTables", () => {
  it("formats every table in the document", () => {
    const doc = "|a|b|\n|-|-|\n\nc\n\n|c|d|\n|-|-|";
    expect(applyChanges(doc, formatAllTables(doc, PADDED).changes)).toBe(
      [
        "| a   | b   |",
        "| --- | --- |",
        "",
        "c",
        "",
        "| c   | d   |",
        "| --- | --- |",
      ].join("\n"),
    );
  });

  it("skips fences and formats the tables around them", () => {
    const doc = ["```", "|a|b|", "|-|-|", "```", "", "|c|d|", "|-|-|"].join(
      "\n",
    );
    expect(applyChanges(doc, formatAllTables(doc, PADDED).changes)).toBe(
      [
        "```",
        "|a|b|",
        "|-|-|",
        "```",
        "",
        "| c   | d   |",
        "| --- | --- |",
      ].join("\n"),
    );
  });
});

describe("insertRowAbove", () => {
  it("inserts above the row holding the caret", () => {
    expect(
      run("|a|b|\n|-|-|\n|c|d|\n|e^|f|", (doc, at) =>
        insertRowAbove(doc, at, PADDED),
      ),
    ).toBe(
      [
        "| a   | b   |",
        "| --- | --- |",
        "| c   | d   |",
        "|     |     |",
        "| e   | f   |",
      ].join("\n"),
    );
  });

  it("leaves the caret at the start of the new row", () => {
    const { doc, offset } = caret("|a|b|\n|-|-|\n|^c|d|\n|e|f|");
    const plan = insertRowAbove(doc, offset, PADDED);
    expect(applyChanges(doc, plan.changes)).toBe(
      [
        "| a   | b   |",
        "| --- | --- |",
        "|     |     |",
        "| c   | d   |",
        "| e   | f   |",
      ].join("\n"),
    );
    // Start of the first cell of the inserted row, which is rendered line 2.
    expect(plan.select).toEqual({ from: 30, to: 30 });
  });
});

describe("insertColumnLeft", () => {
  it("inserts to the left of the column holding the caret", () => {
    expect(
      run("|a|b|\n|-|-|\n|c^|d|", (doc, at) =>
        insertColumnLeft(doc, at, PADDED),
      ),
    ).toBe(
      [
        "|     | a   | b   |",
        "| --- | --- | --- |",
        "|     | c   | d   |",
      ].join("\n"),
    );
  });
});

describe("deleteRow", () => {
  it("removes the row holding the caret", () => {
    expect(
      run("|a|b|\n|-|-|\n|c^|d|", (doc, at) => deleteRow(doc, at, PADDED)),
    ).toBe(["| a   | b   |", "| --- | --- |"].join("\n"));
  });

  it("removes the whole table when only the header is left", () => {
    expect(
      run("before\n|a|\n|^-|\nafter", (doc, at) => deleteRow(doc, at, PADDED)),
    ).toBe("before\nafter");
  });
});

describe("deleteColumn", () => {
  it("removes the column holding the caret", () => {
    expect(
      run("|a|b|\n|-|-|\n|c^|d|", (doc, at) => deleteColumn(doc, at, PADDED)),
    ).toBe(["| b   |", "| --- |", "| d   |"].join("\n"));
  });

  it("empties the table rather than deleting it when one column is left", () => {
    expect(
      run("before\n|^a|\n|-|\n|b|\nafter", (doc, at) =>
        deleteColumn(doc, at, PADDED),
      ),
    ).toBe(["before", "|     |", "| --- |", "|     |", "after"].join("\n"));
  });
});

describe("moveRow", () => {
  const table = "|a|b|\n|-|-|\n|c|d|\n|e|f|";

  it("swaps with the row above", () => {
    expect(
      run("|a|b|\n|-|-|\n|c|d|\n|e^|f|", (doc, at) =>
        moveRow(doc, at, PADDED, -1),
      ),
    ).toBe(
      ["| a   | b   |", "| --- | --- |", "| e   | f   |", "| c   | d   |"].join(
        "\n",
      ),
    );
  });

  it("swaps the first body row with the header", () => {
    expect(
      run("|a|b|\n|-|-|\n|^c|d|\n|e|f|", (doc, at) =>
        moveRow(doc, at, PADDED, -1),
      ),
    ).toBe(
      ["| c   | d   |", "| --- | --- |", "| a   | b   |", "| e   | f   |"].join(
        "\n",
      ),
    );
  });

  it("swaps with the row below", () => {
    expect(
      run("|a|b|\n|-|-|\n|^c|d|\n|e|f|", (doc, at) =>
        moveRow(doc, at, PADDED, 1),
      ),
    ).toBe(
      ["| a   | b   |", "| --- | --- |", "| e   | f   |", "| c   | d   |"].join(
        "\n",
      ),
    );
  });

  it("does nothing at either end", () => {
    expect(applyChanges(table, moveRow(table, 1, PADDED, -1).changes)).toBe(
      table,
    );
    expect(applyChanges(table, moveRow(table, 22, PADDED, 1).changes)).toBe(
      table,
    );
  });
});

describe("moveColumn", () => {
  it("swaps with the column to the right", () => {
    expect(
      run("|^a|b|\n|-|-|\n|c|d|", (doc, at) => moveColumn(doc, at, PADDED, 1)),
    ).toBe(["| b   | a   |", "| --- | --- |", "| d   | c   |"].join("\n"));
  });
});

describe("alignColumn", () => {
  const table = "|a|b|\n|-|-|\n|c^|d|";

  it("writes each of the three alignments", () => {
    expect(run(table, (doc, at) => alignColumn(doc, at, PADDED, "left"))).toBe(
      ["| a   | b   |", "| :-- | --- |", "| c   | d   |"].join("\n"),
    );
    expect(
      run(table, (doc, at) => alignColumn(doc, at, PADDED, "center")),
    ).toBe(["| a   | b   |", "| :-: | --- |", "| c   | d   |"].join("\n"));
    expect(run(table, (doc, at) => alignColumn(doc, at, PADDED, "right"))).toBe(
      ["| a   | b   |", "| --: | --- |", "| c   | d   |"].join("\n"),
    );
  });
});

describe("sortRows", () => {
  const table = "|n|v|\n|-|-|\n|b|2|\n|^a|1|";

  it("sorts the body by the column holding the caret, header untouched", () => {
    expect(run(table, (doc, at) => sortRows(doc, at, PADDED, false))).toBe(
      ["| n   | v   |", "| --- | --- |", "| a   | 1   |", "| b   | 2   |"].join(
        "\n",
      ),
    );
    expect(run(table, (doc, at) => sortRows(doc, at, PADDED, true))).toBe(
      ["| n   | v   |", "| --- | --- |", "| b   | 2   |", "| a   | 1   |"].join(
        "\n",
      ),
    );
  });

  it("sorts numbers numerically, not lexically", () => {
    expect(
      run("|n|\n|-|\n|10|\n|^9|\n|1|", (doc, at) =>
        sortRows(doc, at, TIGHT, false),
      ),
    ).toBe(["| n |", "| --- |", "| 1 |", "| 9 |", "| 10 |"].join("\n"));
  });
});

describe("planTableEnter", () => {
  it("moves to the cell below", () => {
    const { doc, offset } = caret("|a|b|\n|^-|-|\n|c|d|");
    const plan = planTableEnter(doc, offset, PADDED);
    expect(applyChanges(doc, plan?.changes ?? [])).toBe(
      ["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"),
    );
    // Start of the "c" cell: line 3 of the rendered text, first character.
    expect(plan?.select).toEqual({ from: 30, to: 30 });
  });

  it("adds a row at the bottom and lands in it", () => {
    const { doc, offset } = caret("|a|b|\n|-|-|\n|^c|d|");
    const plan = planTableEnter(doc, offset, PADDED);
    expect(applyChanges(doc, plan?.changes ?? [])).toBe(
      ["| a   | b   |", "| --- | --- |", "| c   | d   |", "|     |     |"].join(
        "\n",
      ),
    );
    expect(plan?.select).toEqual({ from: 44, to: 44 });
  });

  it("returns null outside a table so the newline goes through", () => {
    expect(planTableEnter("plain^ text", 5, PADDED)).toBeNull();
  });
});

describe("tableFromClipboard", () => {
  it("builds a table from tab-separated values", () => {
    expect(tableFromClipboard("a\tb\nc\td", PADDED)).toBe(
      ["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"),
    );
  });

  it("keeps a comma inside a quoted CSV field in one cell", () => {
    expect(tableFromClipboard('"a,b",c\nd,e', PADDED)).toBe(
      ["| a,b | c   |", "| --- | --- |", "| d   | e   |"].join("\n"),
    );
  });

  it("turns a newline inside a quoted field into a line break", () => {
    expect(tableFromClipboard('"x\ny",b\nc,d', PADDED)).toBe(
      ["| x<br>y | b   |", "| ------ | --- |", "| c      | d   |"].join("\n"),
    );
  });

  it("escapes pipes, which would otherwise split a cell", () => {
    expect(tableFromClipboard("a|b\tc\nd\te", PADDED)).toBe(
      ["| a\\|b | c   |", "| ---- | --- |", "| d    | e   |"].join("\n"),
    );
  });

  it("drops the trailing empty row a spreadsheet always adds", () => {
    expect(tableFromClipboard("a\tb\nc\td\n\t", PADDED)).toBe(
      ["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"),
    );
  });

  it("refuses text that cannot be a table", () => {
    expect(tableFromClipboard("", PADDED)).toBeNull();
    expect(tableFromClipboard("   \n\n", PADDED)).toBeNull();
    expect(tableFromClipboard("a\tb", PADDED)).toBeNull();
    expect(tableFromClipboard("hello\nworld", PADDED)).toBeNull();
  });
});
