# Awesome Format Bar — a Word-style Markdown formatting toolbar for Obsidian

> Bold, italic, underline, highlight, font color, headings, lists, tables, callouts and emoji — **by clicking buttons instead of typing Markdown syntax**.

[![Obsidian](https://img.shields.io/badge/Obsidian-1.13.7%2B-7C3AED)](https://obsidian.md)
[![GitHub release](https://img.shields.io/github/v/release/AwesomeDog/obsidian-awesome-format-bar)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/releases/latest)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&query=%24%5B%22awesome-format-bar%22%5D.downloads&label=downloads&color=573E7A)](https://obsidian.md/plugins?id=awesome-format-bar)
[![Commands](https://img.shields.io/badge/commands-100+-informational)](#full-command-reference)
[![i18n](https://img.shields.io/badge/languages-8-success)]()
[![Stars](https://img.shields.io/github/stars/AwesomeDog/obsidian-awesome-format-bar?style=social)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/stargazers)

🌍 Localized in **English, 简体中文, 繁體中文, 日本語, 한국어, Deutsch, Français and Español** (matches your Obsidian language).

**Awesome Format Bar** is a **formatting toolbar (ribbon) plugin for [Obsidian](https://obsidian.md)**. It overlays a familiar, Word-like **editor toolbar** on top of your notes, so everyday formatting is one click away — while your vault stays 100% plain text.

Everything the toolbar writes is **standard Markdown**, **Obsidian-flavoured Markdown**, or — where Markdown simply has no syntax (underline, superscript, subscript, text alignment, text color) — a small amount of **inline HTML** that Obsidian renders natively.

*Looking for an Obsidian **toolbar plugin**, **format bar**, **editor toolbar**, **rich-text / WYSIWYG-style editing bar**, **Markdown formatting buttons**, **emoji picker**, **table editor**, or a **Microsoft Word-like ribbon for Obsidian**? That's this plugin.*

<p align="center">
  <img src="docs/img/light.png" alt="Awesome Format Bar for Obsidian — Word-style Markdown formatting toolbar with Bold, Italic, Underline, Highlight, Font Color, Headings, Lists and Tables (light theme)">
</p>

---

## Table of contents

- [Why a formatting toolbar in Obsidian?](#why-a-formatting-toolbar-in-obsidian)
- [At a glance](#at-a-glance)
- [Features](#features)
- [Full command reference](#full-command-reference)
- [Installation](#installation)
- [Getting started](#getting-started)
- [Settings](#settings)
- [Compatibility](#compatibility)
- [FAQ](#faq)
- [Development](#development)
- [Release](#release)
- [Keywords](#keywords)

---

## Why a formatting toolbar in Obsidian?

Obsidian is fast **if** you already speak Markdown. For everyone else — students, writers coming from Word or Google Docs, teams onboarding new note-takers — the syntax is a wall.

- **No syntax to memorise.** Select text, click **Bold**. That's it.
- **Word terminology you already know.** Home / Insert / View / Table tabs, "Clear Formatting", "Change Case", "Navigation Pane".
- **Discover what Obsidian can do.** Callouts, block references, embeds, math blocks and tags all get a button — features many users never find in the syntax.
- **Do what Markdown can't.** Underline, superscript, subscript, paragraph alignment and text/highlight colors, written as clean inline HTML.
- **Plain text forever.** No proprietary format, no database, no lock-in — your notes are still just `.md` files.
- **Offline & private.** No network calls, no accounts, no telemetry. The ~2,150-entry emoji library ships inside the plugin.
- **Keyboard-friendly too.** Switch every toolbar position off and the interface disappears completely — all 105 palette-registered commands stay available and can be bound to your own hotkeys.

## At a glance

| | |
| --- | --- |
| **Toolbar positions** | Top ribbon, floating bar above the selection, fixed bottom bar — combine freely |
| **Commands** | **113** built-in, **105** available in the command palette for custom hotkeys |
| **Tabs** | Home · Insert · View · Table · Utilities · **Pinned** |
| **Callouts** | All 12 Obsidian callout types in one drop-down |
| **Emoji & symbols** | ~2,150 emoji, kaomoji and symbols, fully offline |
| **Table editing** | Insert/delete/move rows & columns, align, sort, re-format, paste as table |
| **Custom buttons** | Pin *any* command — core, this plugin's, or another plugin's |
| **Setup required** | None. Theme-aware, zero configuration |
| **Requires** | Obsidian **1.13.7+** |

---

## Features

### 🧭 Three toolbar positions, freely combined

- **Ribbon (Top)** — the full, tabbed toolbar pinned above the editor. *Default.*
- **Following** — a compact bar that floats above your current selection, like the selection toolbar in Word or Google Docs.
- **Fixed** — a compact bar pinned to the bottom of the editor.

Each position is toggled independently, so you can run just the floating bar, just the ribbon, or all three.

### 🅰️ 113 formatting commands in a familiar layout

Bold, italic, underline, strikethrough, inline code, inline math, highlight (with color), font color, clear formatting, change case, headings 1–6, bullet / numbered / task lists, quotes, indentation, horizontal rules, undo/redo, find & replace, paragraph alignment — grouped exactly where a Word user expects them.

### 💬 Callout picker — all 12 Obsidian callout types

One **Callout** button opens a drop-down with `note`, `abstract`, `info`, `tip`, `success`, `question`, `warning`, `failure`, `danger`, `bug`, `example` and `quote`. No more looking up `> [!tip]` syntax.

### 😀 Offline emoji, kaomoji & symbol picker (~2,150 entries)

A searchable **Emoji & Symbols** panel with three sources — emoji, kaomoji and typographic symbols — bundled with the plugin. Inserts at the caret or over the selection as a single undo step, keeps a *Frequently used* group per source, and stays open for inserting several characters in a row.

### 📊 Markdown table editor

Insert and delete rows/columns, move rows and columns, align columns left/center/right, sort rows, re-format (pretty-print) tables — plus **Paste as Table**, which turns tab- or comma-separated clipboard text (straight out of Excel, Numbers or Google Sheets) into an aligned Markdown table.

### 📌 Pin any command — including other plugins' commands

The **Pinned** tab turns the toolbar into your own launcher: pick any command from the command palette (Obsidian core, another community plugin, or this plugin), choose an icon, drag to reorder. If the source plugin is disabled, the button simply greys out — your pin is kept.

### 👁️ Reading, focus and outlining tools

**Show Whitespace** (dots for spaces, arrows for tabs, orange markers for NBSP / ideographic / EN & EM spaces), **Show Line Numbers**, **Readable Line Length**, **Navigation Pane** (Obsidian's Outline), **Zoom In / Out / 100%**, **Split Right / Down**, **Collapse / Expand (All)**, **Focus Mode** (collapse both sidebars) and **Zen Mode** (true fullscreen).

### 📑 Table of contents in one click

**Table of Contents** writes your note's outline after the paragraph at the caret: a bold `**Table of Contents**` title, then one nested `- [[#Heading|Heading]]` link per heading. Headings inside a code fence or quoted into a callout are ignored. It's a snapshot, not a live field — re-run it after editing and delete the old one.

### 🧹 Line & list utilities

**Merge Lines**, **Split Lines** (at the punctuation the selection uses most), **Reverse Lines** — none of which cross a blank line or a code fence — plus **Sort List** (level by level, children and bodies preserved, ordered items renumbered) and **Sort Headings** (reorders the outline and carries every section's body along).

### 🎨 Zero configuration, theme-aware

Fixed, opinionated layout that inherits your active Obsidian theme in light and dark mode. The only thing to arrange is your Pinned tab.

---

## Full command reference

105 of the 113 commands are registered in the **command palette**, so you can assign your own keyboard shortcuts. (Drop-down containers and the Emoji & Symbols panel are toolbar-only.)

### Home

- **Clipboard** — Paste, Cut, Copy, Paste as Plain Text
- **Font** — Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Inline Code, Inline Math, Highlight, Highlight Color, Font Color, Clear Formatting, Change Case
- **Paragraph** — Bullet / Numbered / Task List, Quote, Decrease / Increase Indent, Renumber List, Sort Lines, Swap Line Up / Down, Align Left / Center / Right / Justify, Horizontal Rule
- **Styles** — Heading 1–6, Remove Heading
- **Editing** — Undo, Redo, Find and Replace

### Insert

Internal Link, External Link, Embed, Tag, Block Reference, **Callout ▼** (Note, Abstract, Info, Tip, Success, Question, Warning, Failure, Danger, Bug, Example, Quote), Code Block, Math Block, Table, Convert Text to Table, Comment, Attach File, **Emoji & Symbols**, Date and Time, **Table of Contents**, Footnote.

### View

- **Show** — Show Whitespace, Show Line Numbers, Readable Line Length, Navigation Pane (Obsidian's Outline)
- **Zoom** — Zoom In, Zoom Out, 100%
- **Window** — Split Right, Split Down
- **Outlining** — Collapse, Expand, Collapse All, Expand All
- **Immersive** — Focus Mode, Zen Mode

### Table

Available whenever the cursor is inside a table: Delete Rows or Columns, Insert Rows Above / Below, Insert Columns Left / Right, Move Row Up / Down, Move Column Left / Right, Format Tables, Align Column Left / Center / Right, Sort Rows, **Convert to Text**.
**Convert to Text** writes the table out as tab-separated lines — the exact inverse of **Convert Text to Table** (Insert · Blocks), which turns tab- or comma-separated text into an aligned Markdown table. **Paste as Table** does the same with the clipboard and works anywhere.

### Utilities

**Merge Lines** joins a run of lines into one; **Split Lines** breaks them at the punctuation the selection uses most; **Reverse Lines** flips the order of each run. None of the three crosses a blank line or a code fence.
**Sort List** sorts a list level by level — an item keeps its own body and its own children, and ordered items come out renumbered. **Sort Headings** reorders each level of the note's outline and carries every section's body along with it.

### Pinned

Your own commands, with your own icons. See [Getting started](#getting-started).

### Emoji & Symbols panel

| Source  | Entries (approx.) | Example groups                                                   |
| ------- | ----------------- | ---------------------------------------------------------------- |
| Emoji   | ~1,900            | Smileys & People, Animals & Nature, Food & Drink, Objects, Flags |
| Kaomoji | ~70               | Emotion, Animal, Behavior, People, Holiday                       |
| Symbols | ~200              | Arrows, Math, Typographic, Currency, Enclosed, Dingbats          |

All data ships inside the plugin, so the picker works completely offline.

---

## Installation

Requires Obsidian **1.13.7 or later**.

**From Community Plugins (recommended)**
Settings → **Community plugins** → **Browse** → search for **“Awesome Format Bar”** → **Install** → **Enable**.

**With BRAT (beta versions)**
Install [BRAT](https://github.com/TfTHacker/obsidian42-brat), run *BRAT: Add a beta plugin*, and paste this repository's URL.

**Manually**
Download `main.js`, `manifest.json` and `styles.css` from a release into `<vault>/.obsidian/plugins/awesome-format-bar/`, then enable the plugin in Settings → Community plugins.

## Getting started

1. Open **Settings → Awesome Format Bar** and toggle the positions you want: **Top**, **Following**, **Fixed**.
2. The **Ribbon (Top)** has six tabs; the last one, **Pinned**, holds the commands you pin yourself. While it is empty it shows a hint pointing back to Settings.
3. The **compact bars** (Following / Fixed) carry a fixed subset of commands; anything that doesn't fit collapses into the `⋯` overflow menu.
4. Pin commands under **Settings → Pinned**: add (pick a command, then an icon), change the icon, drag to reorder, or delete. Pinned commands behave exactly like their command-palette counterparts.
5. Prefer the keyboard? Turn **all three position toggles off** and the toolbar disappears from the interface entirely — the plugin then adds nothing to your screen, while all **105 palette-registered commands** keep working and can be bound to your own hotkeys in **Settings → Hotkeys**. In other words: you can use it as a pure command/hotkey pack and never click a button.

## Settings

| Section     | Contents                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Toolbar** | Independent toggles for Top / Following / Fixed                                                                          |
| **Pinned**  | Your pinned commands — add, re-icon, reorder, delete                                                                      |
| **Table**   | Enter moves to the next row; pad cell width with spaces; sort on header click in Reading view (never modifies the file)   |

## Compatibility

- Obsidian **1.13.7+**
- Works with the Markdown editor and adapts to your active theme in both light and dark mode.
- No network access, no accounts, no telemetry — everything runs locally.
- The release is exactly three files: `main.js`, `manifest.json`, `styles.css`.

---

## FAQ

**Does this turn Obsidian into a WYSIWYG or rich-text editor?**
No — and that's the point. It's a **toolbar** on top of Obsidian's own editor. Your files remain plain Markdown.

**Do I have to learn Markdown syntax to use Obsidian now?**
No. Bold, headings, lists, links, tables, callouts, code blocks and math are all buttons.

**What exactly gets written into my notes?**
Standard Markdown and Obsidian-flavoured Markdown. Only where Markdown has no syntax — underline, superscript, subscript, paragraph alignment, text and highlight colors — does the plugin emit small, standard inline HTML tags, which Obsidian renders natively.

**Can I keep using my keyboard shortcuts?**
Yes. 105 of the 113 commands appear in the command palette and can be bound to any hotkey.

**I'm a keyboard person — can I hide the toolbar completely?**
Yes, and nothing is lost by doing it. Switch off all three positions (**Top / Following / Fixed**) in **Settings → Awesome Format Bar** and the plugin leaves zero footprint on the screen: no ribbon, no floating bar, no bottom bar. Every one of the **101 palette-registered commands** still runs, from the command palette or from a hotkey you assign in **Settings → Hotkeys** — including commands Obsidian has no built-in shortcut for, such as font color, highlight color, change case, callouts, table sorting and the line utilities. Think of it as an optional keyboard-only layer you can switch on whenever the mouse starts feeling slow.

**Can I add buttons for commands from other plugins?**
Yes — that's the **Pinned** tab. Pin any command from the palette and choose an icon. If the owning plugin is disabled, the button greys out and the pin is preserved.

**Does the emoji picker need an internet connection?**
No. All ~2,150 emoji, kaomoji and symbols are bundled with the plugin.

**Does sorting a table in Reading view change my file?**
No. Reading-view header-click sorting is display-only and never modifies the note.

**Can I hide the toolbar when I want a clean screen?**
Yes — toggle any position off in settings, or all three to hide it entirely (see the keyboard question above for what still works).

**Is it configurable?**
Deliberately minimal: the layout is fixed and theme-aware so it always looks native. The Pinned tab is yours to arrange.

---

## Development

```shell
npm install        # install dependencies
npm run dev        # build in watch mode
npm run build      # typecheck + test + production build
npm run test       # run unit tests
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run deploy -- /path/to/vault   # copy main.js, manifest.json, styles.css into a vault
```

The release consists of exactly three files: `main.js`, `manifest.json` and `styles.css`.

## Release

```shell
npm version patch                    # bump package.json, manifest.json, versions.json; commit and tag
git push origin main --follow-tags   # push the commit and the tag
```

`npm version` requires a clean working tree. The tag carries no `v` prefix — it has to equal the `version` in `manifest.json`, or the release workflow rejects it.

Pushing the tag runs `.github/workflows/release.yml`, which builds the plugin and opens a **draft** release with `main.js`, `manifest.json` and `styles.css` attached. Publish the draft to make the version available.

---

## Keywords

Obsidian toolbar plugin · Obsidian formatting toolbar · Obsidian format bar · Markdown toolbar · Markdown formatting buttons · Word-like ribbon for Obsidian · rich text toolbar · WYSIWYG-style editing bar · editor toolbar · floating selection toolbar · text color and highlight in Obsidian · underline / superscript / subscript in Markdown · text alignment · callout picker · emoji picker · kaomoji · symbol picker · Markdown table editor · sort table · paste as table · table of contents generator · pin commands · beginner-friendly Obsidian · no-syntax Markdown editing

**其他语言 / Other languages:**
Obsidian 工具栏插件、格式栏、富文本工具栏、Markdown 快捷按钮、表情符号选择器、表格编辑 ·
Obsidian 工具列外掛、格式列 ·
Obsidian ツールバー・書式設定バー・絵文字ピッカー ·
Obsidian 툴바 · 서식 도구 모음 ·
Obsidian Symbolleiste / Formatierungsleiste ·
Barre d'outils / barre de mise en forme pour Obsidian ·
Barra de herramientas / barra de formato para Obsidian
