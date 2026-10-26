import type { App, Command } from "obsidian";
import type { CommandSpec } from "../model/types";

interface CommandRegistry {
  findCommand(id: string): Command | undefined;
  executeCommandById(id: string): boolean;
  commands?: Record<string, Command>;
}

type AppWithCommandRegistry = App & { commands: CommandRegistry };

interface HotkeyManager {
  printHotkeyForCommand(id: string): string;
}

type AppWithHotkeyManager = App & { hotkeyManager?: HotkeyManager };

/** The bound key: the user's binding wins, Obsidian resolves the factory default. */
export function registeredHotkey(app: App, id: string): string {
  return (
    (app as AppWithHotkeyManager).hotkeyManager?.printHotkeyForCommand(id) ?? ""
  );
}

function commandRegistry(app: App): CommandRegistry | null {
  const registry = (app as AppWithCommandRegistry).commands;
  return typeof registry?.executeCommandById === "function" ? registry : null;
}

/** `listCommands()` cannot stand in: it drops commands while no editor has focus. */
export function registeredCommandAvailable(app: App, id: string): boolean {
  const registry = commandRegistry(app);
  return registry !== null && registry.findCommand(id) !== undefined;
}

export function registeredCommandEnabled(app: App, id: string): boolean {
  const command = commandRegistry(app)?.findCommand(id);
  if (!command) return false;
  return command.checkCallback ? command.checkCallback(true) === true : true;
}

export function registeredCommands(app: App): Command[] {
  const registry = commandRegistry(app);
  return registry?.commands ? Object.values(registry.commands) : [];
}

export function registeredCommandName(
  app: App,
  id: string,
): string | undefined {
  return commandRegistry(app)?.findCommand(id)?.name;
}

export function executeRegisteredCommand(app: App, id: string): void {
  const registry = commandRegistry(app);
  if (!registry) throw new Error(`Registered command unavailable: ${id}`);
  if (!registry.executeCommandById(id))
    throw new Error(`Registered command unavailable: ${id}`);
}

export function missingForwardedCommands(
  app: App,
  specs: readonly CommandSpec[],
): string[] {
  return specs
    .map((spec) => spec.registeredCommandId)
    .filter((id): id is string => typeof id === "string")
    .filter((id) => !registeredCommandAvailable(app, id));
}
