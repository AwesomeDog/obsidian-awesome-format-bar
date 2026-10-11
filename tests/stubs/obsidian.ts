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
