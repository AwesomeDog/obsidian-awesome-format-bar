import type { EmojiMartData } from "@emoji-mart/data";
import kaomojiData from "./kaomoji.json";
import { SYMBOL_GROUPS } from "./symbols";

/** One Emoji & Symbols entry; `words` is the lowercase haystack. */
export interface CharEntry {
  readonly char: string;
  readonly name: string;
  readonly words: string;
  readonly group: string;
}

interface CharSource {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly CharEntry[];
}

/** emoji-mart ships category ids only; these are what the chips read. */
const EMOJI_GROUPS: Readonly<Record<string, string>> = {
  activity: "Activity",
  flags: "Flags",
  foods: "Food & Drink",
  nature: "Animals & Nature",
  objects: "Objects",
  people: "Smileys & People",
  places: "Travel & Places",
  symbols: "Symbols",
};

function entry(
  char: string,
  name: string,
  keywords: readonly string[],
  group: string,
): CharEntry {
  return {
    char,
    group,
    name,
    words: [name, ...keywords].join(" ").toLowerCase(),
  };
}

function buildEmoji(emojiData: EmojiMartData): readonly CharEntry[] {
  const out: CharEntry[] = [];
  for (const category of emojiData.categories) {
    const group = EMOJI_GROUPS[category.id] ?? category.id;
    for (const id of category.emojis) {
      const emoji = emojiData.emojis[id];
      const skin = emoji?.skins[0];
      if (!emoji || !skin) continue;
      out.push(entry(skin.native, emoji.name, emoji.keywords, group));
    }
  }
  return out;
}

function buildKaomoji(): readonly CharEntry[] {
  return Object.entries(kaomojiData).map(([id, item]) =>
    entry(item.icon, id.replace(/_/g, " "), item.keywords, item.category),
  );
}

function buildSymbols(): readonly CharEntry[] {
  const out: CharEntry[] = [];
  for (const { group, entries } of SYMBOL_GROUPS)
    for (const [char, name, keywords] of entries)
      out.push(entry(char, name, keywords.split(" "), group));
  return out;
}

let sources: readonly CharSource[] | null = null;

/** Loaded on first open, not at plugin load: 430 KB nobody owes a shut panel. */
export async function loadCharSources(): Promise<readonly CharSource[]> {
  if (!sources) {
    const { default: emojiData } = await import("@emoji-mart/data");
    sources = [
      { entries: buildEmoji(emojiData), id: "emoji", label: "Emoji" },
      { entries: buildKaomoji(), id: "kaomoji", label: "Kaomoji" },
      { entries: buildSymbols(), id: "symbols", label: "Symbols" },
    ];
  }
  return sources;
}

function loadedSources(): readonly CharSource[] {
  return sources ?? [];
}

export function groupsOf(entries: readonly CharEntry[]): readonly string[] {
  return [...new Set(entries.map((candidate) => candidate.group))];
}

const RESULT_LIMIT = 120;

/** Two rows of eight; past that the row is no faster to scan than a group. */
export const FREQUENT_LIMIT = 16;

/** 3 = name starts with it, 2 = a word starts with it, 1 = anywhere, 0 = no. */
function score(candidate: CharEntry, tokens: readonly string[]): number {
  let lowest = 3;
  for (const token of tokens) {
    let hit: number;
    if (candidate.words.startsWith(token)) hit = 3;
    else if (candidate.words.includes(` ${token}`)) hit = 2;
    else if (candidate.words.includes(token)) hit = 1;
    else return 0;
    if (hit < lowest) lowest = hit;
  }
  return lowest;
}

/** Every token must match; ties keep dataset order. */
export function searchCharacters(
  entries: readonly CharEntry[],
  query: string,
  limit = RESULT_LIMIT,
): readonly CharEntry[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const hits: { entry: CharEntry; score: number }[] = [];
  for (const candidate of entries) {
    const value = score(candidate, tokens);
    if (value > 0) hits.push({ entry: candidate, score: value });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit).map((hit) => hit.entry);
}

export function frequentlyUsed(
  entries: readonly CharEntry[],
  usage: Readonly<Record<string, number>>,
  limit = FREQUENT_LIMIT,
): readonly CharEntry[] {
  const used = entries.filter((candidate) => (usage[candidate.char] ?? 0) > 0);
  used.sort((a, b) => (usage[b.char] ?? 0) - (usage[a.char] ?? 0));
  return used.slice(0, limit);
}

/** Per source: one shared ranking would starve kaomoji. */
export function pruneUsage(usage: Record<string, number>): void {
  const shown = new Set<string>();
  for (const source of loadedSources())
    for (const entry of frequentlyUsed(source.entries, usage))
      shown.add(entry.char);

  for (const char of Object.keys(usage))
    if (!shown.has(char)) delete usage[char];
}
