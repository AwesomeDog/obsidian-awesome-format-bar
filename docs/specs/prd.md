# Awesome Format Bar — Product Requirements

> An Obsidian plugin that adds a Word-like toolbar to the editor, so users who don't memorize shortcuts or Markdown syntax can still apply everyday formatting.

---

## 1. Overview

**Positioning:** turn Markdown editing from *remembering syntax* into *clicking a button*.

Obsidian is efficient for people fluent in Markdown, but newcomers face a syntax barrier. The plugin overlays a visual toolbar on the editor that covers high-frequency formatting while keeping notes plain text: everything it produces is standard Markdown, Obsidian Markdown, or — where Markdown falls short — inline HTML.

Markdown also has no syntax for the characters people actually want — an emoji, an arrow, an en dash. So the plugin carries its own: **Emoji & Symbols** is one button that opens a searchable panel of about 2,150 entries, bundled with the plugin and available offline.

---

## 2. Users and Scenarios

| User | Scenario | Core need | Typical flow |
|---|---|---|---|
| Newcomers from Word / Notion | Everyday note-taking | Format without learning Markdown | Select a phrase, click **Bold** |
| Heavy note-takers (meetings, journals) | Lots of lists and formatting | Indent, renumber, quick bold and highlight | Fix a broken list with **Renumber List**; un-wrap a pasted paragraph with **Merge Lines** |
| Touch-device users | Editing on a phone | A fixed toolbar within thumb reach | Format from the Fixed position |
| Journal and diary writers | Emoji, kaomoji and symbols in notes | Pick characters without leaving the editor | Drop several emoji in from **Emoji & Symbols** |

---

## 3. Design Principles

1. **Word terminology** — reuse existing muscle memory.
2. **Only what the Markdown ecosystem can express** — standard Markdown first, then Obsidian syntax, then inline HTML (Underline, Superscript, Subscript, alignment, Font Color, Highlight Color). No Word concepts Markdown lacks.
3. **Forward, don't rebuild** — where Obsidian already provides a command (Insert Table, Internal Link, Clear Formatting), the toolbar forwards to it.
4. **Minimal UI** — follow the active theme; icons from Obsidian's built-in Lucide set (§7).
5. **Fixed layout, zero configuration** — except the **Pinned** tab, because only the user knows which commands deserve a toolbar spot.
6. **Self-contained** — the character data ships inside the plugin. No network calls, no accounts, nothing to sync; the output is plain Unicode that any Markdown reader renders.

---

## 4. Toolbar

### Positions

The three positions are not mutually exclusive: each can be toggled independently and combined freely, and every enabled position renders its own instance sharing the same commands and availability states.

| Position | Layout | Shown |
|---|---|---|
| **Top** | Ribbon | Always, pinned above the editor; highest information density |
| **Following** | Compact | Floats above the selection when text is selected; never covers it |
| **Fixed** | Compact | Always, pinned to the bottom of the editor |

Defaults: Top only. Turning every position off keeps it off.

### Layouts

**Ribbon** — six tabs (Home, Insert, View, Table, Utilities, Pinned), each split into groups separated by a divider, with the group name below the buttons. Pinned is always last, has no group name, and stays visible with a hint when empty.

**Compact**

```
│ B I U S H │ • 1. ☑ ” ⇥ ⇤ │ ↶ ↷ │ ⋯ │
```

A fixed built-in subset of commands, grouped by dividers. Buttons that don't fit collapse into the overflow menu (`⋯`), which also carries the rest of the command table: the folded buttons first under *Hidden by width*, then every Ribbon group under a `Tab · Group` heading, then Pinned — so anything the bar cannot show is still one click away.

---

## 5. Commands

**106 built-in commands** across 5 tabs and 19 groups, plus the Pinned tab. Seven live inside drop-down buttons and one opens the Emoji & Symbols panel; the other 98 are registered in the command palette, so users can assign their own shortcuts.

### Tab 1 · Home

- **Clipboard** — Paste, Cut, Copy, Paste as Plain Text
- **Font** — Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Inline Code, Inline Math, Highlight, Highlight Color, Font Color, Clear Formatting, Change Case
- **Paragraph** — Bullet List, Numbered List, Task List, Quote, Decrease Indent, Increase Indent, Renumber List, Sort Lines, Swap Line Up, Swap Line Down, Align Left / Center / Right / Justify, Horizontal Rule
- **Styles** — Heading 1–6, Remove Heading
- **Editing** — Undo, Redo, Find and Replace

### Tab 2 · Insert

