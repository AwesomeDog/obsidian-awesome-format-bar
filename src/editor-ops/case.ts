import {
  normalizeRanges,
  order,
  type Change,
  type Plan,
  type Range,
} from "./plan";

export type CaseMode = "upper" | "lower" | "capitalize" | "toggle";

const WORD = /\p{L}[\p{L}\p{M}\p{Nd}'’]*/gu;

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
