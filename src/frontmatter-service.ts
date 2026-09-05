import { App, TFile } from "obsidian";
import type FrontmatterPlusPlugin from "./main";
import { DEFAULT_SETTINGS } from "./settings";
import type { FrontmatterPlusSettings } from "./settings";
import { formatNow, formatTimestamp } from "./time";
import { asRecord, recordGet, recordSet } from "./utils";

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function hashString(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return `${text.length}:${hash}`;
}

function stableValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function contentFingerprint(
  body: string,
  fm: Record<string, unknown> | null,
  createdKey: string,
  updatedKey: string
): string {
  const meta: string[] = [];
  if (fm) {
    for (const key of Object.keys(fm).sort()) {
      if (key === "position" || key === createdKey || key === updatedKey) continue;
      meta.push(`${key}=${stableValue(recordGet(fm, key))}`);
    }
  }
  return hashString(`${body}\n--\n${meta.join("\n")}`);
}

function frontmatterKeyCount(fm: Record<string, unknown> | null): number {
  if (!fm) return 0;
  return Object.keys(fm).filter((k) => k !== "position").length;
}

type ApplyMode = "create" | "modify";

export class FrontmatterService {
  private plugin: FrontmatterPlusPlugin;
  private createTimers = new Map<string, number>();
  private updateTimers = new Map<string, number>();
  private processing = new Set<string>();
  private lastContentHash = new Map<string, string>();
  private lastWriteAt = new Map<string, number>();

  constructor(plugin: FrontmatterPlusPlugin) {
    this.plugin = plugin;
  }

  get settings(): FrontmatterPlusSettings {
    return this.plugin.settings;
  }

  get app(): App {
    return this.plugin.app;
  }

  clearTimers(): void {
    for (const id of this.createTimers.values()) window.clearTimeout(id);
    for (const id of this.updateTimers.values()) window.clearTimeout(id);
    this.createTimers.clear();
    this.updateTimers.clear();
    this.processing.clear();
    this.lastContentHash.clear();
    this.lastWriteAt.clear();
  }

  onUnloadFile(path: string): void {
    this.cancelCreateTimer(path);
    this.cancelUpdateTimer(path);
    this.processing.delete(path);
    this.lastContentHash.delete(path);
    this.lastWriteAt.delete(path);
  }

  renameHash(oldPath: string, newPath: string): void {
    const hash = this.lastContentHash.get(oldPath);
    if (hash !== undefined) {
      this.lastContentHash.set(newPath, hash);
      this.lastContentHash.delete(oldPath);
    }
    const wrote = this.lastWriteAt.get(oldPath);
    if (wrote !== undefined) {
      this.lastWriteAt.set(newPath, wrote);
      this.lastWriteAt.delete(oldPath);
    }
  }

  isExcluded(file: TFile): boolean {
    const path = file.path;
    if (this.settings.excludedFiles.includes(path)) return true;
    return this.settings.excludedFolders.some(
      (folder) =>
        folder === "/" || path === folder || path.startsWith(folder + "/")
    );
  }

  isSelfWrite(file: TFile): boolean {
    if (this.processing.has(file.path)) return true;
    const at = this.lastWriteAt.get(file.path);
    return at !== undefined && Date.now() - at < 1200;
  }

  formatNow(): string {
    return formatNow(this.settings.dateFormat);
  }

