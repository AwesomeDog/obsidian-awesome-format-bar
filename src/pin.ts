import {
  FuzzySuggestModal,
  Modal,
  setIcon,
  setTooltip,
  type App,
  type Command,
  type FuzzyMatch,
} from "obsidian";
import { registeredCommands } from "./commands/registered";
import { t } from "./i18n/i18n";
import {
  DEFAULT_PIN_GROUP,
  DEFAULT_PIN_ICON,
  pinnedGroups,
} from "./model/pinned";
import type { PinnedCommand } from "./model/types";
import { allIconNames, resolveIcon } from "./toolbar/icons";

/** Pick a command, then an icon; both are `FuzzySuggestModal`. */

/** An empty note gets no element, or every row grows a line. */
function renderRow(
  el: HTMLElement,
  title: string,
  note: string,
  icon?: string,
): void {
  el.addClass("mod-complex");
  el.createDiv({ cls: "suggestion-content" }, (content) => {
    content.createDiv({ cls: "suggestion-title", text: title });
    if (note) content.createDiv({ cls: "suggestion-note", text: note });
  });
  if (icon) setIcon(el.createDiv({ cls: "suggestion-aux" }), icon);
}

abstract class Picker<T> extends FuzzySuggestModal<T> {
  private chosen = false;

  protected constructor(
    app: App,
    placeholder: string,
    private readonly onDismiss: () => void,
  ) {
    super(app);
    this.setPlaceholder(placeholder);
  }

  /** The only hook that runs before both a choice and a dismissal. */
  override selectSuggestion(
    value: FuzzyMatch<T>,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    this.chosen = true;
    super.selectSuggestion(value, evt);
  }

  /** Only a modal that closes without a choice ends the flow. */
  override onClose(): void {
    if (!this.chosen) this.onDismiss();
  }
}

class CommandPicker extends Picker<Command> {
  private readonly pinned: ReadonlySet<string>;
  private readonly onPick: (command: Command) => void;

  constructor(
    app: App,
    pinned: ReadonlySet<string>,
    onPick: (command: Command) => void,
    onDismiss: () => void,
  ) {
    super(app, t("Search commands to pin"), onDismiss);
    this.pinned = pinned;
    this.onPick = onPick;
  }

  override getItems(): Command[] {
    return registeredCommands(this.app).filter(
      (command) => !this.pinned.has(command.id),
    );
  }

  override getItemText(command: Command): string {
    // The id is haystack on purpose: people search "templater", not "insert".
    return `${command.name} ${command.id}`;
  }

  override renderSuggestion(match: FuzzyMatch<Command>, el: HTMLElement): void {
    renderRow(el, match.item.name, match.item.id, match.item.icon);
  }

  override onChooseItem(command: Command): void {
    this.onPick(command);
  }
}

class IconPicker extends Picker<string> {
  private readonly onPick: (icon: string) => void;

  constructor(
    app: App,
    commandName: string,
    onPick: (icon: string) => void,
    onDismiss: () => void,
  ) {
    super(app, t("Icon for {name}", { name: commandName }), onDismiss);
    this.onPick = onPick;
  }

  override getItems(): string[] {
    return allIconNames();
  }

  override getItemText(icon: string): string {
    return icon;
  }

  override renderSuggestion(match: FuzzyMatch<string>, el: HTMLElement): void {
    renderRow(el, match.item, "", match.item);
  }

  override onChooseItem(icon: string): void {
    this.onPick(icon);
  }
}

/** Resolves with the finished entry, or `null` when the user backs out. */
export function pickPinnedCommand(
  app: App,
  pinnedIds: ReadonlySet<string>,
): Promise<PinnedCommand | null> {
  return new Promise((resolve) => {
    const cancel = (): void => {
      resolve(null);
    };
    new CommandPicker(
      app,
      pinnedIds,
      (command) => {
        const finish = (icon: string): void => {
          resolve({ commandId: command.id, icon, name: command.name });
        };
        // Backing out keeps the pin: the icon has a default.
        new IconPicker(app, command.name, finish, () => {
          finish(DEFAULT_PIN_ICON);
        }).open();
      },
      cancel,
    ).open();
  });
}

