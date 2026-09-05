# Awesome Format Bar — Implementation Notes

> Companion to `docs/specs/prd.md`. Scope and behavior live there; this file records implementation decisions only.

## 1. Baseline

- **Obsidian 1.13.7+**.
- The minimum version is a contract: no feature detection, no version comparisons, no dual API paths.
- Official sample-plugin shape: TypeScript ESM, `strict`, `target ES2021`, esbuild → CommonJS `main.js`.
- `obsidian`, Electron built-ins and CodeMirror stay external. No Node/Electron API in plugin code.
- Forbidden: `any`, `@ts-ignore`, decorators, polyfills, `requireApiVersion()`, the deprecated `display()` settings path, CodeMirror 5 branches, `activeLeaf` as a business entry point, private `.cm-*` DOM for reading or writing text. Single exception: the registered-command bridge (§3.2).

## 2. Structure

```text
src/
  main.ts       lifecycle and wiring        settings.ts  declarative settings tab
  pin.ts        the two pickers for Pinned
  whitespace.ts the Show Whitespace CodeMirror extension
  model/        types, command-table, layout, palettes, preferences, pinned,
                characters (+ symbols, kaomoji, emoji-mart types)     — DOM-free
  editor-ops/   pure transforms returning a Plan
  commands/     registered.ts (registry bridge), apply, dispatch, execute
  toolbar/      button, floating, popover, char-panel, surface (Ribbon + Compact),
                view (ViewToolbar) (+ vanilla-picker types)
```

Direction: `main → toolbar → commands → editor-ops`, `main → settings → model`. No cycles, no upward imports. **No `index.ts`** — imports point at concrete files, so dependencies stay explicit and no logic hides in a barrel.

`editor-ops/` touches no DOM, no settings and no `app`, which is what makes the algorithms unit-testable.

## 3. Core decisions

### 3.1 Two static tables

`COMMANDS` is the only command metadata. It carries **no `execute`** — a `kind` field (`registered | editor | clipboard | view`) selects the execution path, so adding a command means editing the table and its slot in `BUILT_IN_COMMAND_TABS`, nothing else. `CommandId` is derived from the table, never a second hand-written union.

Pinned commands stay out of both tables:

- `RIBBON_TABS = [...BUILT_IN_COMMAND_TABS, PINNED_TAB]`, so `BUILT_IN_COMMAND_TABS` remains exactly the built-in layout and its contract test never changes.
- `pinnedSpecs()` synthesizes ordinary `kind: 'registered'` specs at runtime, reusing the existing button and execution code.
- **Pinned adds a data source, not an execution path.**

Contract tests in `tests/settings.test.ts` pin what the tables promise: 89 commands; `BUILT_IN_COMMAND_TABS` = 5 tabs / 18 groups with each command in exactly one group; `COMPACT_ORDER` free of duplicate or unknown IDs. Startup itself only warns — `reportStartupGaps()` checks icon names and forwarded command IDs.

### 3.2 Registered-command bridge

Forwarded commands execute through Obsidian's command registry, but `App.commands` is untyped. One narrow declaration lives in `commands/registered.ts` — the only runtime type boundary, and the only file allowed to touch `app.commands`.

- **Existence** uses `findCommand()`: it reads the same lookup `executeCommandById()` performs, so the two cannot disagree. A missing `registeredCommandId` is logged and disables the button.
- Not `listCommands()` — it answers "what the palette would show now", dropping every `editor:*` command when no editor is focused, which would freeze focus state into the toolbar. `editorCommands` misses `markdown:*`.
- **Enumeration** for the Pinned picker reads the `commands` registry directly, for the same reason.
- Release gate: verify IDs against `obsidian commands filter=editor:`. A gate, not a runtime fallback.

Local by decision, everything else forwards: **Inline Math** (joins `toggleInlinePair()`), **Horizontal Rule** (needs paragraph-boundary insertion with surrounding blank lines), **Callout** (per PRD). Conversely, a command with a `registeredCommandId` must execute through it — no shadow implementation of the same name in `editor-ops/`.

### 3.3 One transaction per click

