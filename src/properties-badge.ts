import { CachedMetadata, MarkdownView, TFile } from "obsidian";
import { t, tf } from "./i18n";
import type FrontmatterPlusPlugin from "./main";
import { daysSince } from "./time";
import { asRecord, isRecord, recordGet } from "./utils";

const BADGE_CLS = "fp-properties-badge";
const HEADING_SEL = ".metadata-properties-heading";
const TASK_RE = /^\s*[-*+]\s+\[([ xX])\]/gm;

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith("---")) return content;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return content;
  return content.slice(end + 4).replace(/^\r?\n/, "");
}

function formatBytes(plugin: FrontmatterPlusPlugin, bytes: number): string {
  const locale = plugin.settings.locale;
  if (bytes < 1024) return tf(locale, "sizeB", { n: bytes });
  if (bytes < 1024 * 1024) {
    const n = bytes < 10 * 1024 ? (bytes / 1024).toFixed(1) : String(Math.round(bytes / 1024));
    return tf(locale, "sizeKB", { n });
  }
  if (bytes < 1024 * 1024 * 1024) {
    const n =
      bytes < 10 * 1024 * 1024
        ? (bytes / (1024 * 1024)).toFixed(1)
        : String(Math.round(bytes / (1024 * 1024)));
    return tf(locale, "sizeMB", { n });
  }
  return tf(locale, "sizeGB", { n: (bytes / (1024 * 1024 * 1024)).toFixed(1) });
}

function countTasks(body: string): { done: number; total: number } | null {
  TASK_RE.lastIndex = 0;
  let done = 0;
  let total = 0;
  let match: RegExpExecArray | null;
  while ((match = TASK_RE.exec(body)) !== null) {
    total += 1;
    if (match[1].toLowerCase() === "x") done += 1;
  }
  if (total === 0) return null;
  return { done, total };
}

function trimLeadingSpace(text: string): string {
  return text.replace(/^\s+/, "");
}

function hasYamlError(cache: CachedMetadata | null, content: string): boolean {
  const trimmed = trimLeadingSpace(content);
  if (!cache) return trimmed.startsWith("---");
  const record = asRecord(cache);
  if (!record) return trimmed.startsWith("---");
  if (recordGet(record, "frontmatterError") != null) return true;
  const hasFrontmatter = recordGet(record, "frontmatter") != null;
  const hasPosition = recordGet(record, "frontmatterPosition") != null;
  return trimmed.startsWith("---") && !hasFrontmatter && !hasPosition;
}

function readLinkMap(value: unknown): Record<string, Record<string, number>> {
  if (!isRecord(value)) return {};
  const out: Record<string, Record<string, number>> = {};
  for (const from of Object.keys(value)) {
    const targets = recordGet(value, from);
    if (!isRecord(targets)) continue;
    const inner: Record<string, number> = {};
    for (const to of Object.keys(targets)) {
      const count = recordGet(targets, to);
      if (typeof count === "number" && count > 0) {
        inner[to] = count;
      }
    }
    out[from] = inner;
  }
  return out;
}

function isLinkIsolated(plugin: FrontmatterPlusPlugin, file: TFile): boolean {
  const resolvedRaw: unknown = plugin.app.metadataCache.resolvedLinks;
  const resolved = readLinkMap(resolvedRaw);
  const outgoing = resolved[file.path];
  if (outgoing) {
    const counts: number[] = Object.keys(outgoing).map((key) => outgoing[key]);
    for (const count of counts) {
      if (count > 0) return false;
    }
  }

  const sources: string[] = Object.keys(resolved);
  for (const from of sources) {
    if (from === file.path) continue;
    const targets = resolved[from];
    const inbound = targets[file.path];
    if (typeof inbound === "number" && inbound > 0) return false;
  }

  return true;
}

export class PropertiesBadge {
  private plugin: FrontmatterPlusPlugin;
  private observer: MutationObserver | null = null;
  private refreshTimer: number | null = null;

  constructor(plugin: FrontmatterPlusPlugin) {
    this.plugin = plugin;
  }

