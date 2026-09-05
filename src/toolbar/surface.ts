import { setTooltip } from "obsidian";
import { t } from "../i18n/i18n";
import { commandById } from "../model/command-table";
import {
  BUILT_IN_COMMAND_TABS,
  COMPACT_GROUPS,
  PINNED_TAB,
  RIBBON_TABS,
  type RibbonGroup,
  type TabId,
} from "../model/layout";
import type { CommandSpec, ToolbarPosition } from "../model/types";
import { createButton } from "./button";
import { openCharPanel } from "./char-panel";
import type { ToolbarHost } from "./host";
import { resolveIcon } from "./icons";
import {
  openPopover,
  popoverSectionsFor,
  type PopoverItem,
  type PopoverSection,
} from "./popover";

/** One Position's bar; the Position decides the Layout. */
const FOLLOWING_GAP = 8;
/** Mirrors the `--size-4-4` inline margin both Compact bars get in styles.css. */
const SIDE_MARGIN = 16;
const PINNED_EMPTY = "Add one under Settings → Pinned.";
export class ToolbarSurface {
  readonly el: HTMLElement;
  private readonly buttons = new Map<HTMLButtonElement, CommandSpec>();
  private readonly host: ToolbarHost;
  private readonly position: ToolbarPosition;
  private readonly observer: ResizeObserver | null = null;
  private activeTab: TabId = "home";
  private mainEl: HTMLElement | null = null;
  private overflowEl: HTMLButtonElement | null = null;
  private overflowed: CommandSpec[] = [];
  private measuredWidth = -1;

  constructor(host: ToolbarHost, position: ToolbarPosition) {
    this.host = host;
    this.position = position;
    const ribbon = position === "top";
    this.el = host.containerEl.createDiv({
      attr: { role: "toolbar" },
      cls: [
        "awesome-format-bar",
        `awesome-format-bar--${position}`,
        ribbon ? "awesome-format-bar--ribbon" : "awesome-format-bar--compact",
      ].join(" "),
      prepend: ribbon,
    });
    if (ribbon) this.renderRibbon();
    else this.renderCompact();
    if (position === "following") this.el.hide();

    if (!ribbon) {
      // The view is watched too, or widening it never unfolds.
      this.observer = new ResizeObserver(() => this.layoutCompact(true));
      this.observer.observe(this.el);
      this.observer.observe(host.containerEl);
    }
  }

  destroy(): void {
    this.observer?.disconnect();
    this.el.remove();
  }

  /** Pinned buttons change while running; the rest of the Ribbon is built once. */
  rerender(): void {
    this.buttons.clear();
    this.measuredWidth = -1;
    this.el.empty();
    if (this.position === "top") this.renderRibbon();
    else this.renderCompact();
    if (this.position === "following") this.el.hide();
  }

  private renderRibbon(): void {
    const tabs = this.el.createDiv({
      attr: { role: "tablist" },
      cls: "tab-row",
    });
    const panel = this.el.createDiv({
      attr: { role: "tabpanel" },
      cls: "tab-panel",
    });

    for (const tab of RIBBON_TABS) {
      const active = tab.id === this.activeTab;
      const tabEl = tabs.createEl("button", {
        attr: {
          "aria-selected": String(active),
          role: "tab",
          tabindex: active ? "0" : "-1",
          type: "button",
        },
        cls: active ? "tab is-active" : "tab",
        text: tab.name,
      });
      tabEl.addEventListener("click", () => this.selectTab(tab.id));
      tabEl.addEventListener("keydown", (event) =>
        this.onTabKeydown(event, tab.id),
      );
    }
    this.renderGroups(panel);
  }

  private renderGroups(panel: HTMLElement): void {
    panel.empty();
    if (this.activeTab === PINNED_TAB.id) {
      this.renderPinned(panel);
      return;
    }
    const tab =
      BUILT_IN_COMMAND_TABS.find(
        (candidate) => candidate.id === this.activeTab,
      ) ?? BUILT_IN_COMMAND_TABS[0];
    for (const group of tab.groups as readonly RibbonGroup[]) {
      const groupEl = panel.createDiv({ cls: "group" });
      const row = groupEl.createDiv({ cls: "group-buttons" });
      for (const id of group.commands) {
        const spec = commandById(id);
        this.buttons.set(createButton(row, spec, this.host), spec);
      }
      groupEl.createDiv({ cls: "group-name", text: group.name });
    }
    this.refresh();
  }

