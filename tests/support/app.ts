import { MarkdownView, parseYaml, stringifyYaml, TAbstractFile, TFile, TFolder } from "obsidian";

export interface FileOptions {
  ctime?: number;
  mtime?: number;
}

function splitFrontmatter(content: string): { yaml: string; rest: string } | null {
  if (!content.startsWith("---")) return null;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return null;
  return { yaml: content.slice(content.indexOf("\n") + 1, end), rest: content.slice(end + 4) };
}

export class FakeVault {
  private entries = new Map<string, TAbstractFile>();
  private contents = new Map<string, string>();
  private writeCounts = new Map<string, number>();

  constructor() {
    const root = new TFolder();
    this.entries.set("", root);
  }

  add(path: string, content: string, options: FileOptions = {}): TFile {
    const file = new TFile();
    file.path = path;
    file.name = path.slice(path.lastIndexOf("/") + 1);
    file.extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".") + 1) : "";
    file.basename = file.extension ? file.name.slice(0, -(file.extension.length + 1)) : file.name;
    file.parent = this.ensureFolder(path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "");
    file.parent.children.push(file);
    const now = Date.now();
    file.stat = { ctime: options.ctime ?? now, mtime: options.mtime ?? now, size: 0 };
    this.entries.set(path, file);
    this.store(file, content);
    return file;
  }

  remove(path: string): void {
    const file = this.entries.get(path);
    if (file?.parent) file.parent.children = file.parent.children.filter((child) => child !== file);
    this.entries.delete(path);
    this.contents.delete(path);
  }

  content(path: string): string {
    const value = this.contents.get(path);
    if (value === undefined) throw new Error(`No such file: ${path}`);
    return value;
  }

  writes(path: string): number {
    return this.writeCounts.get(path) ?? 0;
  }

  totalWrites(): number {
    return Array.from(this.writeCounts.values()).reduce((sum, count) => sum + count, 0);
  }

  write(file: TFile, content: string): void {
    this.store(file, content);
    file.stat.mtime = Date.now();
    this.writeCounts.set(file.path, this.writes(file.path) + 1);
  }

  async read(file: TFile): Promise<string> {
    return this.content(file.path);
  }

  async cachedRead(file: TFile): Promise<string> {
    return this.content(file.path);
  }

  async modify(file: TFile, content: string): Promise<void> {
    this.write(file, content);
  }

  async process(file: TFile, fn: (data: string) => string): Promise<string> {
    const next = fn(this.content(file.path));
    this.write(file, next);
    return next;
  }

  async create(path: string, content: string): Promise<TFile> {
    const file = this.add(path, content);
    this.writeCounts.set(path, this.writes(path) + 1);
    return file;
  }

  getMarkdownFiles(): TFile[] {
    return Array.from(this.entries.values()).filter(
      (entry): entry is TFile => entry instanceof TFile && entry.extension === "md"
    );
  }

  rename(entry: TAbstractFile, newPath: string): string {
    const oldPath = entry.path;
    const moved = Array.from(this.entries.keys()).filter(
      (path) => path === oldPath || path.startsWith(`${oldPath}/`)
    );
    if (entry.parent) entry.parent.children = entry.parent.children.filter((child) => child !== entry);
    entry.parent = this.ensureFolder(newPath.includes("/") ? newPath.slice(0, newPath.lastIndexOf("/")) : "");
    entry.parent.children.push(entry);
    for (const path of moved) {
      const item = this.entries.get(path) as TAbstractFile;
      const next = newPath + path.slice(oldPath.length);
      this.entries.delete(path);
      item.path = next;
      item.name = next.slice(next.lastIndexOf("/") + 1);
      if (item instanceof TFile) item.basename = item.extension ? item.name.slice(0, -(item.extension.length + 1)) : item.name;
      this.entries.set(next, item);
      const content = this.contents.get(path);
      if (content !== undefined) {
        this.contents.delete(path);
        this.contents.set(next, content);
      }
    }
    return oldPath;
  }

  getAllLoadedFiles(): TAbstractFile[] {
    return Array.from(this.entries.values());
  }

  getAbstractFileByPath(path: string): TAbstractFile | null {
    return this.entries.get(path) ?? null;
  }

  on(): object {
    return {};
  }

  private store(file: TFile, content: string): void {
    this.contents.set(file.path, content);
    file.stat.size = Buffer.byteLength(content, "utf8");
  }

  private ensureFolder(path: string): TFolder {
    const existing = this.entries.get(path);
    if (existing instanceof TFolder) return existing;
    const folder = new TFolder();
    folder.path = path;
    folder.name = path.slice(path.lastIndexOf("/") + 1);
    folder.parent = this.ensureFolder(path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "");
    folder.parent.children.push(folder);
    this.entries.set(path, folder);
    return folder;
  }
}

