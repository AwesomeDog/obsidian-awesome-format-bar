import { CJK, fenceMask, Lines } from "./lines";
import {
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";

/** A URL is copied verbatim: an em dash where `--` was stops it resolving. */
const ADDRESS = /[a-z][a-z0-9+.-]*:\/\/[^\s<>()"']+/giu;

/** Runs `edit` over everything but the URLs, which pass through untouched. */
function outsideUrls(text: string, edit: (chunk: string) => string): string {
  let out = "";
  let at = 0;
  for (const match of text.matchAll(ADDRESS)) {
    const start = match.index ?? 0;
    out += edit(text.slice(at, start)) + match[0];
    at = start + match[0].length;
  }
  return out + edit(text.slice(at));
}

/**
 * The one walk over fenced code. `editable` is false for fence markers and
 * everything inside them; returning `null` drops the line.
 */
function editLines(
  text: string,
  edit: (line: string, editable: boolean) => string | null,
): string {
  const lines = new Lines(text);
  const fenced = fenceMask(lines);
  const kept: string[] = [];
  for (let line = 0; line < lines.count; line++) {
    const edited = edit(lines.at(line), !fenced[line]);
    if (edited !== null) kept.push(edited);
  }
  return kept.join("\n");
}

/** Character-level: an editable line is split around its inline code. */
function mapEditable(
  text: string,
  transform: (part: string) => string,
): string {
  return editLines(text, (line, editable) =>
    editable
      ? line
          .split(/(`+[^`\n]*`+)/g)
          .map((chunk, index) => (index % 2 === 0 ? transform(chunk) : chunk))
          .join("")
      : line,
  );
}

function planRanges(
  doc: string,
  ranges: readonly Range[],
  transform: (text: string) => string,
): Plan {
  const changes: Change[] = [];
  for (const range of normalizeRanges(ranges)) {
    const source = doc.slice(range.from, range.to);
    const text = transform(source);
    if (text !== source) changes.push({ from: range.from, to: range.to, text });
  }
  return { changes: order(changes) };
}

function scope(doc: string, ranges: readonly Range[]): Range[] {
  const selected = normalizeRanges(ranges).filter(
    (range) => range.from !== range.to,
  );
  return selected.length > 0 ? selected : [{ from: 0, to: doc.length }];
}

export function smartPunctuation(doc: string, ranges: readonly Range[]): Plan {
  return planRanges(doc, scope(doc, ranges), (text) =>
    mapEditable(text, (part) => {
      // Outside the URL walk, so a URL never resets which quote is opening.
      let opening = true;
      const edit = (chunk: string): string =>
        // Three or more hyphens are a rule, frontmatter or a table delimiter;
        // only a bare pair is an em dash.
        chunk
          .replace(/\.\.\./g, "…")
          .replace(/-{2,}/g, (run) => (run.length === 2 ? "—" : run))
          .replace(/"/g, () => {
            const quote = opening ? "“" : "”";
            opening = !opening;
            return quote;
          })
          .replace(/(^|[\s([{])'/g, "$1‘")
          .replace(/'/g, "’");
      return outsideUrls(part, edit);
    }),
  );
}

export function cjkSpacing(doc: string, ranges: readonly Range[]): Plan {
  // `CJK.source` already is a character class, brackets included.
  const cjk = CJK.source;
  const latin = `[A-Za-z0-9]`;
  return planRanges(doc, scope(doc, ranges), (text) =>
    mapEditable(text, (part) =>
      part
        .replace(new RegExp(`(${cjk})[ ]*(${latin})`, "gu"), "$1 $2")
        .replace(new RegExp(`(${latin})[ ]*(${cjk})`, "gu"), "$1 $2"),
    ),
  );
}

function cleanTrailing(text: string): string {
  return editLines(text, (line, editable) =>
    editable ? line.replace(/[ \t]+$/u, "") : line,
  );
}

function collapseBlanks(text: string): string {
  let blank = false;
  return editLines(text, (line, editable) => {
    if (!editable || line.trim() !== "") {
      blank = false;
      return line;
    }
    if (blank) return null;
    blank = true;
    return line;
  });
}

function bareUrls(text: string): string {
  return mapEditable(text, (part) =>
    part.replace(/https?:\/\/[^\s<>()]+/giu, (url, at: number) => {
      const previous = part[at - 1] ?? "";
      if (previous === "(" || previous === "[" || previous === "<") return url;
      const punctuation = url.match(/[.,!?;:]+$/u)?.[0] ?? "";
      const clean = punctuation ? url.slice(0, -punctuation.length) : url;
      return `[${clean}](${clean})${punctuation}`;
    }),
  );
}

function normalizeMarkup(text: string): string {
  return mapEditable(text, (part) =>
    part
      .replace(/(?<!\w)__([^_\n]+)__/gu, "**$1**")
      .replace(/(?<!\w)_([^_\n]+)_(?!\w)/gu, "*$1*"),
  );
}

function normalizeBullets(text: string): string {
  return editLines(text, (line, editable) =>
    editable ? line.replace(/^(\s*)[+*](\s+)/u, "$1-$2") : line,
  );
}

/**
 * ZWSP, word joiner, BOM and soft hyphen: nothing in a note can want them.
 * ZWJ and ZWNJ are left alone — ZWJ is what holds an emoji family together,
 * ZWNJ carries meaning in Persian and Arabic — and so are the direction marks.
 */
const INVISIBLE = /[\u00ad\u200b\u2060\ufeff]/gu;

/** NBSP turns into a plain space; every other odd space is someone's layout. */
function dropInvisible(text: string): string {
  return mapEditable(text, (part) =>
    part.replace(INVISIBLE, "").replace(/\u00a0/gu, " "),
  );
}

export type CleanupKind =
  | "trailing-spaces"
  | "blank-lines"
  | "bare-urls"
  | "emphasis-strong"
  | "bullet-style"
  | "invisible-characters";

export function cleanUp(
  doc: string,
  ranges: readonly Range[],
  kind: CleanupKind,
): Plan {
  const transforms: Record<CleanupKind, (text: string) => string> = {
    "trailing-spaces": cleanTrailing,
    "blank-lines": collapseBlanks,
    "bare-urls": bareUrls,
    "emphasis-strong": normalizeMarkup,
    "bullet-style": normalizeBullets,
    "invisible-characters": dropInvisible,
  };
  return planRanges(doc, scope(doc, ranges), transforms[kind]);
}