  /** One bare group: pinned buttons carry no group name and no fixed order. */
  private renderPinned(panel: HTMLElement): void {
    const groupEl = panel.createDiv({ cls: "group" });
    const row = groupEl.createDiv({ cls: "group-buttons" });
    const specs = this.host.pinnedSpecs();
    for (const spec of specs)
      this.buttons.set(createButton(row, spec, this.host), spec);
    if (specs.length === 0)
      groupEl.createDiv({ cls: "group-empty", text: t(PINNED_EMPTY) });
    this.refresh();
  }

  private selectTab(id: TabId): void {
    if (id === this.activeTab) return;
    this.activeTab = id;
    this.buttons.clear();
    const tabs = this.el.querySelectorAll<HTMLElement>(".tab");
    RIBBON_TABS.forEach((tab, index) => {
      const tabEl = tabs.item(index);
      const active = tab.id === id;
      tabEl?.toggleClass("is-active", active);
      tabEl?.setAttribute("aria-selected", String(active));
      tabEl?.setAttribute("tabindex", active ? "0" : "-1");
    });
    const panel = this.el.querySelector<HTMLElement>(".tab-panel");
    if (panel) this.renderGroups(panel);
  }

  private onTabKeydown(event: KeyboardEvent, id: TabId): void {
    const index = RIBBON_TABS.findIndex((tab) => tab.id === id);
    const target =
      event.key === "ArrowRight"
        ? (index + 1) % RIBBON_TABS.length
        : event.key === "ArrowLeft"
          ? (index - 1 + RIBBON_TABS.length) % RIBBON_TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? RIBBON_TABS.length - 1
              : -1;
    if (target < 0) return;
    event.preventDefault();
    const tab = RIBBON_TABS[target];
    if (!tab) return;
    this.selectTab(tab.id);
    this.el.querySelectorAll<HTMLElement>(".tab").item(target)?.focus();
  }

  private renderCompact(): void {
    // Flat siblings, no per-group wrapper: keeps the fold pass one loop.
    const main = this.el.createDiv({ cls: "button-row" });
    this.mainEl = main;
    COMPACT_GROUPS.forEach((group, index) => {
      if (index > 0) main.createDiv({ cls: "separator" });
      for (const id of group) {
        const spec = commandById(id);
        this.buttons.set(createButton(main, spec, this.host), spec);
      }
    });

    const overflow = this.el.createEl("button", {
      attr: { "aria-label": t("More commands"), type: "button" },
      cls: "format-button",
    });
    resolveIcon(overflow, "more-horizontal");
    setTooltip(overflow, t("More commands"), { placement: "top" });
    overflow.addEventListener("pointerdown", (event) => event.preventDefault());
    overflow.addEventListener("click", () => this.openOverflow(overflow));
    this.overflowEl = overflow;
    this.refresh();
  }

  /** The view's width, not the bar's: a Compact bar hugs its content. */
  private availableWidth(): number {
    const container = this.host.containerEl;
    const style = container.ownerDocument.defaultView
      ? getComputedStyle(container)
      : null;
    const pad = style
      ? (parseFloat(style.paddingLeft) || 0) +
        (parseFloat(style.paddingRight) || 0)
      : 0;
    return Math.max(0, container.clientWidth - pad - 2 * SIDE_MARGIN);
  }

