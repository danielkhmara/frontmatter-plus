import { Platform } from "obsidian";
import type FrontmatterPlusPlugin from "./main";
import { formatNow } from "./time";

export class StatusBarClock {
  private plugin: FrontmatterPlusPlugin;
  private el: HTMLElement | null = null;
  private timer: number | null = null;

  constructor(plugin: FrontmatterPlusPlugin) {
    this.plugin = plugin;
  }

  onload(): void {
    if (!Platform.isDesktopApp) return;

    this.el = this.plugin.addStatusBarItem();
    this.el.addClass("status-bar-item");
    this.el.addClass("fp-status-clock");
    this.render();
    this.timer = window.setInterval(() => this.render(), 1000);
  }

  onunload(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.el = null;
  }

  refresh(): void {
    this.render();
  }

  private render(): void {
    if (!this.el) return;
    const s = this.plugin.settings;

    if (!s.showStatusBarClock) {
      this.el.setText("");
      this.el.hide();
      return;
    }

    this.el.show();
    const date = formatNow(s.statusBarDateFormat);
    const time = formatNow(s.statusBarTimeFormat);
    this.el.setText(`${date}  ${time}`);
  }
}