  async fillEmptyExisting(): Promise<number> {
    const createdKey = this.settings.createdKey;
    const updatedKey = this.settings.updatedKey;
    let changed = 0;

    for (const file of this.app.vault.getMarkdownFiles()) {
      if (this.isExcluded(file)) continue;

      const cache = this.app.metadataCache.getFileCache(file);
      const fm = asRecord(cache?.frontmatter);
      if (!fm) continue;

      const hasCreated = Object.prototype.hasOwnProperty.call(fm, createdKey);
      const hasUpdated = Object.prototype.hasOwnProperty.call(fm, updatedKey);
      const createdEmpty = hasCreated && isEmptyValue(recordGet(fm, createdKey));
      const updatedEmpty = hasUpdated && isEmptyValue(recordGet(fm, updatedKey));

      if (!createdEmpty && !updatedEmpty) continue;

      const ctime =
        typeof file.stat?.ctime === "number" && file.stat.ctime > 0 ? file.stat.ctime : Date.now();
      const mtime =
        typeof file.stat?.mtime === "number" && file.stat.mtime > 0 ? file.stat.mtime : Date.now();

      this.processing.add(file.path);
      try {
        await this.app.fileManager.processFrontMatter(file, (raw: unknown) => {
          const current = asRecord(raw);
          if (!current) return;
          if (createdEmpty && isEmptyValue(recordGet(current, createdKey))) {
            recordSet(current, createdKey, formatTimestamp(ctime, this.settings.dateFormat));
          }
          if (updatedEmpty && isEmptyValue(recordGet(current, updatedKey))) {
            recordSet(current, updatedKey, formatTimestamp(mtime, this.settings.dateFormat));
          }
        });
        this.lastWriteAt.set(file.path, Date.now());
        changed++;
      } finally {
        window.setTimeout(() => this.processing.delete(file.path), 1000);
      }
    }

    return changed;
  }

  stripFrontmatter(content: string): string {
    if (!content.startsWith("---")) return content;
    const end = content.indexOf("\n---", 3);
    if (end === -1) return content;
    return content.slice(end + 4).replace(/^\r?\n/, "");
  }

  scheduleCreate(file: TFile): void {
    if (this.isExcluded(file) || file.extension !== "md") return;
    this.cancelCreateTimer(file.path);
    const delay = Math.max(0, this.settings.createDelayMs);
    const timer = window.setTimeout(() => {
      this.createTimers.delete(file.path);
      void this.run(file, "create");
    }, delay);
    this.createTimers.set(file.path, timer);
  }

  scheduleUpdate(file: TFile): void {
    if (this.isExcluded(file) || file.extension !== "md") return;
    if (this.isSelfWrite(file)) return;
    this.cancelUpdateTimer(file.path);
    const delay = Math.max(0, this.settings.updateDelayMs);
    const timer = window.setTimeout(() => {
      this.updateTimers.delete(file.path);
      void this.run(file, "modify");
    }, delay);
    this.updateTimers.set(file.path, timer);
  }

  private cancelCreateTimer(path: string): void {
    const id = this.createTimers.get(path);
    if (id !== undefined) {
      window.clearTimeout(id);
      this.createTimers.delete(path);
    }
  }

  private cancelUpdateTimer(path: string): void {
    const id = this.updateTimers.get(path);
    if (id !== undefined) {
      window.clearTimeout(id);
      this.updateTimers.delete(path);
    }
  }

  private async run(file: TFile, mode: ApplyMode): Promise<void> {
    if (!file || this.isExcluded(file) || this.processing.has(file.path)) return;
    if (this.plugin.pathSync?.isSuppressed(file.path)) return;

    const content = await this.app.vault.read(file);
    const body = this.stripFrontmatter(content);
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = asRecord(cache?.frontmatter);
    const keyCount = frontmatterKeyCount(fm);

    const createdKey = this.settings.createdKey;
    const updatedKey = this.settings.updatedKey;
    const hash = contentFingerprint(body, fm, createdKey, updatedKey);
    const prevHash = this.lastContentHash.get(file.path);
    const contentChanged = prevHash === undefined || prevHash !== hash;

    const hasCreated = !!fm && Object.prototype.hasOwnProperty.call(fm, createdKey);
    const hasUpdated = !!fm && Object.prototype.hasOwnProperty.call(fm, updatedKey);
    const createdEmpty = !!(fm && hasCreated && isEmptyValue(recordGet(fm, createdKey)));
    const updatedEmpty = !!(fm && hasUpdated && isEmptyValue(recordGet(fm, updatedKey)));

    let insertCreated = false;
    let insertUpdated = false;
    let fillCreated = false;
    let fillUpdated = false;
    let touchUpdated = false;

    if (keyCount === 0) {
      if (mode === "create") {
        if (this.settings.autoInsertCreatedOnCreate) insertCreated = true;
        if (this.settings.autoInsertUpdatedOnCreate) insertUpdated = true;
      }
    } else {
      if (!hasCreated && this.settings.forceInsertCreated) insertCreated = true;
      if (!hasUpdated && this.settings.forceInsertUpdated) insertUpdated = true;

      if (this.settings.fillEmptyDateKeys) {
        if (hasCreated && createdEmpty) fillCreated = true;
        if (hasUpdated && updatedEmpty) fillUpdated = true;
      }

      if (
        mode === "modify" &&
        contentChanged &&
        (hasUpdated || insertUpdated) &&
        !(hasUpdated && updatedEmpty && !fillUpdated)
      ) {
        if (hasUpdated && !updatedEmpty) touchUpdated = true;
        else if (hasUpdated && fillUpdated) touchUpdated = false;
      }
    }

    if (mode === "modify" && prevHash !== undefined && !contentChanged) {
      if (!insertCreated && !insertUpdated && !fillCreated && !fillUpdated) {
        this.lastContentHash.set(file.path, hash);
        return;
      }
    }

    const wrote = await this.write(file, {
      insertCreated,
      insertUpdated,
      fillCreated,
      fillUpdated,
      touchUpdated,
    });

    this.lastContentHash.set(file.path, hash);
    if (wrote) this.lastWriteAt.set(file.path, Date.now());
  }

