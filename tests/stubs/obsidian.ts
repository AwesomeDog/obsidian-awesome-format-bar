/** The `obsidian` package ships types only, so Vitest cannot resolve it. */

export class PluginSettingTab {
  constructor(
    public app: unknown,
    public plugin: unknown,
  ) {}
}

export class Notice {
  constructor(public message: string) {}
}

export const Platform = {
  isDesktopApp: true,
  isMobileApp: false,
  isMobile: false,
};

export function setTooltip(
  _el: unknown,
  _text: unknown,
  _options?: unknown,
): void {}

export function getIconIds(): string[] {
  return [];
}

export function setIcon(_el: unknown, _id: unknown): void {}
