import { MenuItem, type App, type Editor, type Menu } from "obsidian";
import { canRun, runConditions } from "./commands/execute";
import { registeredCommandName } from "./commands/registered";
import { commandById, DROPDOWN_ITEMS } from "./model/command-table";
import { BUILT_IN_COMMAND_TABS, PINNED_TAB } from "./model/layout";
import { pinnedGroupLabel, pinnedGroups, pinnedSpecs } from "./model/pinned";
import {
  CASE_OPTIONS,
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  NATIVE_COUNT,
  NATIVE_HIGHLIGHTS,
  STANDARD_COLORS,
} from "./model/palettes";
import { t } from "./i18n/i18n";
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

/** One choice behind a pop-up command: the same spec, one option value. */
interface Choice {
  readonly label: string;
  readonly spec: CommandSpec;
  readonly value?: string;
  readonly icon?: string;
  /** A CSS color: the dot in front of the label, for the color palettes. */
  readonly swatch?: string;
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
    for (const choice of choices) addChoice(submenu, choice, build);
  });
}

function addChoice(menu: Menu, choice: Choice, build: Build): void {
  menu.addItem((item) => {
    item.setTitle(
      choice.swatch === undefined
        ? choice.label
        : swatchTitle(choice.label, choice.swatch),
    );
    item.setIcon(
      choice.icon === undefined ? null : resolveIconName(choice.icon),
    );
    if (!canRun(choice.spec, build.conditions)) item.setDisabled(true);
    else item.onClick(() => build.execute(choice.spec, choice.value));
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

/** What a pop-up button offers, in the order the popover lists it. */
function choicesFor(spec: CommandSpec): readonly Choice[] {
  switch (spec.popup) {
    case "color":
      return [
        ...STANDARD_COLORS.map((hex) => swatch(spec, hex, `color:${hex}`)),
        none(spec, "color"),
      ];
    case "highlight-color":
      return [
        // The first six render as a theme variable, so the dot shows that.
        ...NATIVE_HIGHLIGHTS.map((entry) => ({
          label: entry.hex,
          spec,
          swatch: `var(${entry.variable})`,
          value: `background:${entry.hex}`,
        })),
        ...HIGHLIGHT_COLORS.slice(NATIVE_COUNT).map((hex) =>
          swatch(spec, hex, `background:${hex}`),
        ),
        none(spec, "background"),
      ];
    case "font-size":
      return FONT_SIZES.map((option) => ({
        label: t(option.label),
        spec,
        value: `font-size:${option.value}`,
      }));
    case "font-family":
      return FONT_FAMILIES.map((option) => ({
        label: t(option.label),
        spec,
        value: `font-family:${option.value}`,
      }));
    case "case":
      return CASE_OPTIONS.map((option) => ({
        label: t(option.label),
        spec,
        value: option.mode,
      }));
    default:
      // The drop-down buttons: each item is a command of its own.
      return (DROPDOWN_ITEMS[spec.popup ?? ""] ?? []).map((id) => {
        const item = commandById(id);
        return { icon: item.icon, label: item.name, spec: item };
      });
  }
}

function swatch(spec: CommandSpec, hex: string, value: string): Choice {
  return { label: hex, spec, swatch: hex, value };
}

/** The picker is not here, so the palettes end where the popover goes on. */
function none(spec: CommandSpec, property: string): Choice {
  return { icon: "ban", label: t("No Color"), spec, value: `${property}:none` };
}
