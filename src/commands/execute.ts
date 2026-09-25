import { MarkdownView, Notice, type App, type Editor } from "obsidian";
import { t } from "../i18n/i18n";
import type { CommandSpec } from "../model/types";
import { isImageLine } from "../editor-ops/image";
import { isTableLine } from "../editor-ops/table";
import type { TableFormat } from "../editor-ops/table";
import { clearOwnedInlineHtml } from "../editor-ops/spans";
import { commit, hasSelection, ORIGIN, selectionRanges } from "./apply";
import {
  executeRegisteredCommand,
  registeredCommandAvailable,
} from "./registered";
import {
  planFor,
  runClipboard,
  toggleViewMode,
  type CommandContext,
} from "./dispatch";

/** The one place a CommandSpec becomes an effect. */
/** Resolved once per refresh, not once per button. */
interface RunConditions {
  readonly app: App;
  readonly hasEditor: boolean;
  readonly hasSelection: boolean;
  readonly inTable: boolean;
  readonly inImage: boolean;
}

export function runConditions(app: App, editor: Editor | null): RunConditions {
  return {
    app,
    hasEditor: editor !== null,
    hasSelection: editor !== null && hasSelection(editor),
    // One line, not the document: enough to grey buttons out.
    inTable:
      editor !== null && isTableLine(editor.getLine(editor.getCursor().line)),
    inImage:
      editor !== null && isImageLine(editor.getLine(editor.getCursor().line)),
  };
}

export function canRun(spec: CommandSpec, conditions: RunConditions): boolean {
  if (
    spec.registeredCommandId &&
    !registeredCommandAvailable(conditions.app, spec.registeredCommandId)
  )
    return false;
  if (spec.kind === "view") return true;
  if (!conditions.hasEditor) return false;
  if (spec.requiresSelection && !conditions.hasSelection) return false;
  if (spec.requiresTable && !conditions.inTable) return false;
  if (spec.requiresImage && !conditions.inImage) return false;
  return true;
}

/** Runs `spec`. Errors surface as one `Notice`; the document stays untouched. */
export async function executeSpec(
  spec: CommandSpec,
  context: CommandContext,
): Promise<void> {
  try {
    // A popup command with no choice yet is a no-op: the popup does the work.
    if (spec.popup && context.optionValue === undefined) return;

    if (spec.kind === "clipboard") {
      await runClipboard(context, spec.id);
      return;
    }
    if (spec.kind === "view") {
      toggleViewMode(context, spec.id);
      return;
    }
    if (spec.id === "undo") {
      context.editor.undo();
      return;
    }
    if (spec.id === "redo") {
      context.editor.redo();
      return;
    }
    if (spec.id === "increase-indent") {
      context.editor.exec("indentMore");
      return;
    }
    if (spec.id === "decrease-indent") {
      context.editor.exec("indentLess");
      return;
    }

    // Native clear-formatting does not remove the plugin's inline HTML.
    if (spec.id === "clear-formatting" && spec.registeredCommandId) {
      commit(
        context.editor,
        clearOwnedInlineHtml(
          context.editor.getValue(),
          selectionRanges(context.editor),
        ),
      );
      executeRegisteredCommand(context.app, spec.registeredCommandId);
      return;
    }

    // Forwarding wins: a local shadow would diverge from Obsidian's own behavior.
    if (spec.registeredCommandId) {
      executeRegisteredCommand(context.app, spec.registeredCommandId);
      return;
    }
    const plan = planFor(context, spec.id);
    if (plan) {
      commit(context.editor, plan);
      return;
    }
    throw new Error(`No implementation for command: ${spec.id}`);
  } catch (error) {
    console.error(`[${ORIGIN}] ${spec.id} failed`, error);
    new Notice(
      t("{name} failed. See the developer console for details.", {
        name: spec.name,
      }),
    );
  }
}

/** Context for the editor being edited right now, or `null` if there is none. */
export function resolveContext(
  app: App,
  format: TableFormat,
  optionValue?: string,
): CommandContext | null {
  const editor = focusedEditor(app);
  if (!editor) return null;
  return optionValue === undefined
    ? { app, editor, format }
    : { app, editor, format, optionValue };
}

/** The editor that has focus, or `null` when nothing editable does.
 *
 * `getActiveViewOfType` only ever sees notes, so it misses the embedded
 * editors inside Canvas cards and hover editors. `activeEditor` covers both,
 * and it is a MarkdownView exactly when a note itself has focus — which is
 * what keeps Reading view out: there the view is a MarkdownView whose mode is
 * not source. */
function focusedEditor(app: App): Editor | null {
  const owner = app.workspace.activeEditor;
  if (owner && !(owner instanceof MarkdownView)) return owner.editor ?? null;
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  return view?.getMode() === "source" ? view.editor : null;
}
