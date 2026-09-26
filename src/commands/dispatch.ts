import {
  Notice,
  Platform,
  type App,
  type Editor,
  type MarkdownView,
} from "obsidian";
import { t } from "../i18n/i18n";
import {
  insertBlockReference,
  insertCallout,
  numberHeadings,
  sortHeadings,
  tableOfContents,
  toggleParagraphAlignment,
  type HeadingNumbering,
  type ParagraphAlignment,
} from "../editor-ops/blocks";
import { changeCase, type CaseMode } from "../editor-ops/case";
import {
  convertImageSyntax,
  insertImageAlt,
  insertImageCaption,
  resetImage,
  setAllImageSizes,
  setImageSize,
} from "../editor-ops/image";
import { toggleInlinePair } from "../editor-ops/inline";
import {
  duplicate,
  mergeLines,
  moveListItem,
  renumberList,
  reverseLines,
  sortLines,
  sortList,
  splitLines,
} from "../editor-ops/lists";
import { NO_CHANGE, type Plan } from "../editor-ops/plan";
import { applySpanStyle, type SpanProperty } from "../editor-ops/spans";
import {
  alignColumn,
  deleteColumn,
  deleteRow,
  deleteTable,
  formatAllTables,
  formatTable,
  insertColumnLeft,
  insertColumnRight,
  insertRowAbove,
  insertRowBelow,
  moveColumn,
  moveRow,
  removeDuplicateRows,
  renderTable,
  sortRows,
  tableAt,
  transposeTable,
  type MarkdownTable,
  type TableFormat,
} from "../editor-ops/table";
import {
  delimitedFromTable,
  jsonFromTable,
  tableFromDelimited,
  tableToText,
} from "../editor-ops/tsv";
import { deleteRanges, formatDateTime, insertText } from "../editor-ops/text";
import { cjkSpacing, cleanUp, smartPunctuation } from "../editor-ops/normalize";
import { CASE_OPTIONS } from "../model/palettes";
import { commit, selectionRanges } from "./apply";

/** Context for local commands; registered commands forward to Obsidian. */
export interface CommandContext {
  readonly app: App;
  /** Absent for an embedded editor: a Canvas card has no view of its own. */
  readonly view?: MarkdownView;
  readonly editor: Editor;
  readonly format: TableFormat;
  /** The popup choice: a color, a case mode, or an Emoji & Symbols entry. */
  readonly optionValue?: string;
}
const CASE_MODES = new Set<string>(CASE_OPTIONS.map((option) => option.mode));

function parseCaseMode(optionValue: string): CaseMode | null {
  return CASE_MODES.has(optionValue) ? (optionValue as CaseMode) : null;
}

const SPAN_PROPERTIES = new Set<string>([
  "color",
  "background",
  "font-size",
  "font-family",
]);

/** Span options arrive as `color:#e03131`, `font-size:1.5em`, `background:none`. */
function parseSpanOptionValue(
  optionValue: string,
): { property: SpanProperty; value: string | null } | null {
  const at = optionValue.indexOf(":");
  if (at < 0) return null;
  const name = optionValue.slice(0, at);
  const raw = optionValue.slice(at + 1);
  if (!SPAN_PROPERTIES.has(name)) return null;
  return { property: name as SpanProperty, value: raw === "none" ? null : raw };
}

/** Tracked so unload can leave fullscreen even if the user never toggles back. */
let fullscreenEl: HTMLElement | null = null;

/** Zen fullscreens the view itself, so Obsidian's layout survives untouched. */
function toggleFullscreen(context: CommandContext): void {
  const view = context.view;
  // Zen fullscreens a view; an embedded editor has none to fullscreen.
  if (!view) return;
  const { containerEl } = view;
  const doc = containerEl.ownerDocument;
  if (doc.fullscreenElement) {
    void doc.exitFullscreen();
    fullscreenEl = null;
    return;
  }
  // Absent on mobile WebViews, where there is no fullscreen to enter.
  if (typeof containerEl.requestFullscreen !== "function") return;
  void containerEl.requestFullscreen();
  fullscreenEl = containerEl;
}

/** What Focus Mode closed, so exit brings back only those two sides. */
let focusRestore: { left: boolean; right: boolean } | null = null;