export class FakeMetadataCache {
  resolvedLinks: Record<string, Record<string, number>> = {};
  private stale = new Set<string>();

  constructor(private vault: FakeVault) {}

  markStale(path: string): void {
    this.stale.add(path);
  }

  getFileCache(file: TFile): { frontmatter?: Record<string, unknown>; frontmatterPosition?: object } | null {
    if (this.stale.has(file.path)) return null;
    const parts = splitFrontmatter(this.vault.content(file.path));
    if (!parts) return {};
    try {
      const parsed = parseYaml(parts.yaml);
      const frontmatter =
        typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : {};
      return { frontmatter, frontmatterPosition: {} };
    } catch {
      return {};
    }
  }

  on(): object {
    return {};
  }
}

export class FakeFileManager {
  constructor(private vault: FakeVault) {}

  async processFrontMatter(file: TFile, fn: (frontmatter: Record<string, unknown>) => void): Promise<void> {
    const content = this.vault.content(file.path);
    const parts = splitFrontmatter(content);
    const parsed = parts ? parseYaml(parts.yaml) : null;
    const frontmatter =
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    fn(frontmatter);
    const yaml = stringifyYaml(frontmatter);
    const next = parts ? `---\n${yaml}---${parts.rest}` : `---\n${yaml}---\n${content}`;
    this.vault.write(file, next);
  }
}

export class FakeWorkspace {
  activeFile: TFile | null = null;
  leaves: { view: MarkdownView }[] = [];
  activeView: MarkdownView | null = null;
  private handlers = new Map<string, (() => void)[]>();

  open(file: TFile): MarkdownView {
    const view = new MarkdownView(file);
    this.leaves.push({ view });
    return view;
  }

  activate(view: MarkdownView | null): void {
    this.activeView = view;
    this.activeFile = view?.file ?? null;
    this.trigger("active-leaf-change");
  }

  close(view: MarkdownView): void {
    this.leaves = this.leaves.filter((leaf) => leaf.view !== view);
    if (this.activeView === view) this.activate(null);
    this.trigger("layout-change");
  }

  trigger(name: string): void {
    for (const handler of this.handlers.get(name) ?? []) handler();
  }

  getActiveFile(): TFile | null {
    return this.activeFile;
  }

  getActiveViewOfType<T>(type: new (...args: never[]) => T): T | null {
    return this.activeView instanceof type ? this.activeView : null;
  }

  iterateAllLeaves(callback: (leaf: { view: MarkdownView }) => void): void {
    for (const leaf of this.leaves) callback(leaf);
  }

  on(name: string, handler: () => void): object {
    this.handlers.set(name, [...(this.handlers.get(name) ?? []), handler]);
    return {};
  }

  onLayoutReady(callback: () => void): void {
    callback();
  }
}

export class FakeApp {
  vault = new FakeVault();
  metadataCache = new FakeMetadataCache(this.vault);
  fileManager = new FakeFileManager(this.vault);
  workspace = new FakeWorkspace();
}

export function frontmatterOf(content: string): Record<string, unknown> {
  const parts = splitFrontmatter(content);
  if (!parts) return {};
  const parsed = parseYaml(parts.yaml);
  return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
}

export function bodyOf(content: string): string {
  const parts = splitFrontmatter(content);
  return parts ? parts.rest.replace(/^\r?\n/, "") : content;
}
