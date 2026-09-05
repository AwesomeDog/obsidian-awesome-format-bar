import type { Extension } from "@codemirror/state";
import { MarkdownView, Platform, Plugin, addIcon, getLanguage } from "obsidian";
import { commit, hasSelection } from "./commands/apply";
import { exitFullscreen } from "./commands/dispatch";
import {
  canRun,
  executeSpec,
  resolveContext,
  runConditions,
} from "./commands/execute";
import {
  missingForwardedCommands,
  registeredCommandName,
} from "./commands/registered";
import { planTableEnter, type TableFormat } from "./editor-ops/table";
import { setLanguage } from "./i18n/i18n";
import { COMMANDS } from "./model/command-table";
import {
  DEFAULT_SETTINGS,
  enabledToolbarPositions,
  normalizeSettings,
} from "./model/preferences";
import { pinnedSpecs } from "./model/pinned";
import type {
  CommandSpec,
  PinnedCommand,
  Settings,
  ToolbarPosition,
} from "./model/types";
import { pickIcon, pickPinnedCommand } from "./pin";
import { sortTableOnHeaderClick } from "./reading-table";
import { FormatBarSettingTab } from "./settings";
import type { ToolbarHost, ToolbarState } from "./toolbar/host";
import { missingIcons } from "./toolbar/icons";
import { closeFloating } from "./toolbar/floating";
import { ViewToolbar } from "./toolbar/view";
import { SHOW_WHITESPACE } from "./whitespace";

const PLACEHOLDER_SVG =
  '<circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="8"/><path d="M50 32v24" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="68" r="4" fill="currentColor"/>';

/** On <body>: the Reading view sort arrow is drawn by CSS. */
const SORTABLE_CLASS = "awesome-format-bar-sortable";

const STROKE = 'fill="none" stroke="currentColor" stroke-width="8"';
const TABLE_BOX = `<rect ${STROKE} x="13" y="13" width="74" height="74" rx="8"/>`;

const TABLE_ROW_DELETE = [
  TABLE_BOX,
  `<path ${STROKE} d="M13 50H87" stroke-linecap="round"/>`,
  `<path ${STROKE} d="M30 68H70" stroke-linecap="round"/>`,
].join("");

const TABLE_COLUMN_DELETE = [
  TABLE_BOX,
  `<path ${STROKE} d="M50 13V87" stroke-linecap="round"/>`,
  `<path ${STROKE} d="M68 30V70" stroke-linecap="round"/>`,
].join("");

export default class AwesomeFormatBarPlugin extends Plugin {
  settings: Settings = structuredClone(DEFAULT_SETTINGS);

  private readonly toolbars = new Map<MarkdownView, ViewToolbar>();

  /** Pop-out windows bind their own; `window-close` drops theirs. */
  private readonly boundDocuments = new Set<Document>();

  /** Mutable on purpose: Obsidian re-reads this array on `updateOptions()`. */
  private readonly editorExtensions: Extension[] = [];

  override async onload(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
    // Normalized on load, so nothing downstream ever sees raw data.
    await this.saveData(this.settings);
    // Before anything reads a name: it renames the command table in place.
    setLanguage(getLanguage());
    addIcon("format-bar-placeholder", PLACEHOLDER_SVG);
    addIcon("table-row-delete", TABLE_ROW_DELETE);
    addIcon("table-column-delete", TABLE_COLUMN_DELETE);
    this.registerCommands();
    this.addSettingTab(new FormatBarSettingTab(this.app, this));
    this.applyWhitespace();
    this.registerEditorExtension(this.editorExtensions);

    const reload = (): void => {
      void this.refreshToolbars();
    };
    this.registerEvent(this.app.workspace.on("active-leaf-change", reload));
    this.registerEvent(this.app.workspace.on("layout-change", reload));
    this.registerEvent(this.app.workspace.on("file-open", reload));
    this.registerEvent(this.app.workspace.on("window-open", reload));
    this.registerEvent(
      this.app.workspace.on("editor-change", () => this.queueRefresh()),
    );
    this.registerEvent(
      this.app.workspace.on("window-close", (_leaf, win) =>
        this.boundDocuments.delete(win.document),
      ),
    );
    this.bindDocument(document);
    this.register(() => closeFloating());
    this.register(() => exitFullscreen());

    this.app.workspace.onLayoutReady(() => {
      this.reportStartupGaps();
      void this.refreshToolbars();
    });
  }

  override onunload(): void {
    for (const toolbar of this.toolbars.values()) toolbar.destroy();
    this.toolbars.clear();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    for (const doc of this.boundDocuments) this.markSortable(doc);
    await this.refreshToolbars();
  }

