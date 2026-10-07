import type { Extension } from "@codemirror/state";
import {
  MarkdownView,
  Notice,
  Platform,
  Plugin,
  addIcon,
  getLanguage,
  type Editor,
  type MarkdownFileInfo,
  type Menu,
} from "obsidian";
import { commit, hasSelection, selectionRanges } from "./commands/apply";
import { addCommandsToMenu } from "./editor-menu";
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
  registeredHotkey,
} from "./commands/registered";
import type { Range } from "./editor-ops/plan";
import {
  captureFormat,
  paintFormat,
  type InlineFormat,
} from "./editor-ops/painter";
import {
  insertCellBreak,
  planTableEnter,
  planTableTab,
  type TableFormat,
} from "./editor-ops/table";
import { setLanguage, t } from "./i18n/i18n";
import { COMMANDS, commandById } from "./model/command-table";
import {
  DEFAULT_SETTINGS,
  editorMenuEnabled,
  enabledToolbarPositions,
  normalizeSettings,
} from "./model/preferences";
import {
  flattenPinnedGroups,
  movePinnedGroup,
  movePinnedToGroup,
  movePinnedWithinGroup,
  pinnedGroups,
  pinnedSpecs,
  renamePinnedGroup,
} from "./model/pinned";
import type {
  CommandSpec,
  PinnedCommand,
  Settings,
  ToolbarPosition,
} from "./model/types";
import { openPinnedManager, pickIcon, pickPinnedCommand } from "./pin";
import { sortTableOnHeaderClick } from "./reading-table";
import { FormatBarSettingTab } from "./settings";
import type { ToolbarHost, ToolbarState } from "./toolbar/host";
import { missingIcons } from "./toolbar/icons";
import { closeFloating } from "./toolbar/floating";
import { ViewToolbar } from "./toolbar/view";
import {
  isTypewriterModeEnabled,
  toggleTypewriterMode,
  TYPEWRITER,
} from "./typewriter";
import { SHOW_WHITESPACE } from "./whitespace";

const PLACEHOLDER_SVG =
  '<circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="8"/><path d="M50 32v24" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="68" r="4" fill="currentColor"/>';

/** On <body>: the Reading view sort arrow is drawn by CSS. */
const SORTABLE_CLASS = "awesome-format-bar-sortable";

/** On <body>: the Format Painter is armed, so the editor shows a crosshair. */
const PAINTER_CLASS = "awesome-format-bar-painter";

/** Word latches its painter on a double click; this is that window. */
const DOUBLE_CLICK_MS = 400;

/** A keyboard selection ends on a keyup, so navigation keys paint too. */
const NAVIGATION_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
]);

/** Format Painter: the brush outlives the click that picked it up. */
interface Painter {
  /** Pure data, so it paints into another pane's note just as well. */
  readonly format: InlineFormat;
  /** Where it came from: painting the source again is a no-op. */
  source: string;
  /** Double click: the brush stays on until Esc. */
  continuous: boolean;
  readonly armedAt: number;
}