/** Closes both sidebars through Obsidian's own split state */
function toggleFocusMode(app: App): void {
  const { leftSplit, rightSplit } = app.workspace;
  if (leftSplit.collapsed && rightSplit.collapsed) {
    // No memory after a reload while focused: bring both back, never no-op.
    const back = focusRestore ?? { left: true, right: true };
    if (back.left) leftSplit.expand();
    if (back.right) rightSplit.expand();
    focusRestore = null;
    return;
  }
  focusRestore = { left: !leftSplit.collapsed, right: !rightSplit.collapsed };
  leftSplit.collapse();
  rightSplit.collapse();
}

export function toggleViewMode(context: CommandContext, id: string): void {
  if (id === "zen-mode") toggleFullscreen(context);
  else if (id === "focus-mode") toggleFocusMode(context.app);
}

/** Unload hook: exiting fullscreen is the only way out of Zen once in it. */
export function exitFullscreen(): void {
  if (fullscreenEl?.ownerDocument.fullscreenElement)
    void fullscreenEl.ownerDocument.exitFullscreen();
  fullscreenEl = null;
}

interface WebContents {
  paste(): void;
  pasteAndMatchStyle(): void;
}

/** Native paste is the only path that converts `text/html`; false where unavailable. */
function nativePaste(plain: boolean): boolean {
  if (!Platform.isDesktopApp) return false;
  const remote = (
    window as Window & {
      electron?: { remote?: { getCurrentWebContents(): WebContents } };
    }
  ).electron?.remote;
  if (!remote) return false;

  const contents = remote.getCurrentWebContents();
  if (plain) contents.pasteAndMatchStyle();
  else contents.paste();
  return true;
}

/** The Copy as drop-down. Markdown re-renders through `renderTable`, so what
 * lands on the clipboard is a valid table even where the source was not.
 * `label` stays untranslated: it names a file format. */
const COPY_TABLE_AS: Readonly<
  Record<
    string,
    {
      readonly label: string;
      readonly write: (table: MarkdownTable, format: TableFormat) => string;
    }
  >
> = {
  "copy-table-as-tsv": {
    label: "TSV",
    write: (table) => delimitedFromTable(table.rows, "\t"),
  },
  "copy-table-as-csv": {
    label: "CSV",
    write: (table) => delimitedFromTable(table.rows, ","),
  },
  "copy-table-as-json": {
    label: "JSON",
    write: (table) => jsonFromTable(table.rows),
  },
  "copy-table-as-markdown": {
    label: "Markdown",
    write: (table, format) => renderTable(table.rows, table.align, format),
  },
};

export async function runClipboard(
  context: CommandContext,
  id: string,
): Promise<void> {
  const { editor } = context;

  if (id === "copy" || id === "cut") {
    const ranges = selectionRanges(editor);
    const doc = editor.getValue();
    const selected = ranges
      .filter((range) => range.from !== range.to)
      .map((range) => doc.slice(range.from, range.to))
      .join("\n");
    if (selected === "") return;
    await navigator.clipboard.writeText(selected);
    // Write first, delete second: a rejected clipboard must not lose text.
    if (id === "cut") commit(editor, deleteRanges(ranges));
    return;
  }

  if (id === "paste-as-table") {
    const text = await navigator.clipboard.readText();
    if (text === "") return;
    const table = tableFromDelimited(text, context.format);
    if (!table) {
      new Notice(
        t(
          "Clipboard is not a table. Copy two or more rows of tab- or comma-separated values first.",
        ),
      );
      return;
    }
    commit(
      editor,
      insertText(editor.getValue(), selectionRanges(editor), table),
    );
    return;
  }

  const copyAs = COPY_TABLE_AS[id];
  if (copyAs) {
    const found = tableAt(
      editor.getValue(),
      editor.posToOffset(editor.getCursor()),
    );
    if (!found) {
      new Notice(t("Put the cursor inside a table first."));
      return;
    }
    await navigator.clipboard.writeText(copyAs.write(found, context.format));
    // No row or column count: German and Russian inflect those on the number.
    new Notice(t("Table copied as {format}.", { format: copyAs.label }));
    return;
  }

  if (id === "paste-uri-as-link") {
    const uri = (await navigator.clipboard.readText()).trim();
    if (!/^[A-Za-z][A-Za-z0-9+.-]*:\S+$/u.test(uri)) {
      new Notice(t("Clipboard does not contain a valid URI."));
      return;
    }
    const doc = editor.getValue();
    const changes = selectionRanges(editor)
      .filter((range) => range.from !== range.to)
      .map((range) => ({
        from: range.from,
        to: range.to,
        text: /^\[[^\]]+\]\((?:<[^>]+>|[^)]+)\)$/u.test(
          doc.slice(range.from, range.to),
        )
          ? doc.slice(range.from, range.to)
          : `[${doc.slice(range.from, range.to)}](<${uri}>)`,
      }));
    commit(editor, { changes });
    return;
  }

  // Native paste first: it converts `text/html` and keeps list continuation.
  if (nativePaste(id === "paste-plain-text")) return;

  const text = await navigator.clipboard.readText();
  if (text === "") return;
  commit(editor, insertText(editor.getValue(), selectionRanges(editor), text));
}

