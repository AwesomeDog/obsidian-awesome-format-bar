import { ALL_FONTS } from "./palettes";

interface LocalFontData {
  readonly family: string;
}

type QueryLocalFonts = () => Promise<readonly LocalFontData[]>;

/** Off `window`, not `navigator.fonts`: that form does not exist in Obsidian. */
function queryLocalFonts(): QueryLocalFonts | undefined {
  const candidate = (window as unknown as { queryLocalFonts?: unknown })
    .queryLocalFonts;
  return typeof candidate === "function"
    ? (candidate as QueryLocalFonts)
    : undefined;
}

/** `pending` is a read still running; `unsupported` is mobile or a failed read. */
export type LocalFonts =
  | { readonly kind: "unsupported" }
  | { readonly kind: "pending" }
  | {
      readonly kind: "ready";
      readonly installed: ReadonlySet<string>;
      readonly extra: readonly string[];
    };

let state: LocalFonts = { kind: "pending" };
let started = false;

const waiting = new Set<() => void>();

export function loadLocalFonts(): void {
  if (started) return;
  started = true;
  const query = queryLocalFonts();
  if (!query) {
    settle({ kind: "unsupported" });
    return;
  }
  query().then(accept, () => {
    settle({ kind: "unsupported" });
  });
}

function accept(data: readonly LocalFontData[]): void {
  const { installed, extra } = splitLocalFonts(data.map((face) => face.family));
  settle({ kind: "ready", installed, extra });
}

function settle(next: LocalFonts): void {
  state = next;
  const listeners = [...waiting];
  waiting.clear();
  for (const listener of listeners) listener();
}

export function onLocalFonts(listener: () => void): () => void {
  waiting.add(listener);
  return () => waiting.delete(listener);
}

export function splitLocalFonts(families: readonly string[]): {
  readonly installed: ReadonlySet<string>;
  readonly extra: readonly string[];
} {
  const installed = new Set<string>();
  const curated = new Set(ALL_FONTS.map((font) => font.name.toLowerCase()));
  const extra: string[] = [];
  for (const name of families) {
    if (!isSafeFamily(name)) continue;
    const key = name.toLowerCase();
    if (installed.has(key)) continue;
    installed.add(key);
    if (!curated.has(key)) extra.push(name);
  }
  extra.sort((a, b) => a.localeCompare(b));
  return { installed, extra };
}

/** A family with `;` or `"` would write a span nothing can read back. */
export function isSafeFamily(name: string): boolean {
  return name !== "" && !/['";\\<>]/.test(name);
}

export function localFonts(): LocalFonts {
  return state;
}

/** `null` while unknown: unknown must not dim a font that may well be there. */
export function isFontInstalled(
  fonts: LocalFonts,
  name: string,
): boolean | null {
  return fonts.kind === "ready"
    ? fonts.installed.has(name.toLowerCase())
    : null;
}
