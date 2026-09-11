#!/usr/bin/env node
/**
 * Renders the GitHub social preview card — the 1280×640 image GitHub shows
 * when this repository is linked (Settings → General → Social preview).
 *
 *   node scripts/social-preview.mjs
 *
 * The card is an SVG (docs/img/social-preview.svg) built in memory with the
 * README screenshot embedded, then rasterized to docs/img/social-preview.png.
 * Only the copy below and the screenshot path are hard-coded; everything else
 * is derived.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHOT_PATH = join(ROOT, "docs/img/light.png");
const SVG_OUT = join(ROOT, "docs/img/social-preview.svg");
const PNG_OUT = join(ROOT, "docs/img/social-preview.png");

const COPY = {
  badge: "Obsidian Community Plugin",
  title: "Awesome Format Bar",
  lines: [
    "A Word-style formatting toolbar for Obsidian's Markdown editor.",
    "Bold, headings, tables, callouts and emoji — without typing syntax.",
  ],
};

const W = 1280;
const H = 640;
const BG = { from: "#1b1032", to: "#2a1a4f" };
const ACCENT = "#a78bfa";
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

// The screenshot is cropped to its window chrome, ribbon, floating bar and
// sample table — the rest of the editor is empty. The cut lands in the blank
// line under the table, never mid-row.
const shot = { w: 1576, h: 867, crop: 560 };
const box = { w: 980, bottom: 44 };
box.h = Math.round((box.w * shot.crop) / shot.w);
box.x = (W - box.w) / 2;
box.y = H - box.bottom - box.h;

const badge = { y: 44, h: 30, w: 300, size: 13 };
const title = { y: 156, size: 56 };
const lines = { y: 198, lh: 26, size: 20 };

const shotData = readFileSync(SHOT_PATH).toString("base64");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${BG.from}"/>
      <stop offset="1" stop-color="${BG.to}"/>
    </linearGradient>
    <radialGradient id="glowTop" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#7c3aed" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowSide" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <filter id="shotShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="26" flood-color="#0a0518" flood-opacity="0.65"/>
    </filter>
    <clipPath id="shotClip">
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="14"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="${W / 2}" cy="150" rx="700" ry="380" fill="url(#glowTop)"/>
  <ellipse cx="1180" cy="620" rx="460" ry="300" fill="url(#glowSide)"/>

  <g font-family="${FONT}" text-anchor="middle">
    <rect x="${(W - badge.w) / 2}" y="${badge.y}" width="${badge.w}" height="${badge.h}" rx="${badge.h / 2}"
          fill="${ACCENT}" fill-opacity="0.12" stroke="${ACCENT}" stroke-opacity="0.45"/>
    <text x="${W / 2}" y="${badge.y + badge.h / 2 + 5}" fill="#cfc2f5" font-size="${badge.size}"
          font-weight="600" letter-spacing="2">${COPY.badge.toUpperCase()}</text>

    <text x="${W / 2}" y="${title.y}" fill="#ffffff" font-size="${title.size}" font-weight="700"
          letter-spacing="-1">${COPY.title}</text>

    ${COPY.lines
      .map(
        (line, i) =>
          `<text x="${W / 2}" y="${lines.y + i * lines.lh}" fill="#bdb3d6" font-size="${lines.size}">${line}</text>`,
      )
      .join("\n    ")}
  </g>

  <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="14" fill="#ffffff"
        filter="url(#shotShadow)"/>
  <g clip-path="url(#shotClip)">
    <svg x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" viewBox="0 0 ${shot.w} ${shot.crop}">
      <image xlink:href="data:image/png;base64,${shotData}" href="data:image/png;base64,${shotData}"
             x="0" y="0" width="${shot.w}" height="${shot.h}"/>
    </svg>
  </g>
  <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="14" fill="none"
        stroke="#ffffff" stroke-opacity="0.16"/>
</svg>
`;

writeFileSync(SVG_OUT, svg);
console.log(`svg  ${SVG_OUT}`);

const renderers = [
  ["rsvg-convert", ["-w", String(W), "-h", String(H), "-o", PNG_OUT, SVG_OUT]],
  [
    "magick",
    ["-background", "none", SVG_OUT, "-resize", `${W}x${H}!`, PNG_OUT],
  ],
  [
    "convert",
    ["-background", "none", SVG_OUT, "-resize", `${W}x${H}!`, PNG_OUT],
  ],
];

for (const [cmd, args] of renderers) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    const kb = (readFileSync(PNG_OUT).length / 1024).toFixed(0);
    console.log(`png  ${PNG_OUT}  ${W}×${H}  ${kb} KB  (via ${cmd})`);
    process.exit(0);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

throw new Error(
  "No rasteriser found: install librsvg (`brew install librsvg`) or ImageMagick.",
);
