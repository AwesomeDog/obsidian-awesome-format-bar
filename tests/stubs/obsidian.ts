/** The `obsidian` package ships types only, so Vitest cannot resolve it. */

export class PluginSettingTab {
  constructor(
    public app: unknown,
    public plugin: unknown,
  ) {}
}
