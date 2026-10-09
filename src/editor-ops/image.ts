import { NO_CHANGE, order, type Change, type Plan, type Range } from "./plan";
import { fenceMask, Lines } from "./lines";

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

interface Parts {
  /** `![[target]]` / `![](url)`: what the picture points at. */
  readonly target: string;
  /** The alias after the first pipe, or the alt text inside `[]`. */
  readonly alt: string;
  readonly size: string | null;
}

/**
 * Splits a wiki embed's inner text. Obsidian allows `![[a.png|alias|300]]` and
 * reads the width from the **last** pipe, so a written alias no longer hides
 * the size — and a size that is not last is not a size at all.
 */
function wikiParts(inner: string, marker: string): Parts {
  const segments = inner.split(marker);
  const target = segments[0] ?? "";
  const rest = segments.slice(1);
  const last = rest[rest.length - 1];
  if (last !== undefined && SIZE.test(last))
    return { target, alt: rest.slice(0, -1).join(marker), size: last };
  return { target, alt: rest.join(marker), size: null };
}

function wikiEmbed(parts: Parts, marker: string): string {
  const segments = [parts.target];
  if (parts.alt !== "") segments.push(parts.alt);
  if (parts.size !== null) segments.push(parts.size);
  return `![[${segments.join(marker)}]]`;
}

const MARKDOWN_PARTS = /^!\[([^\]]*)\]\((.*)\)$/;

/**
 * A Markdown image carries its width in the **alt text**, not the URL:
 * `![alt|300](url)`, or `![300](url)` with no alt text. Obsidian reads the size
 * from the last pipe there, and with no pipe at all a bare width still counts.
 */
function linkParts(text: string, marker: string): Parts | null {
  const parsed = MARKDOWN_PARTS.exec(text);
  if (!parsed) return null;
  const written = parsed[1] ?? "";
  const url = parsed[2] ?? "";

  const at = written.lastIndexOf(marker);
  const tail = at < 0 ? written : written.slice(at + marker.length);
  const sized = SIZE.test(tail);

  return {
    target: url,
    alt: sized ? (at < 0 ? "" : written.slice(0, at)) : written,
    size: sized ? tail : null,
  };
}

function linkEmbed(parts: Parts, marker: string): string {
  const alt = parts.alt === "" ? [] : [parts.alt];
  if (parts.size !== null) alt.push(parts.size);
  return `![${alt.join(marker)}](${parts.target})`;
}

/** One embed of `line`, parsed; `null` when it is not a picture. */
function partsIn(line: string, embed: Embed, marker: string): Parts | null {
  const text = line.slice(embed.from, embed.to);
  if (embed.wiki) {
    const parts = wikiParts(text.slice(3, -2), marker);
    // A wiki embed can point at a note, a PDF or a sound: only a picture has one.
    return IMAGE_EXTENSION.test(fileOf(parts.target)) ? parts : null;
  }
  return linkParts(text, marker);
}

/** The picture the caret is on: where its text is, and what it carries. */
interface Picture {
  readonly start: number;
  readonly end: number;
  readonly wiki: boolean;
  readonly marker: string;
  readonly parts: Parts;
}

/** `null` outside a picture, or on a wiki embed that is not one. */
function caretPicture(doc: string, ranges: readonly Range[]): Picture | null {
  const range = ranges[0];
  if (!range) return null;
  const lines = new Lines(doc);
  const line = lines.lineOf(range.from);
  const text = lines.at(line);
  const embed = caretEmbed(embedsIn(text), range.from - lines.start(line));
  if (!embed) return null;
  const marker = pipe(text);
  const parts = partsIn(text, embed, marker);
  if (!parts) return null;
  return {
    start: lines.start(line) + embed.from,
    end: lines.start(line) + embed.to,
    wiki: embed.wiki,
    parts,
    marker,
  };
}

/** The picture's own span, rewritten in the grammar it is already written in. */
function rewrite(picture: Picture, parts: Parts): Plan {
  const { start, end, wiki, marker } = picture;
  return {
    changes: [
      {
        from: start,
        to: end,
        // Inside a table cell the pipe has to be escaped, or it splits the row.
        text: wiki ? wikiEmbed(parts, marker) : linkEmbed(parts, marker),
      },
    ],
  };
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
  const picture = caretPicture(doc, ranges);
  return picture
    ? rewrite(picture, { ...picture.parts, size: width })
    : NO_CHANGE;
}

/**
 * The same width on every picture in the note. Unlike the single-picture
 * commands it ignores the caret, so it runs from anywhere in the note.
 * Fenced code is skipped: a note about Markdown may well show an embed.
 */
export function setAllImageSizes(doc: string, width: string | null): Plan {
  const lines = new Lines(doc);
  const fenced = fenceMask(lines);
  const changes: Change[] = [];
  for (let line = 0; line < lines.count; line++) {
    const text = lines.at(line);
    if (fenced[line]) continue;
    const marker = pipe(text);
    for (const embed of embedsIn(text)) {
      const parts = partsIn(text, embed, marker);
      if (!parts) continue;
      const source = text.slice(embed.from, embed.to);
      const next = embed.wiki
        ? wikiEmbed({ ...parts, size: width }, marker)
        : linkEmbed({ ...parts, size: width }, marker);
      if (next === source) continue;
      changes.push({
        from: lines.start(line) + embed.from,
        to: lines.start(line) + embed.to,
        text: next,
      });
    }
  }
  return changes.length === 0 ? NO_CHANGE : { changes: order(changes) };
}

/**
 * Writes the alt text of one picture and selects it, so typing replaces it.
 * Alt text already there is selected instead of duplicated.
 */
export function insertImageAlt(
  doc: string,
  ranges: readonly Range[],
  placeholder: string,
): Plan {
  const picture = caretPicture(doc, ranges);
  if (!picture) return NO_CHANGE;
  const { parts, wiki, marker } = picture;
  const alt = parts.alt === "" ? placeholder : parts.alt;
  // Where the alt text starts: past `![[target|` in a wiki embed, past `![` in a
  // Markdown image, where the size comes after the alt rather than before it.
  const from =
    picture.start + (wiki ? `![[${parts.target}${marker}`.length : "![".length);
  return {
    ...rewrite(picture, { ...parts, alt }),
    select: { from, to: from + alt.length },
  };
}

/** Word's Reset Picture: drops the size and the alt text, keeps the picture. */
export function resetImage(doc: string, ranges: readonly Range[]): Plan {
  const picture = caretPicture(doc, ranges);
  if (!picture) return NO_CHANGE;
  if (picture.parts.alt === "" && picture.parts.size === null) return NO_CHANGE;
  return rewrite(picture, {
    target: picture.parts.target,
    alt: "",
    size: null,
  });
}

/** A URL has no place inside `![[]]`, so those stay Markdown links. */
const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Swaps one picture between the two syntaxes. A space has to change sides
 * with it: `%20` in a URL, a plain space inside a wiki embed.
 */
export function convertImageSyntax(
  doc: string,
  ranges: readonly Range[],
): Plan {
  const picture = caretPicture(doc, ranges);
  if (!picture) return NO_CHANGE;
  const { parts, wiki, marker, start, end } = picture;
  if (!wiki && ABSOLUTE_URL.test(parts.target)) return NO_CHANGE;
  return {
    changes: [
      {
        from: start,
        to: end,
        text: (wiki ? linkEmbed : wikiEmbed)(
          {
            ...parts,
            target: wiki
              ? parts.target.replace(/ /g, "%20")
              : parts.target.replace(/%20/g, " "),
          },
          marker,
        ),
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