  onload(): void {
    this.observer = new MutationObserver(() => this.scheduleRefresh());
    this.observer.observe(document.body, { childList: true, subtree: true });

    this.plugin.registerEvent(
      this.plugin.app.workspace.on("active-leaf-change", () => this.scheduleRefresh())
    );
    this.plugin.registerEvent(
      this.plugin.app.workspace.on("layout-change", () => this.scheduleRefresh())
    );
    this.plugin.registerEvent(
      this.plugin.app.workspace.on("file-open", () => this.scheduleRefresh())
    );
    this.plugin.registerEvent(
      this.plugin.app.metadataCache.on("changed", (file) => {
        const active = this.getActiveFile();
        if (active && active.path === file.path) this.scheduleRefresh();
      })
    );
    this.plugin.registerEvent(
      this.plugin.app.metadataCache.on("resolved", () => this.scheduleRefresh())
    );
    this.plugin.registerEvent(
      this.plugin.app.vault.on("modify", (file) => {
        if (!(file instanceof TFile)) return;
        const active = this.getActiveFile();
        if (active && active.path === file.path) this.scheduleRefresh();
      })
    );

    this.scheduleRefresh();
  }

  onunload(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    document.querySelectorAll(`.${BADGE_CLS}`).forEach((el) => el.remove());
  }

  refreshNow(): void {
    this.scheduleRefresh(0);
  }

  private scheduleRefresh(delay = 60): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      void this.refresh();
    }, delay);
  }

  private getActiveFile(): TFile | null {
    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.file ?? null;
  }

  private fileForHeading(heading: HTMLElement): TFile | null {
    let matched: TFile | null = null;
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      if (matched) return;
      const view = leaf.view;
      if (!(view instanceof MarkdownView) || !view.file) return;
      if (view.containerEl.contains(heading)) matched = view.file;
    });
    return matched ?? this.getActiveFile();
  }

  private tr(key: string): string {
    return t(this.plugin.settings.locale, key);
  }

  private async refresh(): Promise<void> {
    const headings = document.querySelectorAll<HTMLElement>(HEADING_SEL);

    if (!this.plugin.settings.showPropertiesBadge) {
      document.querySelectorAll(`.${BADGE_CLS}`).forEach((el) => el.remove());
      return;
    }

    for (const heading of Array.from(headings)) {
      const file = this.fileForHeading(heading);
      const label = file ? await this.buildLabel(file) : "";
      let badge = heading.querySelector<HTMLElement>(`.${BADGE_CLS}`);
      if (!label) {
        badge?.remove();
        continue;
      }
      if (!badge) badge = heading.createDiv({ cls: BADGE_CLS });
      badge.setText(label);
    }
  }

  private async buildLabel(file: TFile): Promise<string> {
    const parts: string[] = [];
    const s = this.plugin.settings;
    const locale = s.locale;
    const content = await this.plugin.app.vault.cachedRead(file);
    const body = stripFrontmatter(content);
    const cache = this.plugin.app.metadataCache.getFileCache(file);

    if (hasYamlError(cache, content)) {
      parts.push(`${this.tr("noticeLabel")} ${this.tr("indicatorYamlError")}`);
    }

    if (s.showReadingTime) {
      const words = countWords(body);
      const wpm = Math.max(60, s.wordsPerMinute || 200);
      const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / wpm));
      parts.push(tf(locale, "indicatorMinRead", { n: minutes }));
    }

    if (s.showYamlCompleteness) {
      const fm = asRecord(cache?.frontmatter);
      const keys = fm ? Object.keys(fm).filter((k) => k !== "position") : [];
      const pct =
        !fm || keys.length === 0
          ? 0
          : Math.round(
              (keys.filter((k) => !isEmptyValue(recordGet(fm, k))).length / keys.length) * 100
            );
      parts.push(tf(locale, "indicatorYaml", { n: pct }));
    }

    if (s.showFileSize) {
      parts.push(formatBytes(this.plugin, file.stat.size));
    }

    if (s.showFocusTimer) {
      const focus = this.plugin.focusSession.getDisplay(file.path);
      if (focus) parts.push(focus);
    }

    if (s.showStaleWarning) {
      const days = daysSince(file.stat.mtime);
      if (days >= Math.max(1, s.staleAfterDays || 30)) {
        parts.push(tf(locale, "indicatorStale", { n: days }));
      }
    }

    if (s.showTasks) {
      const tasks = countTasks(body);
      if (tasks) {
        parts.push(tf(locale, "indicatorTasks", { done: tasks.done, total: tasks.total }));
      }
    }

    if (s.showIsolated && isLinkIsolated(this.plugin, file)) {
      parts.push(this.tr("indicatorIsolated"));
    }

    return parts.filter(Boolean).join("  ·  ");
  }
}
