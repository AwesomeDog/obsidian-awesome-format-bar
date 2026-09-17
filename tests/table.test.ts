import { describe, expect, it } from "vitest";
import { applyChanges, type Plan } from "../src/editor-ops/plan";
import {
  alignColumn,
  deleteColumn,
  deleteRow,
  formatAllTables,
  formatTable,
  insertCellBreak,
  insertColumnLeft,
  isTableLine,
  insertColumnRight,
  insertRowAbove,
  insertRowBelow,
  moveColumn,
  planTableEnter,
  planTableTab,
  moveRow,
  removeDuplicateRows,
  renderTable,
  sortRows,
  tableToText,
  transposeTable,
  type TableFormat,
} from "../src/editor-ops/table";
import { delimitedFromTable, tableFromDelimited } from "../src/editor-ops/tsv";

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

/** `removeDuplicateRows` also reports how many rows it dropped. */
function dedupe(input: string): { text: string; removed: number | null } {
  const { doc, offset } = caret(input);
  const { plan, removed } = removeDuplicateRows(doc, offset, TIGHT);
  return { text: applyChanges(doc, plan.changes), removed };
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

  it("accepts a table without outer pipes", () => {
    expect(
      run("a | b\n--|--\nc^ | d", (doc, at) => formatTable(doc, at, PADDED)),
    ).toBe(["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"));
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

  it("ignores the size pipe of an embed below the table", () => {
    // `![[a.png|100]]` held a pipe, so the scan swallowed it as a body row.
    expect(
      run("|a|b|\n|-|-|\n|c^|d|\n![[a.png|100]]", (doc, at) =>
        formatTable(doc, at, PADDED),
      ),
    ).toBe(
      [
        "| a   | b   |",
        "| --- | --- |",
        "| c   | d   |",
        "![[a.png|100]]",
      ].join("\n"),
    );
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

describe("insertRowBelow", () => {
  it("inserts below the row holding the caret", () => {
    expect(
      run("|a|b|\n|-|-|\n|c^|d|\n|e|f|", (doc, at) =>
        insertRowBelow(doc, at, PADDED),
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

  it("appends after the last row", () => {
    expect(
      run("|a|b|\n|-|-|\n|c|d|\n|e^|f|", (doc, at) =>
        insertRowBelow(doc, at, PADDED),
      ),
    ).toBe(
      [
        "| a   | b   |",
        "| --- | --- |",
        "| c   | d   |",
        "| e   | f   |",
        "|     |     |",
      ].join("\n"),
    );
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

describe("insertColumnRight", () => {
  it("inserts to the right of the column holding the caret", () => {
    expect(
      run("|a^|b|\n|-|-|\n|c|d|", (doc, at) =>
        insertColumnRight(doc, at, PADDED),
      ),
    ).toBe(
      [
        "| a   |     | b   |",
        "| --- | --- | --- |",
        "| c   |     | d   |",
      ].join("\n"),
    );
  });

  it("appends after the last column", () => {
    expect(
      run("|a|b^|\n|-|-|\n|c|d|", (doc, at) =>
        insertColumnRight(doc, at, PADDED),
      ),
    ).toBe(
      [
        "| a   | b   |     |",
        "| --- | --- | --- |",
        "| c   | d   |     |",
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

  it("sorts Chinese by pinyin rather than by code point", () => {
    expect(
      run("|n|\n|-|\n|王五|\n|^阿明|\n|李四|", (doc, at) =>
        sortRows(doc, at, TIGHT, false),
      ),
    ).toBe(["| n |", "| --- |", "| 阿明 |", "| 李四 |", "| 王五 |"].join("\n"));
  });

  it("reads a money column as amounts, separator included", () => {
    expect(
      run("|v|\n|-|\n|¥900|\n|^¥1,200|\n|¥80|", (doc, at) =>
        sortRows(doc, at, TIGHT, false),
      ),
    ).toBe(
      ["| v |", "| --- |", "| ¥80 |", "| ¥900 |", "| ¥1,200 |"].join("\n"),
    );
  });

  it("reads decimals, signs and percentages as numbers", () => {
    expect(
      run("|v|\n|-|\n|1.5|\n|^1.10|\n|-2|\n|87%|", (doc, at) =>
        sortRows(doc, at, TIGHT, false),
      ),
    ).toBe(
      ["| v |", "| --- |", "| -2 |", "| 1.10 |", "| 1.5 |", "| 87% |"].join(
        "\n",
      ),
    );
  });

  it("treats the column as text once one cell is not a number", () => {
    // `1.5` before `1.10` is text order; read as numbers they would swap.
    expect(
      run("|v|\n|-|\n|1.5|\n|^1.10|\n|x|", (doc, at) =>
        sortRows(doc, at, TIGHT, false),
      ),
    ).toBe(["| v |", "| --- |", "| 1.5 |", "| 1.10 |", "| x |"].join("\n"));
  });
});

describe("removeDuplicateRows", () => {
  it("keeps the first row of a kind and drops later copies", () => {
    const { text, removed } = dedupe("|a|b|\n|-|-|\n|1|x|\n|^2|y|\n|1|x|");
    expect(text).toBe(
      ["| a | b |", "| --- | --- |", "| 1 | x |", "| 2 | y |"].join("\n"),
    );
    expect(removed).toBe(1);
  });

  it("drops copies anywhere in the body, not just adjacent ones", () => {
    const { text, removed } = dedupe("|a|\n|-|\n|^1|\n|2|\n|1|\n|2|\n|1|");
    expect(text).toBe(["| a |", "| --- |", "| 1 |", "| 2 |"].join("\n"));
    expect(removed).toBe(3);
  });

  it("reads a row as a whole: one cell apart and both stay", () => {
    // Nothing to drop, so the table is not even re-rendered.
    const { text, removed } = dedupe("|a|b|\n|-|-|\n|^1|x|\n|1|y|");
    expect(text).toBe("|a|b|\n|-|-|\n|1|x|\n|1|y|");
    expect(removed).toBe(0);
  });

  it("never counts the header as the first of a kind", () => {
    const { text, removed } = dedupe("|a|b|\n|-|-|\n|^a|b|\n|a|b|");
    expect(text).toBe(["| a | b |", "| --- | --- |", "| a | b |"].join("\n"));
    expect(removed).toBe(1);
  });

  it("changes nothing when no row repeats", () => {
    const { text, removed } = dedupe("|a|\n|-|\n|^1|\n|2|");
    expect(text).toBe("|a|\n|-|\n|1|\n|2|");
    expect(removed).toBe(0);
  });

  it("does nothing outside a table", () => {
    const { text, removed } = dedupe("plain prose\n^no table here");
    expect(text).toBe("plain prose\nno table here");
    expect(removed).toBeNull();
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

describe("planTableTab", () => {
  it("moves to the next cell and selects its content", () => {
    const { doc, offset } = caret("|a|b|\n|-|-|\n|c^|d|");
    const plan = planTableTab(doc, offset, PADDED, false);
    const next = applyChanges(doc, plan?.changes ?? []);
    expect(next).toBe(
      ["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"),
    );
    expect(plan?.select).toEqual({ from: 36, to: 37 });
  });

  it("moves backward across the first body cell", () => {
    const { doc, offset } = caret("|a^|b|\n|-|-|\n|c|d|");
    const plan = planTableTab(doc, offset, PADDED, true);
    expect(applyChanges(doc, plan?.changes ?? [])).toBe(
      ["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"),
    );
    expect(plan?.select).toEqual({ from: 2, to: 3 });
  });

  it("adds a column at the right edge", () => {
    const { doc, offset } = caret("|a|b^|\n|-|-|\n|c|d|");
    const plan = planTableTab(doc, offset, PADDED, false);
    expect(applyChanges(doc, plan?.changes ?? [])).toBe(
      [
        "| a   | b   |     |",
        "| --- | --- | --- |",
        "| c   | d   |     |",
      ].join("\n"),
    );
    expect(plan?.select).toEqual({ from: 14, to: 14 });
  });

  it("returns null outside a table", () => {
    expect(planTableTab("plain^ text", 5, PADDED, false)).toBeNull();
  });
});

describe("transposeTable", () => {
  it("transposes header and body while regenerating alignment", () => {
    expect(
      run("|A|B|\n|---|:--:|\n|1|2|\n|3^|4|", (doc, at) =>
        transposeTable(doc, at, PADDED),
      ),
    ).toBe(
      [
        "| A   | 1   | 3   |",
        "| --- | --- | --- |",
        "| B   | 2   | 4   |",
      ].join("\n"),
    );
  });

  it("pads short rows before transposing", () => {
    expect(
      run("|A|B|C|\n|-|-|-|\n|x^|y|", (doc, at) =>
        transposeTable(doc, at, TIGHT),
      ),
    ).toBe(["| A | x |", "| --- | --- |", "| B | y |", "| C |  |"].join("\n"));
  });

  it("transposes a header-only table", () => {
    expect(
      run("|A|B|C|\n|-|-|-|", (doc, at) => transposeTable(doc, at, PADDED)),
    ).toBe(["| A   |", "| --- |", "| B   |", "| C   |"].join("\n"));
  });

  it("keeps indentation and escaped pipes", () => {
    expect(
      run("- item\n  |A|B|\n  |-|:-:|\n  |x\\|y^|z|", (doc, at) =>
        transposeTable(doc, at, TIGHT),
      ),
    ).toBe(
      ["- item", "  | A | x\\|y |", "  | --- | --- |", "  | B | z |"].join(
        "\n",
      ),
    );
  });

  it("keeps the caret in the corresponding logical cell", () => {
    const { doc, offset } = caret("|A|B|\n|-|-|\n|1^|2|\n|3|4|");
    const plan = transposeTable(doc, offset, PADDED);
    const next = applyChanges(doc, plan.changes);
    expect(
      next.slice(plan.select?.from ?? 0, (plan.select?.from ?? 0) + 1),
    ).toBe("1");
  });

  it("does nothing outside a table or inside a fence", () => {
    const outside = transposeTable("plain^ text", 5, PADDED);
    expect(outside.changes).toHaveLength(0);
    const fenced = ["```", "|A|B|", "|-|-|", "|^1|2|", "```"].join("\n");
    expect(run(fenced, (doc, at) => transposeTable(doc, at, PADDED))).toBe(
      fenced.replace("^", ""),
    );
  });
});

describe("tableFromDelimited", () => {
  it("builds a table from tab-separated values", () => {
    expect(tableFromDelimited("a\tb\nc\td", PADDED)).toBe(
      ["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"),
    );
  });

  it("keeps comma-containing TSV as tab-separated", () => {
    expect(tableFromDelimited('a\tb\n"c,d"\te', PADDED)).toBe(
      ["| a   | b   |", "| --- | --- |", "| c,d | e   |"].join("\n"),
    );
  });

  it("keeps a comma inside a quoted CSV field in one cell", () => {
    expect(tableFromDelimited('"a,b",c\nd,e', PADDED)).toBe(
      ["| a,b | c   |", "| --- | --- |", "| d   | e   |"].join("\n"),
    );
  });

  it("turns a newline inside a quoted field into a line break", () => {
    expect(tableFromDelimited('"x\ny",b\nc,d', PADDED)).toBe(
      ["| x<br>y | b   |", "| ------ | --- |", "| c      | d   |"].join("\n"),
    );
  });

  it("escapes pipes, which would otherwise split a cell", () => {
    expect(tableFromDelimited("a|b\tc\nd\te", PADDED)).toBe(
      ["| a\\|b | c   |", "| ---- | --- |", "| d    | e   |"].join("\n"),
    );
  });

  it("drops the trailing empty row a spreadsheet always adds", () => {
    expect(tableFromDelimited("a\tb\nc\td\n\t", PADDED)).toBe(
      ["| a   | b   |", "| --- | --- |", "| c   | d   |"].join("\n"),
    );
  });

  it("refuses text that cannot be a table", () => {
    expect(tableFromDelimited("", PADDED)).toBeNull();
    expect(tableFromDelimited("   \n\n", PADDED)).toBeNull();
    expect(tableFromDelimited("a\tb", PADDED)).toBeNull();
    expect(tableFromDelimited("hello\nworld", PADDED)).toBeNull();
  });
});

describe("delimitedFromTable", () => {
  it("writes one comma-separated line per row", () => {
    expect(
      delimitedFromTable(
        [
          ["a", "b"],
          ["c", "d"],
        ],
        ",",
      ),
    ).toBe("a,b\nc,d");
  });

  it("quotes a cell holding a comma", () => {
    expect(delimitedFromTable([["a,b", "c"]], ",")).toBe('"a,b",c');
  });

  it("doubles a quote inside a quoted cell", () => {
    expect(delimitedFromTable([['say "hi"', "c"]], ",")).toBe('"say ""hi""",c');
  });

  it("quotes a cell that starts with a quote", () => {
    expect(delimitedFromTable([['"a"', "b"]], ",")).toBe('"""a""",b');
  });

  it("pads a short row out to the widest one", () => {
    expect(delimitedFromTable([["a", "b", "c"], ["1"]], ",")).toBe(
      "a,b,c\n1,,",
    );
  });

  it("leaves a comma alone when the delimiter is a tab", () => {
    expect(delimitedFromTable([["a,b", "c"]], "\t")).toBe("a,b\tc");
  });

  it("round-trips back through tableFromDelimited", () => {
    const rows = [
      ["a,b", "c"],
      ["d", "e"],
    ];
    expect(tableFromDelimited(delimitedFromTable(rows, ","), PADDED)).toBe(
      renderTable(rows, [], PADDED),
    );
  });
});

describe("tableToText", () => {
  it("writes one tab-separated line per row", () => {
    expect(
      run("| a | b |\n| - | - |\n| c^ | d |", (doc, at) =>
        tableToText(doc, at),
      ),
    ).toBe("a\tb\nc\td");
  });

  it("keeps an empty cell as an empty field", () => {
    expect(
      run("| a | b |\n| - | - |\n|^  | d |", (doc, at) => tableToText(doc, at)),
    ).toBe("a\tb\n\td");
  });

  it("unescapes a piped cell back into a pipe", () => {
    expect(
      run("| a\\|b | c |\n| ---- | - |\n| d^ | e |", (doc, at) =>
        tableToText(doc, at),
      ),
    ).toBe("a|b\tc\nd\te");
  });

  it("keeps a header-only table as one line", () => {
    expect(
      run("| a | b |\n| -^ | - |", (doc, at) => tableToText(doc, at)),
    ).toBe("a\tb");
  });

  it("does nothing outside a table", () => {
    const { doc, offset } = caret("plain ^text");
    expect(tableToText(doc, offset).changes.length).toBe(0);
  });

  it("round-trips back through tableFromDelimited", () => {
    const table = tableFromDelimited("a\tb\nc\td", PADDED) ?? "";
    expect(applyChanges(table, tableToText(table, 0).changes)).toBe(
      "a\tb\nc\td",
    );
  });
});

describe("insertCellBreak", () => {
  /** `[` … `]` is the selection, a bare `[` a caret. */
  function breakAt(input: string): string | null {
    const from = input.indexOf("[");
    const to = input.indexOf("]");
    const doc = input.replace("]", "").replace("[", "");
    const plan = insertCellBreak(doc, [{ from, to: to < 0 ? from : to - 1 }]);
    return plan && applyChanges(doc, plan.changes);
  }

  it("inserts a break where the caret is", () => {
    expect(breakAt("|a|b|\n|-|-|\n|one[|d|")).toBe("|a|b|\n|-|-|\n|one<br>|d|");
  });

  it("replaces the selection instead of breaking the row", () => {
    expect(breakAt("|a|b|\n|-|-|\n|o[ne]|d|")).toBe("|a|b|\n|-|-|\n|o<br>|d|");
  });

  it("leaves prose alone so the editor keeps its own Shift+Enter", () => {
    expect(breakAt("plain [prose")).toBeNull();
  });
});

describe("isTableLine", () => {
  it("rejects a line whose only pipe is an embed size", () => {
    expect(isTableLine("![[Pasted image.png|100]]")).toBe(false);
  });

  it("rejects a line whose only pipe is a link alias", () => {
    expect(isTableLine("[[Note|alias]]")).toBe(false);
    expect(isTableLine("![[Note#^abc|alias]]")).toBe(false);
  });

  it("accepts a row whose pipes sit outside the link", () => {
    expect(isTableLine("| a | ![[b.png|100]] |")).toBe(true);
    expect(isTableLine("| a | [[b|alias]] |")).toBe(true);
  });

  it("accepts a plain row", () => {
    expect(isTableLine("| a | b |")).toBe(true);
    expect(isTableLine("a | b")).toBe(true);
    expect(isTableLine("|-|-|")).toBe(true);
  });
});
