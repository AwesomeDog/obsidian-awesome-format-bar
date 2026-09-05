import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import ja from "../src/i18n/ja";
import de from "../src/i18n/de";
import es from "../src/i18n/es";
import fr from "../src/i18n/fr";
import ko from "../src/i18n/ko";
import zh from "../src/i18n/zh";
import zhTW from "../src/i18n/zh-TW";

/** Keys are English source text, so an entry no source contains is an orphan. */
function sourceText(dir: string): string {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory())
        return entry.name === "i18n" ? [] : sourceText(path);
      return entry.name.endsWith(".ts") ? [readFileSync(path, "utf8")] : [];
    })
    .join("\n");
}

const source = sourceText(new URL("../src", import.meta.url).pathname);

/** Catches the one silent failure of keying by English: renaming the source. */
describe("dictionaries", () => {
  const dicts = { de, es, fr, ja, ko, zh, "zh-TW": zhTW };
  for (const [code, dict] of Object.entries(dicts))
    it(`${code} has no orphaned keys`, () => {
      const orphans = Object.keys(dict).filter(
        (key) => !source.includes(`"${key}"`),
      );
      expect(orphans).toEqual([]);
    });
});