/** Resolves with the new icon, or `null` when the user backs out. */
export function pickIcon(
  app: App,
  commandName: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    new IconPicker(
      app,
      commandName,
      (icon) => {
        resolve(icon);
      },
      () => {
        resolve(null);
      },
    ).open();
  });
}

export interface PinnedManagerActions {
  entries(): readonly PinnedCommand[];
  add(): Promise<void>;
  changeIcon(commandId: string): Promise<void>;
  remove(commandId: string): Promise<void>;
  moveToGroup(commandId: string, group: string): Promise<void>;
  renameGroup(from: string, to: string): Promise<void>;
  moveGroup(from: number, to: number): Promise<void>;
  moveCommand(group: string, from: number, to: number): Promise<void>;
}

class TextModal extends Modal {
  private chosen = false;

  constructor(
    app: App,
    private readonly heading: string,
    private readonly initial: string,
    private readonly finish: (value: string | null) => void,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle(this.heading);
    const form = this.contentEl.createEl("form");
    const input = form.createEl("input", {
      attr: { autofocus: "true", type: "text" },
    });
    input.value = this.initial;
    const buttons = form.createDiv({ cls: "modal-button-container" });
    buttons.createEl("button", { attr: { type: "button" }, text: t("Cancel") });
    buttons.createEl("button", {
      attr: { type: "submit" },
      cls: "mod-cta",
      text: t("Done"),
    });
    buttons.firstElementChild?.addEventListener("click", () => this.close());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      this.chosen = true;
      this.close();
      this.finish(value);
    });
    window.setTimeout(() => input.focus(), 0);
  }

  override onClose(): void {
    if (!this.chosen) this.finish(null);
  }
}

function askText(
  app: App,
  heading: string,
  initial: string,
): Promise<string | null> {
  return new Promise((resolve) =>
    new TextModal(app, heading, initial, resolve).open(),
  );
}

const NEW_GROUP = "__new-group__";

function pinnedGroupLabel(name: string): string {
  return name === DEFAULT_PIN_GROUP ? t("General") : name;
}

class PinnedManagerModal extends Modal {
  private dragging:
    | { kind: "group"; index: number }
    | { kind: "command"; group: string; index: number }
    | null = null;

  constructor(
    app: App,
    private readonly actions: PinnedManagerActions,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle(t("Manage Pinned"));
    this.modalEl.addClass("awesome-format-bar-pinned-modal");
    this.contentEl.addClass("awesome-format-bar-pinned-manager");
    this.render();
  }

  private render(): void {
    this.contentEl.empty();
    const toolbar = this.contentEl.createDiv({ cls: "pinned-manager-toolbar" });
    toolbar
      .createEl("button", {
        attr: { type: "button" },
        cls: "mod-cta",
        text: t("Pin a command"),
      })
      .addEventListener("click", () => {
        void this.actions.add().then(() => this.render());
      });
    const done = toolbar.createEl("button", {
      attr: { "aria-label": t("Done"), type: "button" },
      cls: "clickable-icon",
    });
    setIcon(done, "check");
    setTooltip(done, t("Done"));
    done.addEventListener("click", () => this.close());

    const groups = pinnedGroups(this.actions.entries());
    if (!groups.length) {
      this.contentEl.createDiv({
        cls: "pinned-manager-empty",
        text: t("No pinned commands yet."),
      });
      return;
    }
    groups.forEach((group, index) =>
      this.renderGroup(group.name, group.commands, index),
    );
  }

  private renderGroup(
    name: string,
    entries: readonly PinnedCommand[],
    groupIndex: number,
  ): void {
    const groupEl = this.contentEl.createDiv({ cls: "pinned-manager-group" });
    const header = groupEl.createDiv({ cls: "pinned-manager-group-header" });
    header.draggable = true;
    setIcon(header.createSpan({ cls: "pinned-manager-drag" }), "grip-vertical");
    header.createSpan({ text: pinnedGroupLabel(name) });
    const rename = header.createEl("button", {
      attr: { "aria-label": t("Rename group"), type: "button" },
      cls: "clickable-icon",
    });
    setIcon(rename, "pencil");
    setTooltip(rename, t("Rename group"));
    rename.addEventListener("click", () => {
      void askText(this.app, t("Rename group"), name).then((value) => {
        if (value && value !== name)
          void this.actions.renameGroup(name, value).then(() => this.render());
      });
    });
    this.groupDrag(header, groupIndex);

    for (const [index, entry] of entries.entries())
      this.renderCommand(groupEl, entry, name, index);
  }

