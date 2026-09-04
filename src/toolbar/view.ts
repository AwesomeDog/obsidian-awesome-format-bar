import type { ToolbarPosition } from "../model/types";
import type { ToolbarHost } from "./host";
import { ToolbarSurface } from "./surface";

/** One toolbar per view, owning 0-3 surfaces. */
export class ViewToolbar {
  private readonly surfaces = new Map<ToolbarPosition, ToolbarSurface>();
  private readonly host: ToolbarHost;
  private frame = 0;

  constructor(host: ToolbarHost) {
    this.host = host;
    this.host.containerEl.addClass("awesome-format-bar-host");
    this.sync();
  }

  sync(): void {
    const wanted = new Set(this.host.positions);
    for (const [position, surface] of this.surfaces) {
      if (wanted.has(position)) continue;
      surface.destroy();
      this.surfaces.delete(position);
    }
    for (const position of this.host.positions) {
      if (!this.surfaces.has(position))
        this.surfaces.set(position, new ToolbarSurface(this.host, position));
    }
    this.queueRefresh();
  }

  /** Pinned changes while running, and the Ribbon cannot patch its groups. */
  rerender(): void {
    for (const surface of this.surfaces.values()) surface.rerender();
  }

  queueRefresh(): void {
    const win = this.host.containerEl.ownerDocument.defaultView ?? window;
    if (this.frame) win.cancelAnimationFrame(this.frame);
    this.frame = win.requestAnimationFrame(() => {
      this.frame = 0;
      for (const surface of this.surfaces.values()) surface.refresh();
    });
  }

  destroy(): void {
    const win = this.host.containerEl.ownerDocument.defaultView ?? window;
    if (this.frame) win.cancelAnimationFrame(this.frame);
    for (const surface of this.surfaces.values()) surface.destroy();
    this.surfaces.clear();
    this.host.containerEl.removeClass("awesome-format-bar-host");
  }
}