- **Links** — Internal Link, External Link, Embed, Tag, Block Reference
- **Blocks** — Callout ▼ (Note Callout, Abstract Callout, Info Callout, Tip Callout, Success Callout, Question Callout, Warning Callout, Failure Callout, Danger Callout, Bug Callout, Example Callout, Quote Callout), Code Block, Math Block, Table, Comment
- **Media & Symbols** — Attach File, Emoji & Symbols, Date and Time

### Tab 3 · View

Group order follows Word's own View tab.

- **Immersive** — **Focus Mode** collapses both sidebars. **Zen Mode** puts the note itself into real fullscreen. Word keeps Focus here too; its other half there, Immersive Reader, has no Markdown equivalent.
- **Show** — **Show Whitespace** marks every space with a dot and every tab with an arrow, and draws any space that isn't a plain one — NBSP, ideographic, EN/EM — in orange, so the wrong space is visible where it was typed. It draws in Source mode only. Neither line ends nor line breaks are marked. **Show Line Numbers** and **Readable Line Length** are Obsidian's own settings. **Navigation Pane** opens Obsidian's Outline: Word's Navigation Pane is that same panel of headings, while Word's **Outline** is a view mode that replaces the whole document.
- **Zoom** — **Zoom In**, **Zoom Out** and **100%** scale the window. Word's Zoom group calls the last one 100%; it is Obsidian's Reset Zoom. Desktop only — Obsidian registers no zoom commands elsewhere, so the buttons grey out.
- **Outlining** — **Collapse**, **Expand**, **Collapse All** and **Expand All**. Word keeps these on the Outlining tab that appears inside Outline view, so they sit last here rather than on the main tab. Collapse toggles the fold at the caret; Expand unfolds one level, because Obsidian has no unfold-one command and folding less is the closest it offers.

### Tab 4 · Table

Button placement follows the parts of Word's **Table Layout** tab that apply to Markdown tables.

- **Rows & Columns** — Delete Rows or Columns ▼ (Delete Rows, Delete Columns), Insert Rows Above, Insert Columns to the Left, Move Row Up, Move Row Down, Move Column Left, Move Column Right
- **Format** — Format Tables ▼ (Format Table, Format All Tables)
- **Alignment** — Align Column Left, Align Column Center, Align Column Right
- **Data** — Sort Rows ▼ (Sort Rows A to Z, Sort Rows Z to A)
- **Clipboard** — Paste as Table: converts tab- or comma-separated clipboard text into an aligned Markdown table at the cursor. Explicit command only; regular Paste is untouched.

Column-level names (*Align Column…*, *Sort Rows…*) distinguish these from the paragraph-level Align and Sort Lines on Home. Every command here except **Paste as Table** greys out when the caret is not inside a table; Paste as Table stays available wherever the editor is.

### Tab 5 · Utilities

- **Lines** — **Merge Lines** joins a run of lines into one; **Split Lines** breaks them at the punctuation the selection uses most, out of `、 ， , ; ； | ·`; **Reverse Lines** flips the order of each run. None of the three crosses a blank line or a code fence, and a line with nothing to do is left alone. **Duplicate** copies the line at the caret, or the selection.
- **Sort** — two sorts that read structure rather than lines. **Sort List** sorts a list level by level: an item keeps its own body and its own children, and ordered items come out renumbered. **Sort Headings** reorders each level of the note's outline and carries every section's body along with it; its scope is the whole note, and a heading quoted in a callout or written inside a code fence counts as body text, not as a heading.

### Tab 6 · Pinned

Pin **any command from the command palette** — core commands, other plugins' commands, or this plugin's own 98 — to the toolbar with an icon of your choice. The built-in set is the intersection of what most people use often; the one or two commands a given user can't live without usually fall outside it.

| Item | Convention |
|---|---|
| Source | Every command available in the command palette; no filtering |
| Icon | Any Lucide icon; defaults to `command` |
| Group name | None — a single unnamed group of buttons |
| Position | Last tab of the Ribbon; last section of the Compact overflow menu |
| When empty | Tab stays visible with the hint "Add one under Settings → Pinned." |
| Execution | Identical to running the command from the command palette |
| Missing command | Button is disabled; pinned data is kept, so reinstalling restores it |
| Adding | Settings only — no `+` on the toolbar, no palette command |
| Order | Drag and drop in Settings |

Pinning is a one-time, low-frequency setup, so Settings is its natural home; a `+` button would eat scarce horizontal space and make the toolbar edit itself.

### Font Color and Highlight Color

Both are drop-down palettes of the 10 standard colors, matching Word's Font Color button:

- **No Color** clears an existing color; **More Colors…** opens a hue/saturation panel with a hex field, an **Ok** and a **Cancel**. The color is applied only on **Ok**.
- No last-used color is remembered; the palette always opens in the same state.
- Nothing happens without a selection.