Write through a single `editor.transaction(..., 'awesome-format-bar')`; never `setValue()`. Multi-selection changes are merged where they overlap and then sorted front-to-back — CodeMirror requires sorted, non-overlapping changes — so one click is one undo unit. Raw Markdown is touched only where the public API cannot express the change.

### 3.4 One execution entry point

Buttons, palette and future shortcuts all run `executeSpec(spec, context)`: check `canRun`, focus the editor, catch errors into one `Notice`, refresh the view. No per-button callbacks.

### 3.5 Settings normalization

`normalizeSettings()` is the only read path.

- A default is substituted only when a field's *type* is wrong, so an explicit `false` survives.
- Platforms merge independently; a broken `desktop` cannot damage the rest.
- A version mismatch resets everything — no migration table.
- The result is written back once at load, so nothing downstream handles dirty data.
- `pinned` and `charUsage` never bump the version: a mismatch wipes the file, far worse than one empty list.
- Interaction state (active tab, overflow, selection snapshots) stays in memory.

`enabledToolbarPositions()` derives visibility without mutating storage, so disabling hides the toolbars without clearing the three switches.

## 4. Lifecycle and rendering

**Teardown** uses `registerEvent()` and `registerDomEvent()` for workspace and document listeners. `ViewToolbar` is not a Component, so it cancels its own rAF handle and each surface disconnects its own `ResizeObserver` in `destroy()`.

**Deferred views** are never force-loaded for pre-rendering; `active-leaf-change` awaits `loadIfDeferred()` first. `editor-change` triggers only a coalesced state refresh, layout events one coalesced rediscovery. Context accepts only an editing-mode `MarkdownView`, so Reading view, Canvas and settings windows cannot invoke editor commands.

**Multi-window:** one lightweight listener set per `Document`, tracked in a `Set` held strongly — a settings change has to reach every window — and dropped on `window-close`.

**Ownership:** one `ViewToolbar` per view owning 0–3 surfaces that share the command table and state computation, each with its own non-persisted `activeTab`. Mounting uses only the public `contentEl` and plugin class names. Top and Fixed both sit in normal flow inside the view, so the editor shrinks by exactly the bar's height and no spacer is needed; Following is positioned absolutely against the view rect. Fixed adds a bottom margin carrying the safe-area inset, per split pane — no global bottom bar.

**DOM:** `setIcon()`, `setText()`, `addIcon()`; never `innerHTML`.

**Overflow:** a `ResizeObserver` re-measures on width change; the rest go into an Obsidian `Menu` sectioned by the `BUILT_IN_COMMAND_TABS` groups — no custom Modal.

**Following placement:** prefer above the selection, fall back below, clamp horizontally to the view, and **hide rather than cover the selection** when neither fits — a bar that would spill outside the view is hidden rather than clamped, so the vertical direction is never traded away. `pointerdown` calls `preventDefault()` to keep focus and selection.

**Refresh** is coalesced with `requestAnimationFrame` — never a document scan per keystroke.

## 5. Algorithm decisions

Only the non-obvious ones.

