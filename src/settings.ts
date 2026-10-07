import {
  PluginSettingTab,
  setTooltip,
  ToggleComponent,
  type App,
  type Setting,
  type SettingDefinitionItem,
  type SettingGroupItem,
} from "obsidian";
import { t } from "./i18n/i18n";
import type AwesomeFormatBarPlugin from "./main";
import { TOOLBAR_TOGGLES } from "./model/preferences";
import type { Settings, ToolbarToggle, ToolbarVisibility } from "./model/types";

type PlatformKey = "desktop" | "mobile";
const TABLE_KEYS = [
  "tableKeyNavigation",
  "padCellWidthWithSpaces",
  "sortTableOnHeaderClick",
] as const;
type TableKey = (typeof TABLE_KEYS)[number];
type SettingKey =
  `${PlatformKey}.${ToolbarToggle}` | "enableOnMobile" | TableKey;

function isTableKey(key: string): key is TableKey {
  return (TABLE_KEYS as readonly string[]).includes(key);
}

function toggle(key: SettingKey, name: string, desc: string): SettingGroupItem {
  return { control: { key, type: "toggle" }, desc: t(desc), name: t(name) };
}

const TOGGLE_LABELS: Record<ToolbarToggle, string> = {
  fixed: "Fixed",
  following: "Following",
  top: "Top",
  editorMenu: "Editor menu",
};

/** Tooltips: four toggles in one row leave no room for descriptions. */
const TOGGLE_HINTS: Record<ToolbarToggle, string> = {
  fixed: "Compact bar pinned to the bottom of the editor.",
  following: "Compact bar above the selection.",
  top: "Ribbon pinned above the editor.",
  editorMenu:
    "Adds a submenu with every command to the editor's right-click menu.",
};

export class FormatBarSettingTab extends PluginSettingTab {
  private readonly plugin: AwesomeFormatBarPlugin;

  constructor(app: App, plugin: AwesomeFormatBarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  override getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        heading: t("Toolbar"),
        items: [this.platformRow("desktop"), this.platformRow("mobile")],
        type: "group",
      },
      {
        heading: t("Pinned"),
        items: [
          {
            desc: t("Manage pinned commands and groups."),
            name: t("Manage Pinned"),
            render: (setting: Setting): void => {
              setting.addButton((button) =>
                button
                  .setButtonText(t("Manage Pinned"))
                  .onClick(() => this.plugin.openPinnedManager()),
              );
            },
          },
        ],
        type: "group",
      },
      {
        heading: t("Table"),
        items: [
          toggle(
            "tableKeyNavigation",
            "Keyboard navigation",
            "Enter moves down a cell, Tab to the next one and Shift+Tab back, and Shift+Enter starts a new line inside the cell. Tab at the right edge adds a column and Enter on the last row adds a row below it. Source mode only.",
          ),
          toggle(
            "padCellWidthWithSpaces",
            "Pad cells with spaces",
            "Lines the pipes of each column up by padding cells with spaces. Live Preview always pads, so turning this off makes tables flip between the two styles as you edit.",
          ),
          toggle(
            "sortTableOnHeaderClick",
            "Sort on header click",
            "Click a table header in Reading view to sort its rows. The file is not modified.",
          ),
        ],
        type: "group",
      },
      {
        heading: t("General"),
        items: [
          toggle(
            "enableOnMobile",
            "Enable on Mobile",
            "Hides every bar on mobile without clearing its positions.",
          ),
        ],
        type: "group",
      },
    ];
  }

  /** Independent toggles, not one choice: Positions combine freely. */
  private platformRow(platform: PlatformKey): SettingGroupItem {
    return {
      name: t(platform === "desktop" ? "Desktop" : "Mobile"),
      render: (setting: Setting): void => {
        for (const toggle of TOOLBAR_TOGGLES) {
          const key: SettingKey = `${platform}.${toggle}`;
          const label = setting.controlEl.createEl("label", {
            cls: "awesome-format-bar-position",
          });
          label.createSpan({ text: t(TOGGLE_LABELS[toggle]) });
          setTooltip(label, t(TOGGLE_HINTS[toggle]));
          new ToggleComponent(label)
            .setValue(readSettingKey(this.plugin.settings, key))
            .onChange(async (value) => {
              writeSettingKey(this.plugin.settings, key, value);
              await this.plugin.saveSettings();
            });
        }
      },
    };
  }

  override getControlValue(key: string): unknown {
    return readSettingKey(this.plugin.settings, key as SettingKey);
  }

  override async setControlValue(key: string, value: unknown): Promise<void> {
    if (typeof value !== "boolean") return;
    writeSettingKey(this.plugin.settings, key as SettingKey, value);
    await this.plugin.saveSettings();
  }
}

export function readSettingKey(settings: Settings, key: SettingKey): boolean {
  if (key === "enableOnMobile") return settings.enableOnMobile;
  if (isTableKey(key)) return settings[key];
  const [platform, toggle] = key.split(".") as [PlatformKey, ToolbarToggle];
  return settings[platform][toggle];
}

export function writeSettingKey(
  settings: Settings,
  key: SettingKey,
  value: boolean,
): void {
  if (key === "enableOnMobile") {
    settings.enableOnMobile = value;
    return;
  }
  if (isTableKey(key)) {
    settings[key] = value;
    return;
  }
  const [platform, toggle] = key.split(".") as [PlatformKey, ToolbarToggle];
  const visibility: ToolbarVisibility = settings[platform];
  visibility[toggle] = value;
}
