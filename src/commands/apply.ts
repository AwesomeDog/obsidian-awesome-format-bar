import type { Editor, EditorChange, EditorRangeOrCaret } from "obsidian";
import {
  applyChanges,
  offsetToPosition,
  type Plan,
  type Range,
} from "../editor-ops/plan";

export const ORIGIN = "awesome-format-bar";
export function selectionRanges(editor: Editor): Range[] {
  return editor.listSelections().map((selection) => {
    const anchor = editor.posToOffset(selection.anchor);
    const head = editor.posToOffset(selection.head);
    return { from: Math.min(anchor, head), to: Math.max(anchor, head) };
  });
}

export function hasSelection(editor: Editor): boolean {
  return selectionRanges(editor).some((range) => range.from !== range.to);
}

/** The single write path. Nothing else in the plugin mutates the document. */
export function commit(editor: Editor, plan: Plan): void {
  if (plan.changes.length === 0) return;

  const changes: EditorChange[] = plan.changes.map((change) => ({
    from: editor.offsetToPos(change.from),
    text: change.text,
    to: editor.offsetToPos(change.to),
  }));

  let selections: EditorRangeOrCaret[] | undefined;
  if (plan.select) {
    // `select` addresses the resulting document, not the current one.
    const next = applyChanges(editor.getValue(), plan.changes);
    selections = [
      {
        from: offsetToPosition(next, plan.select.from),
        to: offsetToPosition(next, plan.select.to),
      },
    ];
  }

  editor.transaction(
    selections ? { changes, selections } : { changes },
    ORIGIN,
  );
}