- **`toggleInlinePair()`** — unwrap when the selection sits fully inside a matching pair, else wrap; never reflow outside the selection or swallow adjacent spaces. Tags are code constants, so user text never enters an attribute.
- **Colors** — **More colors…** mounts vanilla-picker in the shared floating layer with `popup: false` and writes on `onDone`, which is the panel's **Ok** or Enter inside it. Nothing reaches the document while the user drags, so one pick is one undo step and Cancel really cancels. Two deliberate deviations from the library: its popup mode is unused, because it appends the panel *into* its parent and flips that element to `position: relative` — a 25em panel nested in a 26px toolbar button, plus an inline style left behind — and its stylesheet is not loaded, because it hardcodes greys no theme can reach; `styles.css` skins the same DOM with grid instead, replacing a flex-wrap that needed a spacer pseudo-element to force its second row. The CSP entry is the one bundled, so no `<style>` is injected at runtime. `color.hex` carries eight digits even with `alpha: false`, so the alpha byte is trimmed before the value reaches `color:`. **No Color** removes only its own CSS property. Palette hex is literal, never a theme variable.
- **Renumber List** — expand each selection to the whole list block; key counters by *parent path + indent level* so nesting never consumes the parent's numbering; keep a counter across a blank line only while both sides stay in the same block; rewrite numbers only, preserving the original delimiter, indentation and body. The reference implementation is rejected: private CodeMirror state, partial coverage, extra writes.
- **Sort Lines** — stable `Intl.Collator` with `numeric: true`; never crosses a code fence or paragraph boundary.
- **Merge / Split Lines** — pure functions over whole lines. Merging takes `collapsed-paragraph` blocks and flushes the run at a blank line or fence, so a code block never collapses into prose; splitting breaks at the punctuation the selection uses most and drops it. A line neither can act on passes through verbatim, so neither trims in passing, and a break touching CJK on *either* side joins bare — the reference tests both sides, which leaves a space after a line ending in `，`.
- **Indent / Undo / Redo** — public `editor.exec()` and `editor.undo()`; no hand-computed list spacing, no simulated keystrokes.
- **Paste** — prefer Electron's `paste()` / `pasteAndMatchStyle()`, the only path converting `text/html` to Markdown and what Obsidian's own context menu uses; fall back to `readText()` plus verbatim insertion. Cut deletes only after a successful write. Never `document.execCommand()`.
- **Block Reference** — `crypto.randomUUID()`, avoiding a Node dependency.
- **Emoji & Symbols** — three sources normalized to one `CharEntry`. Search scores in three tiers (name prefix > word start > substring); `Array.sort` is stable, so equal scores keep dataset order — free popularity fallback, no fuzzy matching. Arrow keys navigate by grid arithmetic, not measured DOM. Insertion collapses the selection after the inserted text so consecutive picks line up. `charUsage` is pruned **per source** on open: a global ranking would let emoji squeeze kaomoji out, and per-source pruning caps the map at what can be displayed.
- **Focus / Zen Mode** — Focus is a plugin-owned `body` class collapsed down to the two sidebars. Zen is real fullscreen on `view.containerEl`, so nothing in Obsidian's layout is written to and quitting restores it as it was; unload exits fullscreen rather than leaving the window stuck. No vendor-prefixed `requestFullscreen` branches: Obsidian desktop is Chromium, and other branches would be dead code. Both are removed unconditionally on unload. A `body`-mounted popup would be invisible while fullscreen renders only its own subtree, so the floating layer mounts into `doc.fullscreenElement` when there is one.
- **Show Whitespace** — `highlightWhitespace()` from CodeMirror already marks every U+0020 and Tab, so only the odd spaces are ours: one `MatchDecorator` over NBSP / Ogham / EN–EM / ideographic / BOM, one character per match so a run draws a dot each. The marks are always on; Source-mode-only and every color are CSS `.cm-highlightSpace` rules, because Obsidian already puts `is-live-preview` on the view and switching extensions per mode would drop the decorations on every mode change. The tab arrow is a data-URI SVG, which no theme variable can reach, so it becomes a `mask` over `background-color`. Selectors carry three classes to outrank CodeMirror's base theme, which hardcodes `#aaa` and is injected after `styles.css`. The extension lives in a mutable array registered once: `updateOptions()` is what reconfigures.
- **Show Line Numbers** — forwarded to `editor:toggle-line-numbers`. Line numbers are a global editor setting; a second copy of the state would drift.
- **Reference project** is a behavioral sample, not a template: never copy `setLine()`, `setValue()`, deferred `setTimeout()` writes, private `.cm-*` access or its Modals.

## 6. Settings tab

Only `getSettingDefinitions()` is overridden; the framework owns rendering, search and controls. It does no I/O, since it is re-run on every update. Nested keys plug in through `getControlValue` / `setControlValue` over dotted keys.

