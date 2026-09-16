import { NO_CHANGE, type Plan, type Range } from "./plan";
import { Lines } from "./lines";

/** `![[a.png]]`, `![[a.png|300]]`; the pipe segment is a size or an alias. */
const WIKI_EMBED = /!\[\[([^\]]*)\]\]/g;
/** `![alt](url)` — the `!` already means image, so no extension check. */
const MARKDOWN_IMAGE = /!\[[^\]]*\]\([^)]*\)/g;
/** Wiki embeds can point at notes, PDFs or audio, so the extension decides. */
const IMAGE_EXTENSION = /\.(?:png|jpe?g|gif|svg|webp|bmp|avif|tiff?)$/i;
/** Obsidian's own size grammar: a width, or a width and a height. */
const SIZE = /^\d+(?:x\d+)?$/;
/** One emphasis wrapping nothing but text: the caption someone wrote by hand. */
const EMPHASIS_LINE = /^\s*(?:\*([^*\n]+)\*|_([^_\n]+)_)\s*$/;
/** What a row may hold before its first cell: whitespace, quotes, cell pipes. */
const ROW_PREFIX = /^[\s>|]*$/;

/**
 * A row splits on its pipes, so a size written in one needs `\|`. Stricter
 * than `isTableLine`, which any pipe at all satisfies.
 */
function isRowLine(line: string): boolean {
  const at = line.indexOf("|");
  return at >= 0 && ROW_PREFIX.test(line.slice(0, at));
}

/** The pipe as this line needs it. */
function pipe(line: string): string {
  return isRowLine(line) ? "\\|" : "|";
}

interface Embed {
  readonly from: number;
  readonly to: number;
  readonly wiki: boolean;
}

function embedsIn(line: string): Embed[] {
  const out: Embed[] = [];
  for (const match of line.matchAll(WIKI_EMBED))
    out.push({
      from: match.index ?? 0,
      to: (match.index ?? 0) + match[0].length,
      wiki: true,
    });
  for (const match of line.matchAll(MARKDOWN_IMAGE))
    out.push({
      from: match.index ?? 0,
      to: (match.index ?? 0) + match[0].length,
      wiki: false,
    });
  return out.sort((a, b) => a.from - b.from);
}

/** A wiki link's file part: what is left of `#` and `^`. */
function fileOf(target: string): string {
  return (target.split("#")[0] ?? "").split("^")[0]?.trim() ?? "";
}

/** True when the line holds a picture, so the Picture commands light up. */
export function isImageLine(line: string): boolean {
  for (const embed of embedsIn(line)) {
    if (!embed.wiki) return true;
    const inner = line.slice(embed.from + 3, embed.to - 2);
    const at = inner.indexOf(pipe(line));
    if (IMAGE_EXTENSION.test(fileOf(at < 0 ? inner : inner.slice(0, at))))
      return true;
  }
  return false;
}

/** The embed the caret sits in, else the one after it, else the last one. */
function caretEmbed(embeds: readonly Embed[], column: number): Embed | null {
  return (
    embeds.find((embed) => column <= embed.to) ??
    embeds[embeds.length - 1] ??
    null
  );
}

/** `null` clears the size; `string` sets it. Returns `null` to leave the line. */
function sizedEmbed(
  line: string,
  embed: Embed,
  width: string | null,
): string | null {
  const text = line.slice(embed.from, embed.to);
  // Inside a table cell the pipe has to be escaped, or it splits the row.
  const marker = pipe(line);

  if (embed.wiki) {
    const inner = text.slice(3, -2);
    const at = inner.indexOf(marker);
    const target = at < 0 ? inner : inner.slice(0, at);
    const size = at < 0 ? null : inner.slice(at + marker.length);
    if (!IMAGE_EXTENSION.test(fileOf(target))) return null;
    // A pipe segment that is not a size is an alias: leave it alone.
    if (size !== null && !SIZE.test(size)) return null;
    return `![[${width === null ? target : `${target}${marker}${width}`}]]`;
  }

  const parsed = /^!\[([^\]]*)\]\((.*)\)$/.exec(text);
  const alt = parsed?.[1] ?? "";
  const url = parsed?.[2] ?? "";
  // A title after the URL leaves nowhere to put the size.
  if (!parsed || url.includes('"')) return null;
  const at = url.indexOf(marker);
  const base = at < 0 ? url : url.slice(0, at);
  const size = at < 0 ? null : url.slice(at + marker.length);
  if (size !== null && !SIZE.test(size)) return null;
  return `![${alt}](${width === null ? base : `${base}${marker}${width}`})`;
}

/**
 * Sets or clears the width of one picture. Extra cursors are ignored: a size
 * belongs to a single embed, so several at once has no single meaning.
 */
export function setImageSize(
  doc: string,
  ranges: readonly Range[],
  width: string | null,
): Plan {
  const range = ranges[0];
  if (!range) return NO_CHANGE;
  const lines = new Lines(doc);
  const line = lines.lineOf(range.from);
  const text = lines.at(line);
  const embed = caretEmbed(embedsIn(text), range.from - lines.start(line));
  if (!embed) return NO_CHANGE;

  const next = sizedEmbed(text, embed, width);
  if (next === null) return NO_CHANGE;
  return {
    changes: [
      {
        from: lines.start(line) + embed.from,
        to: lines.start(line) + embed.to,
        text: next,
      },
    ],
  };
}

/** A caption is an emphasis line of its own, right under the picture. */
function captionBody(line: string): Range | null {
  const match = EMPHASIS_LINE.exec(line);
  if (!match) return null;
  const body = match[1] ?? match[2] ?? "";
  const at = line.indexOf(body);
  return at < 0 ? null : { from: at, to: at + body.length };
}

/**
 * Writes `*placeholder*` under the picture and selects it, so typing replaces
 * it. A caption already there is selected instead of duplicated.
 */
export function insertImageCaption(
  doc: string,
  ranges: readonly Range[],
  placeholder: string,
): Plan {
  const range = ranges[0];
  if (!range) return NO_CHANGE;
  const lines = new Lines(doc);
  const line = lines.lineOf(range.from);
  if (!isImageLine(lines.at(line))) return NO_CHANGE;

  // Written at the picture's own line end, so a centred picture keeps its
  // caption inside the wrapping `<div>`.
  const next = line + 1;
  if (next < lines.count) {
    const existing = captionBody(lines.at(next));
    if (existing) {
      const from = lines.start(next) + existing.from;
      const to = lines.start(next) + existing.to;
      // The text is rewritten unchanged: a plan with no change cannot select.
      return {
        changes: [{ from, to, text: doc.slice(from, to) }],
        select: { from, to },
      };
    }
  }

  const at = lines.end(line);
  const from = at + "\n*".length;
  return {
    changes: [{ from: at, to: at, text: `\n*${placeholder}*` }],
    select: { from, to: from + placeholder.length },
  };
}