/** Only pairs without a registered command ID; the rest forward to Obsidian. */
const INLINE_PAIRS: Readonly<Record<string, readonly [string, string]>> = {
  "inline-math": ["$", "$"],
  subscript: ["<sub>", "</sub>"],
  superscript: ["<sup>", "</sup>"],
  underline: ["<u>", "</u>"],
};

const PARAGRAPH_ALIGNMENTS: Readonly<Record<string, ParagraphAlignment>> = {
  "align-center": "center",
  "align-justify": "justify",
  "align-left": "left",
  "align-right": "right",
};

/** Obsidian's twelve callout types, one command each under the Callout button. */
const CALLOUT_TYPES: Readonly<Record<string, string>> = {
  "callout-note": "note",
  "callout-abstract": "abstract",
  "callout-info": "info",
  "callout-tip": "tip",
  "callout-success": "success",
  "callout-question": "question",
  "callout-warning": "warning",
  "callout-failure": "failure",
  "callout-danger": "danger",
  "callout-bug": "bug",
  "callout-example": "example",
  "callout-quote": "quote",
};

/** The widths Word offers; `null` clears the size back to the file's own. */
const IMAGE_WIDTHS: Readonly<Record<string, string | null>> = {
  "image-size-100": "100",
  "image-size-200": "200",
  "image-size-300": "300",
  "image-size-400": "400",
  "image-size-600": "600",
  "image-size-original": null,
};

/** The same widths, applied to every picture in the note. */
const ALL_IMAGE_WIDTHS: Readonly<Record<string, string | null>> = {
  "image-size-all-100": "100",
  "image-size-all-200": "200",
  "image-size-all-300": "300",
  "image-size-all-400": "400",
  "image-size-all-600": "600",
  "image-size-all-original": null,
};

/** Word's own multilevel schemes; `null` takes the numbers back off. */
const HEADING_NUMBERINGS: Readonly<Record<string, HeadingNumbering>> = {
  "number-headings-outline": "outline",
  "number-headings-multilevel": "multilevel",
  "number-headings-roman": "roman",
  "no-heading-numbering": null,
};