### Emoji & Symbols

One button on **Insert · Media & Symbols** opens a panel of about 2,150 entries in three sources, each split into groups, with one search box over the active source.

| Source | Entries (approx.) | Groups |
|---|---|---|
| **Emoji** | ~1,900 | Smileys & People, Animals & Nature, Food & Drink, Activity, Travel & Places, Objects, Symbols, Flags |
| **Kaomoji** | ~70 | Emotion, Animal, Behavior, People, Holiday, Food |
| **Symbols** | ~200 | Arrows, Math, Typographic, Currency, Enclosed, Dingbats |

Search matches an entry's name and keywords. Each source additionally keeps its own **Frequently used** group — per source, not global, so kaomoji don't get crowded out by emoji — which becomes the default group once anything has been picked. Usage counts live in settings and are pruned automatically; there is no UI for them.

Picking an entry inserts the character over the selection or at the caret, as one undo step. The panel stays open so several characters can be dropped in a row, and closes on Escape or an outside click, returning focus to the editor. Emoji are inserted with their default skin tone.

The character data ships with the plugin — emoji from `@emoji-mart/data`, kaomoji and symbols hand-kept in the repo — so the panel works offline. The button is available wherever the editor is in source mode, in every position including the Compact overflow menu, but is not registered in the command palette: its only job is to open the panel, so a palette entry would be a no-op.

---

## 6. Settings

| Section | Contents |
|---|---|
| **Toolbar** | Independent toggles for Top / Following / Fixed |
| **Pinned** | List of pinned commands: add (pick a command, then an icon), change icon, drag to reorder, delete |
| **Table** | Enter moves to the next row (on); pad cell width with spaces (on); sort by clicking a header in Reading view (on) |

Entry usage counts are stored with the settings but have no control: the Emoji & Symbols panel writes and prunes them automatically.

The Table options govern editing behavior and text output, not toolbar layout, so they don't conflict with the fixed-layout principle. Header-click sorting reorders the rendered rows only and never modifies the file; clicking the same header cycles ascending → descending → original order, and the state resets whenever the note is re-rendered. Every header carries an arrow so the feature is discoverable: two faint carets facing apart when unsorted, and the live direction highlighted on the sorted column. Turning the setting off removes the arrow with the behavior.

---

## 7. Look and Feel

- **Icons** — Obsidian's built-in Lucide set, with 3 custom SVGs where Lucide has no equivalent: delete row, delete column, and the placeholder drawn when a name resolves to nothing. Heading 1–6 are Lucide's own; the plugin icon ships with the release and is not plugin code.
- **Naming** — Word terminology, initial capitals, no `Toggle` prefix.
- **Styling** — colors and icon size follow the active Obsidian theme, so the toolbar scales with the user's global settings.
- **Exception** — the 10 standard colors are fixed values, because they become document content rather than UI decoration and must not drift when the user changes theme.

---

## 8. Out of Scope

- A rich-text editor or any proprietary format.
- A replacement for the command palette — the toolbar covers frequent actions only.
- Word features Markdown has no concept of: font family and size, line spacing, margins, headers and footers, page numbers, shapes, charts, table of contents.
- Features needing capabilities Obsidian doesn't expose: spell check, grammar check, thesaurus, translation.
- User-created commands — Pinned surfaces existing commands, it doesn't create new ones.
- Emoji shortcodes: no `:smile:` expansion, no autocomplete while typing; the panel inserts raw characters.
- Skin-tone selection, custom emoji sets, user-editable character lists.
- Reordering, hiding or showing the 105 built-in commands.
- Toolbar appearance customization: background or icon color pickers, theme variants.

---

## 9. Terminology

| Term | Meaning |
|---|---|
| **Position** | Where a toolbar renders: **Top**, **Following**, **Fixed**. Three independent toggles. |
| **Layout** | How a position renders: **Ribbon** (Top) or **Compact** (Following / Fixed). |
| **Tab · Group · Button** | Ribbon structure. A **drop-down** button holds several commands; a Compact **overflow menu** (`⋯`) holds the buttons that don't fit. |
| **Command** | An action the toolbar runs. **106 built-in commands** plus any **pinned command**. |
| **Source · Group · Entry** | Emoji & Symbols panel structure: three sources (Emoji, Kaomoji, Symbols) → groups → entries. Picking an entry inserts a character. |
| **Word terminology** | Display names follow Microsoft Word (*Bold*, *Clear Formatting*), initial capitals, no `Toggle` prefix. |
| **Plugin icon** | The plugin's icon in Obsidian's left sidebar. "Ribbon" on its own always means the toolbar layout. |

---
