import type { CommandSpec, PinnedCommand } from "./types";

/** Pinned buttons are user data, rebuilt as specs that forward. */
export const DEFAULT_PIN_ICON = "command";
export const DEFAULT_PIN_GROUP = "General";

export interface PinnedGroup {
  readonly name: string;
  readonly commands: readonly PinnedCommand[];
}

/** Groups are a view of the flat data; first appearance fixes their order. */
export function pinnedGroups(
  pinned: readonly PinnedCommand[],
): readonly PinnedGroup[] {
  const groups = new Map<string, PinnedCommand[]>();
  for (const entry of pinned) {
    const name = entry.group?.trim() || DEFAULT_PIN_GROUP;
    const commands = groups.get(name);
    if (commands) commands.push(entry);
    else groups.set(name, [entry]);
  }
  return [...groups].map(([name, commands]) => ({ name, commands }));
}

/** Rewrites a grouped view into the single persisted order. */
export function flattenPinnedGroups(
  groups: readonly PinnedGroup[],
): PinnedCommand[] {
  return groups.flatMap((group) => [...group.commands]);
}

function groupValue(name: string): string | undefined {
  const trimmed = name.trim();
  return trimmed === "" || trimmed === DEFAULT_PIN_GROUP ? undefined : trimmed;
}

export function movePinnedToGroup(
  pinned: readonly PinnedCommand[],
  commandId: string,
  target: string,
): PinnedCommand[] {
  const entry = pinned.find((candidate) => candidate.commandId === commandId);
  if (!entry) return [...pinned];
  const groups = pinnedGroups(pinned).map((group) => ({
    name: group.name,
    commands: [...group.commands].filter(
      (candidate) => candidate.commandId !== commandId,
    ),
  }));
  const targetName = target.trim() || DEFAULT_PIN_GROUP;
  let targetGroup = groups.find((group) => group.name === targetName);
  if (!targetGroup) {
    targetGroup = { name: targetName, commands: [] };
    groups.push(targetGroup);
  }
  targetGroup.commands.push({ ...entry, group: groupValue(targetName) });
  return flattenPinnedGroups(groups.filter((group) => group.commands.length));
}

export function renamePinnedGroup(
  pinned: readonly PinnedCommand[],
  from: string,
  to: string,
): PinnedCommand[] {
  const target = to.trim();
  if (!target || from === target) return [...pinned];
  return pinned.map((entry) =>
    (entry.group?.trim() || DEFAULT_PIN_GROUP) === from
      ? { ...entry, group: groupValue(target) }
      : entry,
  );
}

export function movePinnedGroup(
  pinned: readonly PinnedCommand[],
  from: number,
  to: number,
): PinnedCommand[] {
  const groups = pinnedGroups(pinned).map((group) => ({
    name: group.name,
    commands: [...group.commands],
  }));
  const [moved] = groups.splice(from, 1);
  if (!moved) return [...pinned];
  groups.splice(Math.max(0, Math.min(to, groups.length)), 0, moved);
  return flattenPinnedGroups(groups);
}

export function movePinnedWithinGroup(
  pinned: readonly PinnedCommand[],
  groupName: string,
  from: number,
  to: number,
): PinnedCommand[] {
  const groups = pinnedGroups(pinned).map((group) => ({
    name: group.name,
    commands: [...group.commands],
  }));
  const group = groups.find((candidate) => candidate.name === groupName);
  if (!group) return [...pinned];
  const [moved] = group.commands.splice(from, 1);
  if (!moved) return [...pinned];
  group.commands.splice(
    Math.max(0, Math.min(to, group.commands.length)),
    0,
    moved,
  );
  return flattenPinnedGroups(groups);
}

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
