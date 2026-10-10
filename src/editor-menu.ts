import { MenuItem, type App, type Editor, type Menu } from "obsidian";
import { canRun, runConditions } from "./commands/execute";
import { registeredCommandName } from "./commands/registered";
import { commandById } from "./model/command-table";
import { BUILT_IN_COMMAND_TABS, PINNED_TAB } from "./model/layout";
import { pinnedGroupLabel, pinnedGroups, pinnedSpecs } from "./model/pinned";
import { popupSections, type PopupChoice } from "./model/popups";
import type { CommandSpec, PinnedCommand } from "./model/types";
import { resolveIconName } from "./toolbar/icons";

declare module "obsidian" {
  interface MenuItem {
    /** Undocumented: this is how Obsidian builds its own nested menus. */
    setSubmenu(): Menu;
  }
}

export interface EditorMenuOptions {
  readonly app: App;
  /** `null` outside an editable editor: everything that writes goes grey. */
  readonly editor: Editor | null;
  readonly pinned: readonly PinnedCommand[];
  readonly title: string;
  readonly execute: (spec: CommandSpec, optionValue?: string) => void;
}

/** The state behind one menu: what can run, and how a choice runs. */
interface Build {
  readonly conditions: ReturnType<typeof runConditions>;
  readonly execute: EditorMenuOptions["execute"];
}

/** The whole command table, under one item of the menu Obsidian just built. */
export function addCommandsToMenu(
  menu: Menu,
  options: EditorMenuOptions,
): void {
  // No nesting, no submenus: better no entry at all than 150 flat ones.
  if (typeof MenuItem.prototype.setSubmenu !== "function") return;
  const build: Build = {
    conditions: runConditions(options.app, options.editor),
    execute: options.execute,
  };

  menu.addSeparator();
  menu.addItem((item) => {
    item.setTitle(options.title).setIcon("paintbrush");
    const root = item.setSubmenu();

    for (const tab of BUILT_IN_COMMAND_TABS)
      root.addItem((tabItem) => {
        tabItem.setTitle(tab.name);
        const groups = tabItem.setSubmenu();
        for (const group of tab.groups)
          addGroup(groups, group.name, group.commands.map(commandById), build);
      });

    const pinned = pinnedGroups(options.pinned);
    if (pinned.length === 0) return;
    root.addItem((tabItem) => {
      tabItem.setTitle(PINNED_TAB.name);
      const groups = tabItem.setSubmenu();
      for (const group of pinned)
        addGroup(
          groups,
          pinnedGroupLabel(group.name),
          pinnedSpecs(group.commands, (commandId) =>
            registeredCommandName(options.app, commandId),
          ),
          build,
        );
    });
  });
}

/** A group is a caption: two levels is deep enough without a third. */
function addGroup(
  menu: Menu,
  name: string,
  specs: readonly CommandSpec[],
  build: Build,
): void {
  menu.addItem((item) => item.setTitle(name).setIsLabel(true));
  for (const spec of specs) addCommand(menu, spec, build);
}

function addCommand(menu: Menu, spec: CommandSpec, build: Build): void {
  // Both open a floating layer of their own, and a menu has no anchor for one.
  if (spec.popup === "character-panel" || spec.popup === "table-grid") return;
  const choices = choicesFor(spec);
  const runnable = canRun(spec, build.conditions);

  menu.addItem((item) => {
    item.setTitle(spec.name).setIcon(resolveIconName(spec.icon));
    if (!runnable) {
      item.setDisabled(true);
      return;
    }
    if (choices.length === 0) {
      item.onClick(() => build.execute(spec));
      return;
    }
    const submenu = item.setSubmenu();
    for (const choice of choices) addChoice(submenu, choice, spec, build);
  });
}

function addChoice(
  menu: Menu,
  choice: PopupChoice,
  spec: CommandSpec,
  build: Build,
): void {
  const target = choice.command ?? spec;
  menu.addItem((item) => {
    item.setTitle(
      choice.swatch === undefined
        ? choice.label
        : swatchTitle(choice.label, choice.swatch),
    );
    item.setIcon(
      choice.icon === undefined ? null : resolveIconName(choice.icon),
    );
    if (!canRun(target, build.conditions)) item.setDisabled(true);
    else item.onClick(() => build.execute(target, choice.value));
  });
}

/** A dot and the hex: `MenuItem` has no swatch of its own. */
function swatchTitle(label: string, color: string): DocumentFragment {
  return createFragment((fragment) => {
    const dot = createSpan();
    dot.style.cssText = `display:inline-block;width:9px;height:9px;margin-right:6px;border-radius:2px;background:${color}`;
    fragment.append(dot);
    fragment.appendText(label);
  });
}

/** A pop-up button's choices in the popover's order, minus the picker: a menu has no anchor for it. */
function choicesFor(spec: CommandSpec): readonly PopupChoice[] {
  return popupSections(spec.popup)
    .flatMap((section) => section.items)
    .filter((choice) => choice.picker === undefined);
}
