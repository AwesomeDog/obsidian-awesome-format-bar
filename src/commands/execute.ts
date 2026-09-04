import { MarkdownView, Notice, type App, type Editor } from "obsidian";
import type { CommandSpec } from "../model/types";
import { isTableLine } from "../editor-ops/table";
import type { TableFormat } from "../editor-ops/table";
import { commit, hasSelection, ORIGIN } from "./apply";
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

/** The one place a CommandSpec becomes an effect; one press is one undo step. */
/** Resolved once per refresh, not once per button. */
interface RunConditions {
  readonly app: App;
  readonly hasEditor: boolean;
  readonly hasSelection: boolean;
  readonly inTable: boolean;
}

export function runConditions(app: App, editor: Editor | null): RunConditions {
  return {
    app,
    hasEditor: editor !== null,
    hasSelection: editor !== null && hasSelection(editor),
    // One line, not the document: enough to grey buttons out.
    inTable:
      editor !== null && isTableLine(editor.getLine(editor.getCursor().line)),
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
    new Notice(`${spec.name} failed. See the developer console for details.`);
  }
}

/** Context for the view being edited right now, or `null` if there is none. */
export function resolveContext(
  app: App,
  format: TableFormat,
  optionValue?: string,
): CommandContext | null {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view || view.getMode() !== "source") return null;
  return optionValue === undefined
    ? { app, editor: view.editor, format, view }
    : { app, editor: view.editor, format, optionValue, view };
}