  /** Reflow only when the width moved; `refresh()` fires on every keystroke. */
  private layoutCompact(force = false): void {
    const main = this.mainEl;
    const overflow = this.overflowEl;
    if (!main || !overflow) return;

    const width = this.availableWidth();
    if (!force && width === this.measuredWidth) return;
    this.measuredWidth = width;

    for (const [button] of this.buttons) button.removeClass("is-hidden");
    overflow.removeClass("is-hidden");

    // Never folded away: the only route to commands outside COMPACT_ORDER.
    const budget = width - overflow.offsetWidth - 12;
    const children = Array.from(main.children) as HTMLElement[];
    let used = 0;
    this.overflowed = [];

    for (const child of children) {
      used += child.offsetWidth;
      if (child.hasClass("separator") || used <= budget) continue;
      child.addClass("is-hidden");
      const spec = this.buttons.get(child as HTMLButtonElement);
      if (spec) this.overflowed.push(spec);
    }

    // A separator is only earned once a visible button precedes and follows it.
    let seenVisible = false;
    let pending: HTMLElement | null = null;
    for (const child of children) {
      if (child.hasClass("separator")) {
        child.addClass("is-hidden");
        pending = seenVisible ? child : null;
        continue;
      }
      if (child.hasClass("is-hidden")) continue;
      pending?.removeClass("is-hidden");
      pending = null;
      seenVisible = true;
    }
  }

  /** Folded buttons first, then every Tab · Group, then Pinned. */
  private openOverflow(anchor: HTMLButtonElement): void {
    const state = this.host.state();
    const foldedIds = new Set(this.overflowed.map((spec) => spec.id));
    const sections: PopoverSection[] = [];

    // Same dispatch as `createButton`; the Emoji & Symbols panel is no section.
    const choose = (spec: CommandSpec): void => {
      if (spec.popup === "character-panel")
        void openCharPanel(anchor, spec, this.host);
      else if (spec.popup)
        openPopover(anchor, popoverSectionsFor(spec, this.host, anchor), () =>
          this.host.focusEditor(),
        );
      else this.host.execute(spec);
    };

    const toItem = (spec: CommandSpec): PopoverItem => ({
      icon: spec.icon,
      label: spec.name,
      onChoose: () => choose(spec),
    });

    if (foldedIds.size) {
      sections.push({
        items: this.overflowed
          .filter((spec) => state.isEnabled(spec))
          .map(toItem),
        title: t("Hidden by width"),
      });
    }

    for (const tab of BUILT_IN_COMMAND_TABS) {
      for (const group of tab.groups as readonly RibbonGroup[]) {
        const items = group.commands
          .filter((id) => !foldedIds.has(id))
          .map((id) => commandById(id))
          .filter((spec) => state.isEnabled(spec))
          .map(toItem);
        if (items.length)
          sections.push({
            items,
            title: t("{tab} · {group}", { tab: tab.name, group: group.name }),
          });
      }
    }

    // Pinned last: it is the one section the user fills.
    const pinned = this.host
      .pinnedSpecs()
      .filter((spec) => state.isEnabled(spec))
      .map(toItem);
    if (pinned.length) sections.push({ items: pinned, title: PINNED_TAB.name });

    openPopover(anchor, sections, () => this.host.focusEditor());
  }

  refresh(): void {
    const state = this.host.state();
    for (const [button, spec] of this.buttons) {
      const enabled = state.isEnabled(spec);
      button.disabled = !enabled;
      button.setAttribute("aria-disabled", String(!enabled));
    }
    if (this.position !== "top") this.layoutCompact();
    if (this.position === "following") this.positionFollowing();
  }

  private positionFollowing(): void {
    const doc = this.el.ownerDocument;
    const selection = doc.defaultView?.getSelection();
    const range =
      selection && !selection.isCollapsed ? selection.getRangeAt(0) : null;
    const container = this.host.containerEl;
    if (!range || !container.contains(range.commonAncestorContainer)) {
      this.el.hide();
      return;
    }

    this.el.show();
    const box = container.getBoundingClientRect();
    const originX = box.left + container.clientLeft;
    const originY = box.top + container.clientTop;
    const target = range.getBoundingClientRect();
    const size = this.el.getBoundingClientRect();
    const above = target.top - originY - size.height - FOLLOWING_GAP;
    const below = target.bottom - originY + FOLLOWING_GAP;
    const top = above >= 0 ? above : below;
    if (top + size.height > container.clientHeight) {
      this.el.hide();
      return;
    }
    const centered = target.left + target.width / 2 - size.width / 2 - originX;
    const limit = Math.max(
      SIDE_MARGIN,
      container.clientWidth - size.width - SIDE_MARGIN,
    );
    this.el.style.top = `${top}px`;
    this.el.style.left = `${Math.min(Math.max(SIDE_MARGIN, centered), limit)}px`;
  }
}
