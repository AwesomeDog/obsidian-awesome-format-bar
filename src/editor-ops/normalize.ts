import {
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";

const FENCE = /^\s*(?:```|~~~)/;
const CJK =
  "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}";

function mapEditable(
  text: string,
  transform: (part: string) => string,
): string {
  let fenced = false;
  return text
    .split(/(\n)/)
    .map((part) => {
      if (part === "\n") return part;
      if (FENCE.test(part)) {
        fenced = !fenced;
        return part;
      }
      if (fenced) return part;
      return part
        .split(/(`+[^`\n]*`+)/g)
        .map((chunk, index) => (index % 2 === 0 ? transform(chunk) : chunk))
        .join("");
    })
    .join("");
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
      let opening = true;
      return part
        .replace(/\.\.\./g, "…")
        .replace(/--/g, "—")
        .replace(/"/g, () => {
          const quote = opening ? "“" : "”";
          opening = !opening;
          return quote;
        })
        .replace(/(^|[\s([{])'/g, "$1‘")
        .replace(/'/g, "’");
    }),
  );
}

export function cjkSpacing(doc: string, ranges: readonly Range[]): Plan {
  const cjk = `[${CJK}]`;
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
  let fenced = false;
  return text
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) {
        fenced = !fenced;
        return line;
      }
      return fenced ? line : line.replace(/[ \t]+$/u, "");
    })
    .join("\n");
}

function collapseBlanks(text: string): string {
  let fenced = false;
  let blank = false;
  return text
    .split("\n")
    .filter((line) => {
      if (FENCE.test(line)) {
        fenced = !fenced;
        blank = false;
        return true;
      }
      if (fenced || line.trim() !== "") {
        blank = false;
        return true;
      }
      if (blank) return false;
      blank = true;
      return true;
    })
    .join("\n");
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
  let fenced = false;
  return text
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) {
        fenced = !fenced;
        return line;
      }
      return fenced ? line : line.replace(/^(\s*)[+*](\s+)/u, "$1-$2");
    })
    .join("\n");
}

export type CleanupKind =
  | "trailing-spaces"
  | "blank-lines"
  | "bare-urls"
  | "emphasis-strong"
  | "bullet-style";

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
  };
  return planRanges(doc, scope(doc, ranges), transforms[kind]);
}