/** The local half of the command table; registered commands forward instead. */
export function planFor(context: CommandContext, id: string): Plan | null {
  const { editor, format, optionValue } = context;
  const doc = editor.getValue();
  const ranges = selectionRanges(editor);
  // Table ops read the caret: a selection spanning cells has no single meaning.
  // Aligning is the one that still wants the selection — see `alignColumn`.
  const caret = editor.posToOffset(editor.getCursor());

  const pair = INLINE_PAIRS[id];
  if (pair) return toggleInlinePair(doc, ranges, pair[0], pair[1]);

  const align = PARAGRAPH_ALIGNMENTS[id];
  if (align) return toggleParagraphAlignment(doc, ranges, align);

  const callout = CALLOUT_TYPES[id];
  if (callout) return insertCallout(doc, ranges, callout);

  const width = IMAGE_WIDTHS[id];
  if (width !== undefined) return setImageSize(doc, ranges, width);

  const allWidth = ALL_IMAGE_WIDTHS[id];
  if (allWidth !== undefined) return setAllImageSizes(doc, allWidth);

  const numbering = HEADING_NUMBERINGS[id];
  if (numbering !== undefined) return numberHeadings(doc, numbering);

  switch (id) {
    case "renumber-list":
      return renumberList(doc, ranges);
    case "sort-lines":
      return sortLines(doc, ranges);
    case "move-list-item-up":
      return moveListItem(doc, ranges, -1);
    case "move-list-item-down":
      return moveListItem(doc, ranges, 1);
    case "reverse-lines":
      return reverseLines(doc, ranges);
    case "sort-list":
      return sortList(doc, ranges);
    case "sort-headings":
      return sortHeadings(doc);
    case "merge-lines":
      return mergeLines(doc, ranges);
    case "split-lines":
      return splitLines(doc, ranges);
    case "duplicate":
      return duplicate(doc, ranges);
    case "smart-punctuation":
      return smartPunctuation(doc, ranges);
    case "cjk-spacing":
      return cjkSpacing(doc, ranges);
    case "clean-up-trailing-spaces":
      return cleanUp(doc, ranges, "trailing-spaces");
    case "clean-up-blank-lines":
      return cleanUp(doc, ranges, "blank-lines");
    case "clean-up-bare-urls":
      return cleanUp(doc, ranges, "bare-urls");
    case "clean-up-emphasis-strong":
      return cleanUp(doc, ranges, "emphasis-strong");
    case "clean-up-bullet-style":
      return cleanUp(doc, ranges, "bullet-style");
    case "block-reference":
      return insertBlockReference(
        doc,
        ranges,
        crypto.randomUUID().replace(/-/g, "").slice(0, 8),
      );
    case "date-time":
      return insertText(doc, ranges, formatDateTime(new Date()));
    case "image-caption":
      return insertImageCaption(doc, ranges, t("Caption"));
    case "image-alt":
      return insertImageAlt(doc, ranges, t("Alt Text"));
    case "image-reset":
      return resetImage(doc, ranges);
    case "image-convert-syntax":
      return convertImageSyntax(doc, ranges);
    case "toc": {
      const plan = tableOfContents(doc, ranges, t("Table of Contents"));
      if (plan.changes.length === 0)
        new Notice(t("This note has no headings to list."));
      return plan;
    }

    case "table-insert-rows-above":
      return insertRowAbove(doc, caret, format);
    case "table-insert-rows-below":
      return insertRowBelow(doc, caret, format);
    case "table-insert-columns-left":
      return insertColumnLeft(doc, caret, format);
    case "table-insert-columns-right":
      return insertColumnRight(doc, caret, format);
    case "table-delete-rows":
      return deleteRow(doc, caret, format);
    case "table-delete-columns":
      return deleteColumn(doc, caret, format);
    case "table-delete-table":
      return deleteTable(doc, caret);
    case "table-move-row-up":
      return moveRow(doc, caret, format, -1);
    case "table-move-row-down":
      return moveRow(doc, caret, format, 1);
    case "table-move-column-left":
      return moveColumn(doc, caret, format, -1);
    case "table-move-column-right":
      return moveColumn(doc, caret, format, 1);
    case "table-align-column-left":
      return alignColumn(doc, caret, format, "left", ranges);
    case "table-align-column-center":
      return alignColumn(doc, caret, format, "center", ranges);
    case "table-align-column-right":
      return alignColumn(doc, caret, format, "right", ranges);
    case "table-format-table":
      return formatTable(doc, caret, format);
    case "table-format-all-tables":
      return formatAllTables(doc, format);
    case "table-sort-az":
      return sortRows(doc, caret, format, false);
    case "table-sort-za":
      return sortRows(doc, caret, format, true);
    case "table-remove-duplicate-rows": {
      const { plan, removed } = removeDuplicateRows(doc, caret, format);
      if (removed === null)
        new Notice(t("Put the cursor inside a table first."));
      else if (removed === 0) new Notice(t("No duplicate rows found."));
      else
        new Notice(
          t("Removed duplicate rows: {count}", { count: String(removed) }),
        );
      return plan;
    }
    case "table-transpose":
      return transposeTable(doc, caret, format);
    case "table-convert-to-text":
      return tableToText(doc, caret);
    case "convert-text-to-table": {
      // One table needs one block of text, so extra cursors are ignored.
      const range = ranges[0];
      if (!range) return NO_CHANGE;
      const table = tableFromDelimited(doc.slice(range.from, range.to), format);
      if (!table) {
        new Notice(
          t("Select two or more rows of tab- or comma-separated values first."),
        );
        return NO_CHANGE;
      }
      return insertText(doc, [range], table);
    }
    case "emoji":
      return optionValue ? insertText(doc, ranges, optionValue) : NO_CHANGE;
    case "change-case": {
      const mode = optionValue ? parseCaseMode(optionValue) : null;
      return mode ? changeCase(doc, ranges, mode) : NO_CHANGE;
    }
    case "font-color":
    case "highlight-color":
    case "font-size":
    case "font-family": {
      const parsed = optionValue ? parseSpanOptionValue(optionValue) : null;
      return parsed
        ? applySpanStyle(doc, ranges, parsed.property, parsed.value)
        : NO_CHANGE;
    }
    default:
      return null;
  }
}
