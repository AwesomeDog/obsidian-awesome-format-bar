import { getIconIds, setIcon } from "obsidian";
import { COMMANDS } from "../model/command-table";

const PLACEHOLDER_ICON = "format-bar-placeholder";
let knownIcons: Set<string> | null = null;
let sortedIcons: string[] | null = null;

/** Lucide renames icons between releases; a rename degrades to a synonym. */
const ICON_FALLBACKS: Readonly<Record<string, readonly string[]>> = {
  "arrow-down-a-z": ["sort-asc", "arrow-down-az"],
  brackets: ["braces", "brackets-contain"],
  "case-upper": ["case-sensitive", "a-large-small"],
  "clipboard-paste": ["clipboard-copy", "clipboard"],
  "file-input": ["file-symlink", "file-plus"],
  "fold-horizontal": ["panel-left-close", "columns-2"],
  "heading-1": ["header-1"],
  "heading-2": ["header-2"],
  "heading-3": ["header-3"],
  "heading-4": ["header-4"],
  "heading-5": ["header-5"],
  "heading-6": ["header-6"],
  "heading-off": ["remove-formatting", "eraser"],
  "indent-decrease": ["outdent"],
  "indent-increase": ["indent"],
  "list-start": ["list-ordered", "list-restart"],
  "more-horizontal": ["ellipsis", "more-vertical"],
  "paint-bucket": ["paintbucket", "palette"],
  percent: ["percent-circle", "message-square"],
  "square-code": ["file-code", "code-2"],
};

/** Obsidian registers its own Lucide set under a `lucide-` prefix. */
function known(): Set<string> {
  knownIcons ??= new Set(getIconIds().map((id) => id.replace(/^lucide-/, "")));
  return knownIcons;
}

function iconExists(icon: string): boolean {
  return known().has(icon);
}

/** Cached: `getItems()` runs on every keystroke. */
export function allIconNames(): string[] {
  sortedIcons ??= [...known()].sort();
  return sortedIcons;
}

/** First name in the chain this Obsidian has. */
function resolveIconName(icon: string): string {
  if (iconExists(icon)) return icon;
  return (ICON_FALLBACKS[icon] ?? []).find(iconExists) ?? PLACEHOLDER_ICON;
}

export function resolveIcon(el: HTMLElement, icon: string): void {
  setIcon(el, resolveIconName(icon));
}

/** Icons that fall through to the placeholder. */
export function missingIcons(): string[] {
  return COMMANDS.filter(
    (spec) => resolveIconName(spec.icon) === PLACEHOLDER_ICON,
  ).map((spec) => spec.icon);
}
