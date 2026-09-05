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
  insertHorizontalRule,
  sortHeadings,
  toggleParagraphAlignment,
  type ParagraphAlignment,
} from "../editor-ops/blocks";
import { changeCase, type CaseMode } from "../editor-ops/case";
import { toggleInlinePair } from "../editor-ops/inline";
import {
  mergeLines,
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
  formatAllTables,
  formatTable,
  insertColumnLeft,
  insertRowAbove,
  moveColumn,
  moveRow,
  sortRows,
  type TableFormat,
} from "../editor-ops/table";
import { tableFromClipboard } from "../editor-ops/tsv";
import { deleteRanges, formatDateTime, insertText } from "../editor-ops/text";
import { CASE_OPTIONS } from "../model/palettes";
import { commit, selectionRanges } from "./apply";

/** Context for local commands; registered commands forward to Obsidian. */
export interface CommandContext {
  readonly app: App;
  readonly view: MarkdownView;
  readonly editor: Editor;
  readonly format: TableFormat;
  /** The popup choice: a color, a case mode, or an Emoji & Symbols entry. */
  readonly optionValue?: string;
}
const CASE_MODES = new Set<string>(CASE_OPTIONS.map((option) => option.mode));

function parseCaseMode(optionValue: string): CaseMode | null {
  return CASE_MODES.has(optionValue) ? (optionValue as CaseMode) : null;
}

/** Color options arrive as `color:#e03131` or `background:none`. */
function parseColorOptionValue(
  optionValue: string,
): { property: SpanProperty; value: string | null } | null {
  const at = optionValue.indexOf(":");
  if (at < 0) return null;
  const name = optionValue.slice(0, at);
  const raw = optionValue.slice(at + 1);
  if (name !== "color" && name !== "background") return null;
  return { property: name, value: raw === "none" ? null : raw };
}

/** Tracked so unload can leave fullscreen even if the user never toggles back. */
let fullscreenEl: HTMLElement | null = null;

/** Zen fullscreens the view itself, so Obsidian's layout survives untouched. */
function toggleFullscreen(context: CommandContext): void {
  const { containerEl } = context.view;
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
export function toggleFocusMode(app: App): void {
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
    const table = tableFromClipboard(text, context.format);
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

/** The local half of the command table; registered commands forward instead. */
export function planFor(context: CommandContext, id: string): Plan | null {
  const { editor, format, optionValue } = context;
  const doc = editor.getValue();
  const ranges = selectionRanges(editor);
  // Table ops read the caret: a selection spanning cells has no single meaning.
  const caret = editor.posToOffset(editor.getCursor());

  const pair = INLINE_PAIRS[id];
  if (pair) return toggleInlinePair(doc, ranges, pair[0], pair[1]);

  const align = PARAGRAPH_ALIGNMENTS[id];
  if (align) return toggleParagraphAlignment(doc, ranges, align);

  switch (id) {
    case "renumber-list":
      return renumberList(doc, ranges);
    case "sort-lines":
      return sortLines(doc, ranges);
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
    case "horizontal-rule":
      return insertHorizontalRule(doc, ranges);
    case "callout":
      return insertCallout(doc, ranges);
    case "block-reference":
      return insertBlockReference(
        doc,
        ranges,
        crypto.randomUUID().replace(/-/g, "").slice(0, 8),
      );
    case "date-time":
      return insertText(doc, ranges, formatDateTime(new Date()));

    case "table-insert-rows-above":
      return insertRowAbove(doc, caret, format);
    case "table-insert-columns-left":
      return insertColumnLeft(doc, caret, format);
    case "table-delete-rows":
      return deleteRow(doc, caret, format);
    case "table-delete-columns":
      return deleteColumn(doc, caret, format);
    case "table-move-row-up":
      return moveRow(doc, caret, format, -1);
    case "table-move-row-down":
      return moveRow(doc, caret, format, 1);
    case "table-move-column-left":
      return moveColumn(doc, caret, format, -1);
    case "table-move-column-right":
      return moveColumn(doc, caret, format, 1);
    case "table-align-column-left":
      return alignColumn(doc, caret, format, "left");
    case "table-align-column-center":
      return alignColumn(doc, caret, format, "center");
    case "table-align-column-right":
      return alignColumn(doc, caret, format, "right");
    case "table-format-table":
      return formatTable(doc, caret, format);
    case "table-format-all-tables":
      return formatAllTables(doc, format);
    case "table-sort-az":
      return sortRows(doc, caret, format, false);
    case "table-sort-za":
      return sortRows(doc, caret, format, true);
    case "emoji":
      return optionValue ? insertText(doc, ranges, optionValue) : NO_CHANGE;
    case "change-case": {
      const mode = optionValue ? parseCaseMode(optionValue) : null;
      return mode ? changeCase(doc, ranges, mode) : NO_CHANGE;
    }
    case "font-color":
    case "highlight-color": {
      const parsed = optionValue ? parseColorOptionValue(optionValue) : null;
      return parsed
        ? applySpanStyle(doc, ranges, parsed.property, parsed.value)
        : NO_CHANGE;
    }
    default:
      return null;
  }
}