  /** The arrow is CSS, so the setting reaches it as a body class. */
  private markSortable(doc: Document): void {
    doc.body.toggleClass(SORTABLE_CLASS, this.settings.sortTableOnHeaderClick);
  }

  private applyWhitespace(): void {
    this.editorExtensions.length = 0;
    if (this.settings.showWhitespace)
      this.editorExtensions.push(SHOW_WHITESPACE);
  }

  refreshToolbars(): Promise<void> {
    return this.rebuild();
  }

  /** A deferred leaf has no view yet; activation picks it up. */
  private async rebuild(): Promise<void> {
    const active = this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
    if (active?.isDeferred) await active.loadIfDeferred();

    const views = new Set<MarkdownView>();
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.isDeferred) return;
      if (!(leaf.view instanceof MarkdownView)) return;
      // Bound in every mode: Reading view needs the header-click handler too.
      this.bindDocument(leaf.view.contentEl.ownerDocument);
      if (leaf.view.getMode() === "source") views.add(leaf.view);
    });

    for (const [view, toolbar] of this.toolbars) {
      if (views.has(view) && view.contentEl.isConnected) continue;
      toolbar.destroy();
      this.toolbars.delete(view);
    }
    for (const view of views) {
      const existing = this.toolbars.get(view);
      if (existing) existing.sync();
      else this.toolbars.set(view, new ViewToolbar(this.createHost(view)));
    }
  }

  private queueRefresh(): void {
    for (const toolbar of this.toolbars.values()) toolbar.queueRefresh();
  }

  /** Bound per document: pop-out windows fire their own events. */
  private bindDocument(doc: Document): void {
    if (this.boundDocuments.has(doc)) return;
    this.boundDocuments.add(doc);
    const refresh = (): void => this.queueRefresh();
    this.registerDomEvent(doc, "selectionchange", refresh);
    // Scroll does not bubble, so it needs the capture phase.
    doc.addEventListener("scroll", refresh, true);
    this.register(() => doc.removeEventListener("scroll", refresh, true));

    // Capture, ahead of CodeMirror: a handled Enter must not also insert a newline.
    const onKeyDown = (evt: KeyboardEvent): void => this.onTableEnter(evt);
    doc.addEventListener("keydown", onKeyDown, true);
    this.register(() => doc.removeEventListener("keydown", onKeyDown, true));

    const onClick = (evt: MouseEvent): void => {
      if (this.settings.sortTableOnHeaderClick) sortTableOnHeaderClick(evt);
    };
    this.registerDomEvent(doc, "click", onClick);
    this.markSortable(doc);

    const win = doc.defaultView;
    if (win) this.registerDomEvent(win, "resize", refresh);
  }

  /** Enter in a table moves to the cell below, as Live Preview does. */
  private onTableEnter(evt: KeyboardEvent): void {
    if (evt.key !== "Enter" || evt.isComposing) return;
    if (evt.shiftKey || evt.ctrlKey || evt.metaKey || evt.altKey) return;
    if (!this.settings.bindEnterToNextRow) return;

    const target = evt.target;
    if (!(target instanceof Element)) return;
    // Skips Obsidian's own table cell editor, which has its own Enter keymap.
    if (!target.closest(".cm-editor")) return;
    if (target.closest(".cm-table-widget")) return;

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || view.getMode() !== "source") return;
    const editor = view.editor;
    // A selection would be replaced; let Enter do that.
    if (hasSelection(editor)) return;

    const offset = editor.posToOffset(editor.getCursor());
    const plan = planTableEnter(editor.getValue(), offset, this.tableFormat());
    if (!plan) return;
    evt.preventDefault();
    commit(editor, plan);
  }

  private tableFormat(): TableFormat {
    return { padWidth: this.settings.padCellWidthWithSpaces };
  }

  private createHost(view: MarkdownView): ToolbarHost {
    const settings = (): Settings => this.settings;
    return {
      containerEl: view.contentEl,
      execute: (spec: CommandSpec, optionValue?: string): void => {
        void this.execute(spec, view, optionValue);
      },
      focusEditor: (): void => {
        if (view.getMode() === "source") view.editor.focus();
      },
      charUsage: (): Readonly<Record<string, number>> =>
        this.settings.charUsage,
      recordCharUsage: (char: string): void => {
        const usage = this.settings.charUsage;
        usage[char] = (usage[char] ?? 0) + 1;
        // No refresh: this runs on every character the panel inserts.
        void this.saveData(this.settings);
      },
      get positions(): readonly ToolbarPosition[] {
        return enabledToolbarPositions(settings(), Platform.isMobile);
      },
      pinnedSpecs: (): CommandSpec[] => this.pinnedSpecs(),
      state: (): ToolbarState => {
        // Conditions come from the owning view, not the active one.
        const editable = view.getMode() === "source";
        const conditions = runConditions(
          this.app,
          editable ? view.editor : null,
        );
        return {
          isEnabled: (spec: CommandSpec): boolean => canRun(spec, conditions),
        };
      },
    };
  }

  private registerCommands(): void {
    for (const spec of COMMANDS as readonly CommandSpec[]) {
      // A drop-down button is a container; alone in the palette it does nothing.
      if (spec.commandPalette === false) continue;
      const run = (): void => {
        void this.execute(spec);
      };
      // No `editorCallback`: in Reading view it would hide the way back out.
      this.addCommand(
        spec.kind === "view"
          ? { callback: run, id: spec.id, name: spec.name }
          : { editorCallback: run, id: spec.id, name: spec.name },
      );
    }
  }

  /** Extensions are read once per editor, so a toggle has to reconfigure them. */
  private async setShowWhitespace(show: boolean): Promise<void> {
    this.settings.showWhitespace = show;
    this.applyWhitespace();
    await this.saveData(this.settings);
    this.app.workspace.updateOptions();
  }

  /** Rebuilt per render, so a label follows the registry. */
  private pinnedSpecs(): CommandSpec[] {
    return pinnedSpecs(this.settings.pinned, (commandId) =>
      registeredCommandName(this.app, commandId),
    );
  }

  /** Settings is the only place a pin is created. */
  async pinCommand(): Promise<void> {
    const pinnedIds = new Set(
      this.settings.pinned.map((entry) => entry.commandId),
    );
    const picked = await pickPinnedCommand(this.app, pinnedIds);
    if (picked) await this.setPinned([...this.settings.pinned, picked]);
  }

  async pickPinnedIcon(index: number): Promise<void> {
    const entry = this.settings.pinned[index];
    if (!entry) return;
    const icon = await pickIcon(this.app, entry.name);
    if (icon === null) return;
    await this.setPinned(
      this.settings.pinned.map((candidate, at) =>
        at === index ? { ...candidate, icon } : candidate,
      ),
    );
  }

  async removePinnedAt(index: number): Promise<void> {
    await this.setPinned(
      this.settings.pinned.filter((_entry, at) => at !== index),
    );
  }

  async movePinned(from: number, to: number): Promise<void> {
    const next = [...this.settings.pinned];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    await this.setPinned(next);
  }

  /** The Ribbon builds its groups once, so saving is not enough. */
  private async setPinned(next: readonly PinnedCommand[]): Promise<void> {
    this.settings.pinned = next;
    await this.saveData(this.settings);
    for (const toolbar of this.toolbars.values()) toolbar.rerender();
  }

  /** Every button, popup choice and palette command funnels through here. */
  private async execute(
    spec: CommandSpec,
    view?: MarkdownView,
    optionValue?: string,
  ): Promise<void> {
    const format = this.tableFormat();
    // Its own state, not an editor write: no context to resolve.
    if (spec.id === "show-whitespace") {
      await this.setShowWhitespace(!this.settings.showWhitespace);
      return;
    }
    // View commands must run in Reading view without focusing the editor.
    if (spec.kind === "view") {
      const target =
        view ?? this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!target) return;
      await executeSpec(spec, {
        app: this.app,
        editor: target.editor,
        format,
        view: target,
      });
      this.queueRefresh();
      return;
    }
    const context =
      view && view.getMode() === "source"
        ? {
            app: this.app,
            editor: view.editor,
            format,
            view,
            ...(optionValue === undefined ? {} : { optionValue }),
          }
        : resolveContext(this.app, format, optionValue);
    if (!context) return;
    if (!canRun(spec, runConditions(this.app, context.editor))) return;

    context.editor.focus();
    await executeSpec(spec, context);
    this.queueRefresh();
  }

  /** One-shot diagnostics for bad icons or missing forwarded commands. */
  private reportStartupGaps(): void {
    const icons = missingIcons();
    if (icons.length)
      console.warn("[awesome-format-bar] missing icons:", icons.join(", "));
    const commands = missingForwardedCommands(this.app, COMMANDS);
    if (commands.length)
      console.warn(
        "[awesome-format-bar] missing forwarded commands:",
        commands.join(", "),
      );
  }
}
