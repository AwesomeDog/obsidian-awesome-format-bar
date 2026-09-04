import {
  FuzzySuggestModal,
  setIcon,
  type App,
  type Command,
  type FuzzyMatch,
} from "obsidian";
import { registeredCommands } from "./commands/registered";
import { DEFAULT_PIN_ICON } from "./model/pinned";
import type { PinnedCommand } from "./model/types";
import { allIconNames } from "./toolbar/icons";

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
    super(app, "Search commands to pin", onDismiss);
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
    super(app, `Icon for ${commandName}`, onDismiss);
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
