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
import { TOOLBAR_POSITIONS } from "./model/preferences";
import type {
  Settings,
  ToolbarPosition,
  ToolbarPositionVisibility,
} from "./model/types";

type PlatformKey = "desktop" | "mobile";
type TableKey =
  "bindEnterToNextRow" | "padCellWidthWithSpaces" | "sortTableOnHeaderClick";
type SettingKey =
  `${PlatformKey}.${ToolbarPosition}` | "enableOnMobile" | TableKey;

const TABLE_KEYS: readonly TableKey[] = [
  "bindEnterToNextRow",
  "padCellWidthWithSpaces",
  "sortTableOnHeaderClick",
];

function isTableKey(key: string): key is TableKey {
  return (TABLE_KEYS as readonly string[]).includes(key);
}

function toggle(key: SettingKey, name: string, desc: string): SettingGroupItem {
  return { control: { key, type: "toggle" }, desc: t(desc), name: t(name) };
}

const POSITION_LABELS: Record<ToolbarPosition, string> = {
  fixed: "Fixed",
  following: "Following",
  top: "Top",
};

/** Tooltips: three toggles in one row leave no room for descriptions. */
const POSITION_HINTS: Record<ToolbarPosition, string> = {
  fixed: "Compact bar pinned to the bottom of the editor.",
  following: "Compact bar above the selection.",
  top: "Ribbon pinned above the editor.",
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
        addItem: {
          action: () => {
            void this.plugin.pinCommand().then(() => this.update());
          },
          name: t("Pin a command"),
        },
        emptyState: t("No pinned commands yet."),
        heading: t("Pinned"),
        items: this.pinnedItems(),
        onDelete: (index: number) => {
          void this.plugin.removePinnedAt(index).then(() => this.update());
        },
        onReorder: (from: number, to: number) => {
          void this.plugin.movePinned(from, to).then(() => this.update());
        },
        type: "list",
      },
      {
        heading: t("Table"),
        items: [
          toggle(
            "bindEnterToNextRow",
            "Enter moves to the next row",
            "Pressing Enter inside a table jumps to the cell below and adds a row at the end. Live Preview already does this on its own, so this only applies in Source mode.",
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
      // {
      //   heading: t("General"),
      //   items: [
      //     toggle(
      //       "enableOnMobile",
      //       "Enable on Mobile",
      //       "Hides every bar on mobile without clearing its positions.",
      //     ),
      //   ],
      //   type: "group",
      // },
    ];
  }

  /** Independent toggles, not one choice: Positions combine freely. */
  private platformRow(platform: PlatformKey): SettingGroupItem {
    return {
      name: t(platform === "desktop" ? "Desktop" : "Mobile"),
      render: (setting: Setting): void => {
        for (const position of TOOLBAR_POSITIONS) {
          const key: SettingKey = `${platform}.${position}`;
          const label = setting.controlEl.createEl("label", {
            cls: "awesome-format-bar-position",
          });
          label.createSpan({ text: t(POSITION_LABELS[position]) });
          setTooltip(label, t(POSITION_HINTS[position]));
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

  /** Adding a pin is Settings' own affordance; a row only changes its icon. */
  private pinnedItems(): SettingGroupItem[] {
    return this.plugin.settings.pinned.map((entry, index) => ({
      desc: entry.commandId,
      name: entry.name,
      render: (setting: Setting): void => {
        setting.addButton((button) =>
          button
            .setIcon(entry.icon)
            .setTooltip(t("Change icon"))
            .onClick(() => {
              void this.plugin.pickPinnedIcon(index).then(() => this.update());
            }),
        );
      },
    }));
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
  const [platform, position] = key.split(".") as [PlatformKey, ToolbarPosition];
  return settings[platform][position];
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
  const [platform, position] = key.split(".") as [PlatformKey, ToolbarPosition];
  const visibility: ToolbarPositionVisibility = settings[platform];
  visibility[position] = value;
}
