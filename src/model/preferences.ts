import { DEFAULT_PIN_ICON } from "./pinned";
import type {
  PinnedCommand,
  Settings,
  ToolbarPosition,
  ToolbarPositionVisibility,
} from "./types";

/** Defaults, migration, and which Positions exist right now. */
export const CURRENT_SETTINGS_VERSION = 1;

export const DEFAULT_SETTINGS = {
  version: CURRENT_SETTINGS_VERSION,
  desktop: { top: true, following: false, fixed: false },
  mobile: { top: false, following: false, fixed: true },
  enableOnMobile: true,
  bindEnterToNextRow: true,
  padCellWidthWithSpaces: true,
  sortTableOnHeaderClick: true,
  charUsage: {},
  pinned: [],
} as const satisfies Settings;

export const TOOLBAR_POSITIONS = ["top", "following", "fixed"] as const;
function normalizeVisibility(
  raw: unknown,
  fallback: ToolbarPositionVisibility,
): ToolbarPositionVisibility {
  const source = (raw ?? {}) as Record<string, unknown>;
  const pick = (key: ToolbarPosition): boolean =>
    typeof source[key] === "boolean" ? source[key] : fallback[key];
  return {
    top: pick("top"),
    following: pick("following"),
    fixed: pick("fixed"),
  };
}

function normalizeUsage(raw: unknown): Record<string, number> {
  const source = (raw ?? {}) as Record<string, unknown>;
  const usage: Record<string, number> = {};
  for (const [char, count] of Object.entries(source))
    if (typeof count === "number" && Number.isFinite(count))
      usage[char] = count;
  return usage;
}

/** Fallback, not a version bump: a bump would reset every Position. */
function normalizePinned(raw: unknown): PinnedCommand[] {
  if (!Array.isArray(raw)) return [];
  const pinned: PinnedCommand[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const source = (entry ?? {}) as Record<string, unknown>;
    const commandId = source["commandId"];
    // One button per command: a duplicate pin would only ever run twice.
    if (
      typeof commandId !== "string" ||
      commandId === "" ||
      seen.has(commandId)
    )
      continue;
    seen.add(commandId);
    pinned.push({
      commandId,
      icon:
        typeof source["icon"] === "string" && source["icon"] !== ""
          ? source["icon"]
          : DEFAULT_PIN_ICON,
      name:
        typeof source["name"] === "string" && source["name"] !== ""
          ? source["name"]
          : commandId,
    });
  }
  return pinned;
}

function normalizeFlag(raw: unknown, key: keyof Settings): boolean {
  return typeof raw === "boolean" ? raw : (DEFAULT_SETTINGS[key] as boolean);
}

/** Same for `charUsage`: a bump would be worse than an empty map. */
export function normalizeSettings(raw: unknown): Settings {
  const source = (raw ?? {}) as Record<string, unknown>;
  if (source["version"] !== CURRENT_SETTINGS_VERSION)
    return structuredClone(DEFAULT_SETTINGS);
  return {
    version: CURRENT_SETTINGS_VERSION,
    desktop: normalizeVisibility(source["desktop"], DEFAULT_SETTINGS.desktop),
    mobile: normalizeVisibility(source["mobile"], DEFAULT_SETTINGS.mobile),
    enableOnMobile: normalizeFlag(source["enableOnMobile"], "enableOnMobile"),
    bindEnterToNextRow: normalizeFlag(
      source["bindEnterToNextRow"],
      "bindEnterToNextRow",
    ),
    padCellWidthWithSpaces: normalizeFlag(
      source["padCellWidthWithSpaces"],
      "padCellWidthWithSpaces",
    ),
    sortTableOnHeaderClick: normalizeFlag(
      source["sortTableOnHeaderClick"],
      "sortTableOnHeaderClick",
    ),
    charUsage: normalizeUsage(source["charUsage"]),
    pinned: normalizePinned(source["pinned"]),
  };
}

/** Which toolbar positions should exist now. Never mutates stored settings. */
export function enabledToolbarPositions(
  settings: Settings,
  isMobile: boolean,
): ToolbarPosition[] {
  if (isMobile && !settings.enableOnMobile) return [];
  const visibility = isMobile ? settings.mobile : settings.desktop;
  return TOOLBAR_POSITIONS.filter((position) => visibility[position]);
}