- **Platform rows** need a handwritten `render`: a declarative item carries one control, but the three positions are independent switches. Each toggle sits in a `<label>` so the text is clickable, with the description as a tooltip on the label — on the toggle it would appear only over the switch.
- **Pinned** is the only `type: 'list'` group, so add, delete, drag handles and indices come from the framework, identical on both platforms with no branch. Each row renders only the Change icon button; name and description are applied before `render` runs.
- **`this.update()` after every mutation** is the only reason the list refreshes; `refreshDomState()` only re-evaluates `visible` / `disabled` and does nothing for add or delete.
- **Pinned changes also call `toolbar.rerender()`**: `refreshToolbars()` only syncs surfaces and disabled states, while Ribbon groups are built in the surface constructor. The two entry points own separate halves and never call each other.
- All three positions off stays — Fixed is never auto-enabled.

## 7. Icons, CSS, accessibility

Lucide via `setIcon()`, nothing bundled; a placeholder icon on lookup failure so no button is blank. The 3 custom SVGs (placeholder, delete row, delete column) are code constants in `main.ts`; Heading 1–6 come from Lucide, and `toolbar/icons.ts` carries a fallback chain for names a release may rename.

All selectors start with `.awesome-format-bar` and use Obsidian variables, except the whitespace marks, which have to target CodeMirror's own `.cm-highlight*` classes; the palette's document colors are the only literal hex. Stable `min-width` / `min-height` keep measurement from jittering. ≥32px hit areas under `pointer: coarse`. `prefers-reduced-motion` honoured, and no state change waits on an animation.

Unavailable commands set both `disabled` and `aria-disabled`. The toolbar handles keys only while one of its buttons has focus.

## 8. Testing and gate

- **`editor-ops`** — overlapping selections; wrap/unwrap over existing wrappers; Renumber List nesting, blank lines, paragraph boundaries, mixed delimiters; Sort Lines stability and fences; Merge / Split Lines over fences, lone lines and CJK; color removal touching only its own property.
- **`settings`** — per-field defaulting, explicit all-`false` surviving, bad version reset, values preserved when disabled; `pinned` round-trip, dedupe, name fallback; the layout contract.
- **Integration** on exactly 1.13.7 — platform defaults; all 8 position combinations without overlap; splits and pop-outs; deferred tabs; Following never covering the selection; all 89 commands executing with no missing forwarded mapping; one undo per transform; settings search and persistence; Pinned staying in sync and greying out when its source plugin is disabled; nothing left behind after unload.
- **Gate** — `lint`, `test`, `build` pass; no source map; release contains only `main.js`, `manifest.json`, `styles.css`.

## 9. Maintenance map

| Task | Only place to edit |
|---|---|
| Add or adjust a command | `COMMANDS`, plus its slot in `BUILT_IN_COMMAND_TABS`, plus every dictionary in `src/i18n/` |
| Change Compact order | `COMPACT_GROUPS` (`COMPACT_ORDER` is derived, and exists for the contract test) |
| Add a Markdown transform | Pure function in `editor-ops/` + `COMMANDS` entry + `planFor()` branch |
| Adjust buttons or positioning | `toolbar/surface.ts` / `styles.css` |
| Add a setting | `Settings` type, defaults in `preferences.ts`, definitions in `settings.ts` |
| Change a forwarded command ID | The `registeredCommandId` field — leave `commands/registered.ts` alone |
| Change Pinned behaviour | `src/pin.ts` (pickers) / `pinnedSpecs()` (buttons) |

Never touch a button callback, the settings tab and an event listener for one feature. The command table is the behaviour entry point, `ViewToolbar` the view entry point, `Plugin` the lifecycle entry point; no further layers.

## 10. i18n

`getLanguage()` (public since 1.8.7) is the only input; no dependency, no user-facing setting — the plugin follows the app.

- **Tables rename in place.** `COMMANDS`, the tabs, the groups and `PINNED_TAB` carry English, and `setLanguage()` rewrites their `name` at load.
- **`t()` covers the rest** — settings, notices, panel and picker literals — keyed by their own English, falling back to it when a key is missing. `{name}` placeholders let a language reorder the sentence.
- **A missing or empty key degrades to English, never to a blank.**
- **Dictionaries hold display text, never identifiers.**
- **Adding a language** is one file in `src/i18n/` plus one line in `DICTS`. Nothing else changes.
- **Not translated:** the ~2,150 emoji / kaomoji / symbol names.
