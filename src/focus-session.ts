import { MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import type FrontmatterPlusPlugin from "./main";
import { formatDuration } from "./time";

interface SessionState {
  accumulatedMs: number;
  runningSince: number | null;
}

export class FocusSessionTracker {
  private plugin: FrontmatterPlusPlugin;
  private sessions = new Map<string, SessionState>();
  private activePath: string | null = null;
  private tickTimer: number | null = null;
  private onTick: (() => void) | null = null;

  constructor(plugin: FrontmatterPlusPlugin) {
    this.plugin = plugin;
  }

  onload(onTick?: () => void): void {
    this.onTick = onTick ?? null;

    this.plugin.registerEvent(
      this.plugin.app.workspace.on("active-leaf-change", () => this.sync())
    );
    this.plugin.registerEvent(
      this.plugin.app.workspace.on("layout-change", () => this.sync())
    );
    this.plugin.registerEvent(
      this.plugin.app.workspace.on("file-open", () => this.sync())
    );

    this.sync();
    this.tickTimer = window.setInterval(() => {
      this.onTick?.();
    }, 1000);
  }

  onunload(): void {
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.pauseActive();
    this.sessions.clear();
    this.activePath = null;
  }

  getDisplay(path: string): string {
    const ms = this.getElapsedMs(path);
    if (ms <= 0 && this.activePath !== path && !this.sessions.has(path)) return "";
    return formatDuration(ms);
  }

  getElapsedMs(path: string): number {
    const state = this.sessions.get(path);
    if (!state) return 0;
    let total = state.accumulatedMs;
    if (state.runningSince !== null) {
      total += Date.now() - state.runningSince;
    }
    return total;
  }

  private sync(): void {
    const openPaths = this.collectOpenMarkdownPaths();
    for (const path of [...this.sessions.keys()]) {
      if (!openPaths.has(path)) {
        this.sessions.delete(path);
      }
    }

    const active = this.getActiveMarkdownFile();
    const nextPath = active?.path ?? null;

    if (this.activePath && this.activePath !== nextPath) {
      this.pause(this.activePath);
    }

    this.activePath = nextPath;
    if (nextPath) {
      this.resume(nextPath);
    }

    this.onTick?.();
  }

  private pauseActive(): void {
    if (this.activePath) this.pause(this.activePath);
    this.activePath = null;
  }

  private pause(path: string): void {
    const state = this.sessions.get(path);
    if (!state || state.runningSince === null) return;
    state.accumulatedMs += Date.now() - state.runningSince;
    state.runningSince = null;
  }

  private resume(path: string): void {
    let state = this.sessions.get(path);
    if (!state) {
      state = { accumulatedMs: 0, runningSince: null };
      this.sessions.set(path, state);
    }
    if (state.runningSince === null) {
      state.runningSince = Date.now();
    }
  }

  private getActiveMarkdownFile(): TFile | null {
    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.file ?? null;
  }

  private collectOpenMarkdownPaths(): Set<string> {
    const paths = new Set<string>();
    this.plugin.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const view = leaf.view;
      if (view instanceof MarkdownView && view.file) {
        paths.add(view.file.path);
      }
    });
    return paths;
  }
}
