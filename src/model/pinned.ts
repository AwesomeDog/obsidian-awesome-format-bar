import { t } from "../i18n/i18n";
import type { CommandSpec, PinnedCommand } from "./types";

export const DEFAULT_PIN_ICON = "command";
export const DEFAULT_PIN_GROUP = "General";

export function pinnedGroupLabel(name: string): string {
  return name === DEFAULT_PIN_GROUP ? t("General") : name;
}

export interface PinnedGroup {
  readonly name: string;
  commands: PinnedCommand[];
}

/** Groups are a view of the flat data; first appearance fixes their order.
 * The arrays are built here, so a caller may splice them freely. */
export function pinnedGroups(pinned: readonly PinnedCommand[]): PinnedGroup[] {
  const groups = new Map<string, PinnedCommand[]>();
  for (const entry of pinned) {
    const name = entry.group?.trim() || DEFAULT_PIN_GROUP;
    const commands = groups.get(name);
    if (commands) commands.push(entry);
    else groups.set(name, [entry]);
  }
  return [...groups].map(([name, commands]) => ({ name, commands }));
}

export function flattenPinnedGroups(
  groups: readonly PinnedGroup[],
): PinnedCommand[] {
  return groups.flatMap((group) => [...group.commands]);
}

function groupValue(name: string): string | undefined {
  const trimmed = name.trim();
  return trimmed === "" || trimmed === DEFAULT_PIN_GROUP ? undefined : trimmed;
}

function moveWithin<T>(list: T[], from: number, to: number): boolean {
  const [moved] = list.splice(from, 1);
  if (moved === undefined) return false;
  list.splice(Math.max(0, Math.min(to, list.length)), 0, moved);
  return true;
}

export function movePinnedToGroup(
  pinned: readonly PinnedCommand[],
  commandId: string,
  target: string,
): PinnedCommand[] {
  const entry = pinned.find((candidate) => candidate.commandId === commandId);
  if (!entry) return [...pinned];
  const groups = pinnedGroups(pinned).map((group) => ({
    ...group,
    commands: group.commands.filter(
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
  const groups = pinnedGroups(pinned);
  return moveWithin(groups, from, to)
    ? flattenPinnedGroups(groups)
    : [...pinned];
}

export function movePinnedWithinGroup(
  pinned: readonly PinnedCommand[],
  groupName: string,
  from: number,
  to: number,
): PinnedCommand[] {
  const groups = pinnedGroups(pinned);
  const group = groups.find((candidate) => candidate.name === groupName);
  return group && moveWithin(group.commands, from, to)
    ? flattenPinnedGroups(groups)
    : [...pinned];
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
    name: nameOf(entry.commandId) ?? entry.name,
  }));
}