  private async write(
    file: TFile,
    opts: {
      insertCreated: boolean;
      insertUpdated: boolean;
      fillCreated: boolean;
      fillUpdated: boolean;
      touchUpdated: boolean;
    }
  ): Promise<boolean> {
    if (this.processing.has(file.path)) return false;

    const createdKey = this.settings.createdKey;
    const updatedKey = this.settings.updatedKey;
    const now = this.formatNow();
    const cache = this.app.metadataCache.getFileCache(file);
    const current = asRecord(cache?.frontmatter) ?? {};

    const hasCreated = Object.prototype.hasOwnProperty.call(current, createdKey);
    const hasUpdated = Object.prototype.hasOwnProperty.call(current, updatedKey);

    let willChange = false;
    if (opts.insertCreated && !hasCreated) willChange = true;
    if (opts.insertUpdated && !hasUpdated) willChange = true;
    if (opts.fillCreated && hasCreated && isEmptyValue(recordGet(current, createdKey))) willChange = true;
    if (opts.fillUpdated && hasUpdated && isEmptyValue(recordGet(current, updatedKey))) willChange = true;
    if (opts.touchUpdated && hasUpdated && String(recordGet(current, updatedKey) ?? "") !== now) {
      willChange = true;
    }

    if (!willChange) return false;

    this.processing.add(file.path);
    try {
      await this.app.fileManager.processFrontMatter(file, (raw: unknown) => {
        const fm = asRecord(raw);
        if (!fm) return;
        const existsCreated = Object.prototype.hasOwnProperty.call(fm, createdKey);
        const existsUpdated = Object.prototype.hasOwnProperty.call(fm, updatedKey);

        if (opts.insertCreated && !existsCreated) recordSet(fm, createdKey, now);
        else if (opts.fillCreated && existsCreated && isEmptyValue(recordGet(fm, createdKey))) {
          recordSet(fm, createdKey, now);
        }

        if (opts.insertUpdated && !existsUpdated) recordSet(fm, updatedKey, now);
        else if (opts.fillUpdated && existsUpdated && isEmptyValue(recordGet(fm, updatedKey))) {
          recordSet(fm, updatedKey, now);
        } else if (
          opts.touchUpdated &&
          existsUpdated &&
          String(recordGet(fm, updatedKey) ?? "") !== now
        ) {
          recordSet(fm, updatedKey, now);
        }
      });
      return true;
    } finally {
      window.setTimeout(() => this.processing.delete(file.path), 1000);
    }
  }

  private get exportFileName(): string {
    return "frontmatter-plus-settings.json";
  }

  async exportSettings(): Promise<void> {
    const json = JSON.stringify(this.settings, null, 2);
    const existing = this.app.vault.getAbstractFileByPath(this.exportFileName);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, json);
    } else {
      await this.app.vault.create(this.exportFileName, json);
    }
  }

  async importSettings(): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(this.exportFileName);
    if (!(file instanceof TFile)) return false;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await this.app.vault.read(file));
    } catch {
      return false;
    }
    const data = asRecord(parsed);
    if (!data) return false;

    this.plugin.settings = {
      ...DEFAULT_SETTINGS,
      ...(data as Partial<FrontmatterPlusSettings>),
    };
    await this.plugin.saveSettings();
    return true;
  }
}