  private renderCommand(
    parent: HTMLElement,
    entry: PinnedCommand,
    group: string,
    index: number,
  ): void {
    const row = parent.createDiv({ cls: "pinned-manager-command" });
    row.draggable = true;
    setIcon(row.createSpan({ cls: "pinned-manager-drag" }), "grip-vertical");
    resolveIcon(row.createSpan({ cls: "pinned-manager-icon" }), entry.icon);
    const label = row.createDiv({ cls: "pinned-manager-label" });
    label.createDiv({ text: entry.name });
    label.createDiv({
      cls: "pinned-manager-command-id",
      text: entry.commandId,
    });

    const move = row.createEl("select", {
      attr: { "aria-label": t("Move to") },
      cls: "pinned-manager-move",
    });
    for (const target of pinnedGroups(this.actions.entries()))
      move.createEl("option", {
        text: pinnedGroupLabel(target.name),
        value: target.name,
      });
    move.createEl("option", { text: t("New group…"), value: NEW_GROUP });
    move.value = group;
    move.addEventListener("change", () => {
      void this.moveCommand(entry.commandId, group, move);
    });

    const icon = row.createEl("button", {
      attr: { "aria-label": t("Change icon"), type: "button" },
      cls: "clickable-icon",
    });
    setIcon(icon, "image");
    setTooltip(icon, t("Change icon"));
    icon.addEventListener("click", () => {
      void this.actions.changeIcon(entry.commandId).then(() => this.render());
    });

    const remove = row.createEl("button", {
      attr: { "aria-label": t("Delete"), type: "button" },
      cls: "clickable-icon",
    });
    setIcon(remove, "trash-2");
    setTooltip(remove, t("Delete"));
    remove.addEventListener("click", () => {
      void this.actions.remove(entry.commandId).then(() => this.render());
    });
    this.commandDrag(row, group, index);
  }

  private async moveCommand(
    commandId: string,
    current: string,
    select: HTMLSelectElement,
  ): Promise<void> {
    let target = select.value;
    if (target === NEW_GROUP) {
      const value = await askText(this.app, t("New group…"), "");
      if (!value) {
        select.value = current;
        return;
      }
      target = value;
    }
    await this.actions.moveToGroup(commandId, target);
    this.render();
  }

  private groupDrag(el: HTMLElement, index: number): void {
    el.addEventListener("dragstart", (event) => {
      this.dragging = { kind: "group", index };
      event.dataTransfer?.setData("text/plain", "group");
    });
    el.addEventListener("dragover", (event) => {
      if (this.dragging?.kind === "group") event.preventDefault();
    });
    el.addEventListener("drop", (event) => {
      event.preventDefault();
      const drag = this.dragging;
      this.dragging = null;
      if (drag?.kind === "group" && drag.index !== index)
        void this.actions
          .moveGroup(drag.index, index)
          .then(() => this.render());
    });
    el.addEventListener("dragend", () => (this.dragging = null));
  }

  private commandDrag(el: HTMLElement, group: string, index: number): void {
    el.addEventListener("dragstart", (event) => {
      this.dragging = { kind: "command", group, index };
      event.dataTransfer?.setData("text/plain", "command");
    });
    el.addEventListener("dragover", (event) => {
      const drag = this.dragging;
      if (drag?.kind === "command" && drag.group === group)
        event.preventDefault();
    });
    el.addEventListener("drop", (event) => {
      event.preventDefault();
      const drag = this.dragging;
      this.dragging = null;
      if (
        drag?.kind === "command" &&
        drag.group === group &&
        drag.index !== index
      )
        void this.actions
          .moveCommand(group, drag.index, index)
          .then(() => this.render());
    });
    el.addEventListener("dragend", () => (this.dragging = null));
  }
}

export function openPinnedManager(
  app: App,
  actions: PinnedManagerActions,
): void {
  new PinnedManagerModal(app, actions).open();
}
