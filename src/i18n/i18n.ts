import { COMMANDS } from "../model/command-table";
import { BUILT_IN_COMMAND_TABS, PINNED_TAB } from "../model/layout";
import de from "./de";
import es from "./es";
import fr from "./fr";
import ja from "./ja";
import ko from "./ko";
import zh from "./zh";
import zhTW from "./zh-TW";

type Dict = Readonly<Record<string, string>>;
/** `as const` freezes these tables at compile time only, so they can be renamed. */
type Named = { name: string };

/** Keyed by what `getLanguage()` returns; English is the source text. */
const DICTS: Record<string, Dict> = { de, es, fr, ja, ko, zh, "zh-TW": zhTW };

const EMPTY: Dict = {};
let current: Dict = EMPTY;

/** Every row whose `name` is display text, gathered once at import. */
const ROWS: readonly Named[] = [
  ...COMMANDS,
  ...BUILT_IN_COMMAND_TABS.flatMap((tab) => [tab, ...tab.groups]),
  PINNED_TAB,
];

/** English, captured before the first rename, so `setLanguage` repeats safely. */
const ENGLISH = new Map(ROWS.map((row) => [row, row.name] as const));

export function setLanguage(code: string): void {
  current = DICTS[code] ?? EMPTY;
  for (const row of ROWS) {
    const english = ENGLISH.get(row) ?? row.name;
    row.name = current[english] || english;
  }
}

/** Text no table owns: UI literals and notices, keyed by their own English. */
export function t(text: string, vars?: Record<string, string>): string {
  const template = current[text] || text;
  if (!vars) return template;
  return template.replace(
    /\{(\w+)\}/g,
    (whole, name: string) => vars[name] ?? whole,
  );
}
