import { describe, expect, it } from "vitest";
import {
  FREQUENT_LIMIT,
  frequentlyUsed,
  loadCharSources,
  pruneUsage,
  searchCharacters,
  type CharEntry,
} from "../src/model/characters";

/** The dataset is loaded lazily now, so every suite below shares one load. */
const sources = await loadCharSources();

function makeEntry(
  char: string,
  name: string,
  keywords: readonly string[] = [],
): CharEntry {
  return {
    char,
    group: "group",
    name,
    words: [name, ...keywords].join(" ").toLowerCase(),
  };
}

const entries = [
  makeEntry("B", "Fire", ["hot", "burn"]),
  makeEntry("C", "Fire Engine", ["truck"]),
  makeEntry("D", "Campfire", ["fire", "wood"]),
  makeEntry("A", "Grinning Face", ["smile", "happy"]),
];

describe("searchCharacters", () => {
  it("returns nothing without a query", () => {
    expect(searchCharacters(entries, "")).toEqual([]);
    expect(searchCharacters(entries, "   ")).toEqual([]);
  });

  it("ranks a name prefix above a word prefix above a substring", () => {
    // B and C start with "fir"; D merely contains the word "fire".
    expect(searchCharacters(entries, "fir").map((e) => e.char)).toEqual([
      "B",
      "C",
      "D",
    ]);
  });

  it("requires every token to match", () => {
    expect(searchCharacters(entries, "fire truck").map((e) => e.char)).toEqual([
      "C",
    ]);
    expect(searchCharacters(entries, "fire banana")).toEqual([]);
  });
});

describe("frequentlyUsed", () => {
  const pool = [makeEntry("A", "a"), makeEntry("B", "b"), makeEntry("C", "c")];

  it("sorts by count and drops what was never picked", () => {
    expect(frequentlyUsed(pool, { A: 5, B: 1 }).map((e) => e.char)).toEqual([
      "A",
      "B",
    ]);
  });
});

describe("pruneUsage", () => {
  const emoji = sources.find((source) => source.id === "emoji")?.entries ?? [];

  it("forgets everything the panel can no longer show", () => {
    const chars = emoji.slice(0, FREQUENT_LIMIT + 5).map((entry) => entry.char);
    const usage: Record<string, number> = {};
    chars.forEach((char, index) => {
      usage[char] = 100 - index; // index 0 is the most used
    });
    expect(Object.keys(usage)).toHaveLength(FREQUENT_LIMIT + 5);

    pruneUsage(usage);

    const survivors = new Set(Object.keys(usage));
    expect(survivors.size).toBe(FREQUENT_LIMIT);
    expect(survivors.has(chars[0] ?? "")).toBe(true);
    expect(survivors.has(chars[FREQUENT_LIMIT] ?? "")).toBe(false);
  });

  it("caps each source separately, not the map as a whole", () => {
    const kaomoji = sources.find((source) => source.id === "kaomoji")
      ?.entries[0]?.char;
    if (!kaomoji) return;

    const chars = emoji.slice(0, FREQUENT_LIMIT + 5).map((entry) => entry.char);
    const usage: Record<string, number> = { [kaomoji]: 1 };
    chars.forEach((char, index) => {
      usage[char] = 100 - index;
    });

    pruneUsage(usage);

    // The only kaomoji: a single global ranking would have starved it.
    expect(usage[kaomoji]).toBe(1);
  });
});

describe("charSources", () => {
  const byIndex = (id: string): readonly CharEntry[] =>
    sources.find((source) => source.id === id)?.entries ?? [];

  it("gives every emoji a character and a named group", () => {
    const emoji = byIndex("emoji");
    expect(emoji.length).toBeGreaterThan(1000);
    for (const entry of emoji) {
      expect(entry.char.length).toBeGreaterThan(0);
      // Groups are translated from emoji-mart's bare category ids, so an
      // untranslated id means a new category appeared upstream.
      expect(entry.group).toMatch(/^[A-Z]/);
    }
  });
});