/** Identifies a set of selections, so a stray mouseup on them paints nothing. */
function keyOf(ranges: readonly Range[]): string {
  return ranges.map((range) => `${range.from}:${range.to}`).join(",");
}

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

  /** The armed Format Painter, or `null` when the brush is down. */
  private painter: Painter | null = null;

  /** Tear-down for the document listeners the brush paints through. */
  private painterOff: Array<() => void> = [];

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
    this.applyEditorExtensions();
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
      this.app.workspace.on("editor-menu", (menu, editor, info) =>
        this.addEditorMenu(menu, editor, info),
      ),
    );
    // Another note is another job: the brush does not follow you there.
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.disarmPainter()),
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
    // Before the toolbars go: `disarmPainter` refreshes them.
    this.disarmPainter();
    // The sort arrow is CSS on <body>, and every window we bound may wear it.
    for (const doc of this.boundDocuments) doc.body.removeClass(SORTABLE_CLASS);
    this.boundDocuments.clear();
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

  /** Read once per editor: a toggle reaches it through `updateOptions()`. */
  private applyEditorExtensions(): void {
    this.editorExtensions.length = 0;
    if (this.settings.showWhitespace)
      this.editorExtensions.push(SHOW_WHITESPACE);
    if (isTypewriterModeEnabled()) this.editorExtensions.push(TYPEWRITER);
  }

  refreshToolbars(): Promise<void> {
    return this.rebuild();
  }

  /** Typewriter parks a line, and Live Preview has none */
  private async enterSourceMode(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view?.getState()["source"] === true) return;
    await this.execute(commandById("toggle-live-preview-source"));
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

    // Capture before the editor so handled navigation does not run its default.
    const onKeyDown = (evt: KeyboardEvent): void => this.onTableKeydown(evt);
    doc.addEventListener("keydown", onKeyDown, true);
    this.register(() => doc.removeEventListener("keydown", onKeyDown, true));

    const onClick = (evt: MouseEvent): void => {
      if (this.settings.sortTableOnHeaderClick) sortTableOnHeaderClick(evt);
    };
    this.registerDomEvent(doc, "click", onClick);
    this.markSortable(doc);
    // A window opened mid-stroke: the brush has to paint there too.
    this.markPainter();
    if (this.painter) this.listenForPaint();

    const win = doc.defaultView;
    if (win) this.registerDomEvent(win, "resize", refresh);
  }

  /** Table navigation runs before the editor's normal Enter and Tab behavior. */
  private onTableKeydown(evt: KeyboardEvent): void {
    if (evt.isComposing) return;
    const isEnter = evt.key === "Enter";
    const isTab = evt.key === "Tab";
    if (!isEnter && !isTab) return;
    if (evt.ctrlKey || evt.metaKey || evt.altKey) return;
    if (!this.settings.tableKeyNavigation) return;

    const target = evt.target;
    if (!(target instanceof Element)) return;
    // Skips Obsidian's own table cell editor, which has its own Enter keymap.
    if (!target.closest(".cm-editor")) return;
    if (target.closest(".cm-table-widget")) return;

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || view.getMode() !== "source") return;
    const editor = view.editor;
    // A selection would be replaced; let Enter do that. Shift+Enter replaces
    // it with the break instead, or the default newline would break the row.
    if (isEnter && !evt.shiftKey && hasSelection(editor)) return;

    const doc = editor.getValue();
    const offset = editor.posToOffset(editor.getCursor());
    const plan = isEnter
      ? evt.shiftKey
        ? insertCellBreak(doc, selectionRanges(editor))
        : planTableEnter(doc, offset, this.tableFormat())
      : planTableTab(doc, offset, this.tableFormat(), evt.shiftKey);
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
      hotkeyFor: (spec: CommandSpec): string => {
        // Touch devices have no keys to press.
        if (!Platform.isDesktopApp) return "";
        // Forwarded buttons run the core command, so that is the key to show.
        if (spec.registeredCommandId)
          return registeredHotkey(this.app, spec.registeredCommandId);
        // A drop-down container is not a palette command: it cannot be bound.
        if (spec.commandPalette === false) return "";
        return registeredHotkey(this.app, `${this.manifest.id}:${spec.id}`);
      },
      get positions(): readonly ToolbarPosition[] {
        return enabledToolbarPositions(settings(), Platform.isMobile);
      },
      pinnedSpecs: (): CommandSpec[] => this.pinnedSpecs(),
      pinnedCommands: (): readonly PinnedCommand[] => this.settings.pinned,
      editPinned: (): void => this.openPinnedManager(),
      state: (): ToolbarState => {
        // Conditions come from the owning view, not the active one.
        const editable = view.getMode() === "source";
        const conditions = runConditions(
          this.app,
          editable ? view.editor : null,
        );
        return {
          inTable: conditions.inTable,
          isEnabled: (spec: CommandSpec): boolean => canRun(spec, conditions),
          // Plugin-wide: every bar shows a lit brush, and a lit pilcrow while
          // whitespace is on. Neither is a state of the view it belongs to.
          isLatched: (spec: CommandSpec): boolean =>
            (spec.id === "format-painter" && this.painter !== null) ||
            (spec.id === "show-whitespace" && this.settings.showWhitespace),
        };
      },
    };
  }

  /** Right-click in the editor: the whole command table, in Obsidian's menu. */
  private addEditorMenu(
    menu: Menu,
    editor: Editor,
    info: MarkdownView | MarkdownFileInfo,
  ): void {
    if (!editorMenuEnabled(this.settings, Platform.isMobile)) return;
    // A Canvas card or a hover editor is editable too; a note in Reading view
    // is not, and there the menu is the only thing that would answer.
    const view = info instanceof MarkdownView ? info : undefined;
    const editable = !view || view.getMode() === "source";
    addCommandsToMenu(menu, {
      app: this.app,
      editor: editable ? editor : null,
      execute: (spec, optionValue): void => {
        void this.execute(spec, view, optionValue);
      },
      pinned: this.settings.pinned,
      title: this.manifest.name,
    });
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

  private async setShowWhitespace(show: boolean): Promise<void> {
    this.settings.showWhitespace = show;
    this.applyEditorExtensions();
    await this.saveData(this.settings);
    this.app.workspace.updateOptions();
    // The button latches, so every bar has to hear about it.
    this.queueRefresh();
  }

  /** Rebuilt per render, so a label follows the registry. */
  private pinnedSpecs(): CommandSpec[] {
    return pinnedSpecs(this.settings.pinned, (commandId) =>
      registeredCommandName(this.app, commandId),
    );
  }

  /** The manager and the Settings fallback share the same picker. */
  async pinCommand(): Promise<void> {
    const pinnedIds = new Set(
      this.settings.pinned.map((entry) => entry.commandId),
    );
    const picked = await pickPinnedCommand(this.app, pinnedIds);
    if (picked) await this.setPinned([...this.settings.pinned, picked]);
  }

  async pickPinnedIcon(commandId: string): Promise<void> {
    const index = this.settings.pinned.findIndex(
      (entry) => entry.commandId === commandId,
    );
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

  async removePinned(commandId: string): Promise<void> {
    await this.setPinned(
      this.settings.pinned.filter((entry) => entry.commandId !== commandId),
    );
  }

  async movePinnedToGroup(commandId: string, group: string): Promise<void> {
    await this.setPinned(
      movePinnedToGroup(this.settings.pinned, commandId, group),
    );
  }

  async renamePinnedGroup(from: string, to: string): Promise<void> {
    await this.setPinned(renamePinnedGroup(this.settings.pinned, from, to));
  }

  async movePinnedGroup(from: number, to: number): Promise<void> {
    await this.setPinned(movePinnedGroup(this.settings.pinned, from, to));
  }

  async movePinnedCommand(
    group: string,
    from: number,
    to: number,
  ): Promise<void> {
    await this.setPinned(
      movePinnedWithinGroup(this.settings.pinned, group, from, to),
    );
  }

  openPinnedManager(): void {
    const modal = openPinnedManager(this.app, {
      entries: (): readonly PinnedCommand[] => this.settings.pinned,
      add: (): Promise<void> => this.pinCommand(),
      changeIcon: (commandId): Promise<void> => this.pickPinnedIcon(commandId),
      remove: (commandId): Promise<void> => this.removePinned(commandId),
      moveToGroup: (commandId, group): Promise<void> =>
        this.movePinnedToGroup(commandId, group),
      renameGroup: (from, to): Promise<void> =>
        this.renamePinnedGroup(from, to),
      moveGroup: (from, to): Promise<void> => this.movePinnedGroup(from, to),
      moveCommand: (group, from, to): Promise<void> =>
        this.movePinnedCommand(group, from, to),
    });
    this.register(() => modal.close());
  }

  /** The Ribbon builds its groups once, so saving is not enough. */
  private async setPinned(next: readonly PinnedCommand[]): Promise<void> {
    this.settings.pinned = flattenPinnedGroups(pinnedGroups(next));
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
    // Same shape as Show Whitespace: state lives in the module, here to reconfigure.
    if (spec.id === "typewriter-mode") {
      toggleTypewriterMode();
      // Only on the way in: leaving should not yank the view back.
      if (isTypewriterModeEnabled()) await this.enterSourceMode();
      this.applyEditorExtensions();
      this.app.workspace.updateOptions();
      this.queueRefresh();
      return;
    }
    // Word's painter is one button with two roles, so it carries its own state.
    if (spec.id === "format-painter") {
      this.runPainter(view);
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

  // ---- Format Painter ---------------------------------------------------

  /** One command, two roles: it picks the format up, then puts it down. */
  private runPainter(view?: MarkdownView): void {
    // Needs a mouse to paint with: the button is greyed out off the desktop.
    if (!Platform.isDesktopApp) return;
    const target = view ?? this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = target?.getMode() === "source" ? target.editor : null;
    const ranges = editor ? selectionRanges(editor) : [];
    const key = keyOf(ranges);
    const selected = ranges.some((range) => range.from !== range.to);
    const painter = this.painter;

    if (!painter) {
      if (!editor || !selected) {
        new Notice(t("Select the text whose formatting you want to copy."));
        return;
      }
      this.armPainter(editor, ranges);
      return;
    }

    // A second press on the source inside the double-click window: keep on.
    if (
      selected &&
      key === painter.source &&
      !painter.continuous &&
      Date.now() - painter.armedAt <= DOUBLE_CLICK_MS
    ) {
      painter.continuous = true;
      new Notice(t("Format painter stays on. Press Esc when you are done."));
      this.queueRefresh();
      return;
    }

    if (editor && selected && key !== painter.source)
      this.paint(editor, ranges, painter);
    if (painter.continuous && selected) return;
    this.disarmPainter();
  }

  /** Arms the brush with whatever the selection at `range.from` is wearing. */
  private armPainter(editor: Editor, ranges: readonly Range[]): void {
    const source = ranges.find((range) => range.from !== range.to);
    if (!source) return;
    this.painter = {
      format: captureFormat(editor.getValue(), source),
      source: keyOf(ranges),
      continuous: false,
      armedAt: Date.now(),
    };
    this.listenForPaint();
    this.markPainter();
    // The next selection is the target, and it has to be made in the editor.
    editor.focus();
    this.queueRefresh();
  }

  private disarmPainter(): void {
    if (!this.painter) return;
    this.painter = null;
    this.stopListeningForPaint();
    this.markPainter();
    this.queueRefresh();
  }

  /** The crosshair is CSS, so the flag has to reach every window's body. */
  private markPainter(): void {
    const armed = this.painter !== null;
    for (const doc of this.boundDocuments)
      doc.body.toggleClass(PAINTER_CLASS, armed);
  }

  /** One transaction: a multi-cursor paint is still a single undo. */
  private paint(
    editor: Editor,
    ranges: readonly Range[],
    painter: Painter,
  ): void {
    commit(editor, paintFormat(editor.getValue(), ranges, painter.format));
    // Selections survive the write; remembering them keeps a stray mouseup idle.
    painter.source = keyOf(selectionRanges(editor));
  }

  /** Word paints when the drag ends; a keyboard selection ends on a keyup. */
  private paintSelection(): void {
    const painter = this.painter;
    if (!painter) return;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || view.getMode() !== "source") return;
    const editor = view.editor;
    const ranges = selectionRanges(editor);
    // The mouseup ending the source drag lands on the source selection.
    if (keyOf(ranges) === painter.source) return;
    if (!ranges.some((range) => range.from !== range.to)) return;
    this.paint(editor, ranges, painter);
    if (!painter.continuous) this.disarmPainter();
  }

  /** Bound per document: the mouseup that paints may come from any window. */
  private listenForPaint(): void {
    this.stopListeningForPaint();
    const onMouseUp = (): void => this.paintSelection();
    const onKeyUp = (evt: KeyboardEvent): void => {
      if (NAVIGATION_KEYS.has(evt.key)) this.paintSelection();
    };
    const onKeyDown = (evt: KeyboardEvent): void => {
      if (evt.key === "Escape") this.disarmPainter();
    };
    for (const doc of this.boundDocuments) {
      doc.addEventListener("mouseup", onMouseUp);
      doc.addEventListener("keyup", onKeyUp);
      // Capture: Esc is ours before the editor gets a look at it.
      doc.addEventListener("keydown", onKeyDown, true);
      this.painterOff.push(() => {
        doc.removeEventListener("mouseup", onMouseUp);
        doc.removeEventListener("keyup", onKeyUp);
        doc.removeEventListener("keydown", onKeyDown, true);
      });
    }
  }

  private stopListeningForPaint(): void {
    for (const off of this.painterOff) off();
    this.painterOff = [];
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
