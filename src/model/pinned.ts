import type { CommandSpec, PinnedCommand } from "./types";

/** Pinned buttons are user data, rebuilt as specs that forward. */
export const DEFAULT_PIN_ICON = "command";

export function pinnedSpecs(
  pinned: readonly PinnedCommand[],
  nameOf: (commandId: string) => string | undefined,
): CommandSpec[] {
  return pinned.map((entry) => ({
    registeredCommandId: entry.commandId,
    icon: entry.icon || DEFAULT_PIN_ICON,
    id: `pinned:${entry.commandId}`,
    kind: "registered",
    // The registry is live: a command renamed by an update keeps its label.
    name: nameOf(entry.commandId) ?? entry.name,
  }));
}
