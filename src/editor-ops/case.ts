import {
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";

export type CaseMode =
  | "upper"
  | "lower"
  | "capitalize"
  | "toggle"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab";

/** The four modes that re-join words instead of rewriting them in place. */
type JoinMode = "camel" | "pascal" | "snake" | "kebab";

const WORD = /\p{L}[\p{L}\p{M}\p{Nd}'’]*/gu;

/** Splits on separators and humps: `foo barBaz` -> `["foo", "bar", "Baz"]`. */
function splitWords(text: string): string[] {
  return text
    .replace(/(\p{Ll}|\p{Nd})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{Nd}]+/u)
    .filter(Boolean);
}

function upperFirst(word: string): string {
  return word.charAt(0).toLocaleUpperCase("en-US") + word.slice(1);
}

function joinWords(words: readonly string[], mode: JoinMode): string {
  const lower = words.map((word) => word.toLocaleLowerCase("en-US"));
  switch (mode) {
    case "snake":
      return lower.join("_");
    case "kebab":
      return lower.join("-");
    case "camel":
      return lower.map((word, at) => (at ? upperFirst(word) : word)).join("");
    case "pascal":
      return lower.map((word) => upperFirst(word)).join("");
  }
}

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case "upper":
      return text.toLocaleUpperCase("en-US");
    case "lower":
      return text.toLocaleLowerCase("en-US");
    case "capitalize":
      return text.replace(
        WORD,
        (word) =>
          word.charAt(0).toLocaleUpperCase("en-US") +
          word.slice(1).toLocaleLowerCase("en-US"),
      );
    case "toggle":
      return Array.from(text, (char) => {
        const upper = char.toLocaleUpperCase("en-US");
        return char === upper ? char.toLocaleLowerCase("en-US") : upper;
      }).join("");
    case "camel":
    case "pascal":
    case "snake":
    case "kebab":
      return joinWords(splitWords(text), mode);
  }
}

export function changeCase(
  doc: string,
  ranges: readonly Range[],
  mode: CaseMode,
): Plan {
  const changes: Change[] = [];
  for (const range of normalizeRanges(ranges)) {
    if (range.from === range.to) continue;
    const source = doc.slice(range.from, range.to);
    const next = convertCase(source, mode);
    if (next !== source)
      changes.push({ from: range.from, to: range.to, text: next });
  }
  return { changes: order(changes) };
}
