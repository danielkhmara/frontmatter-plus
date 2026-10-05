import { CORE_SCHEMA, dump, load } from "js-yaml";

export class TAbstractFile {
  path = "";
  name = "";
  parent: TFolder | null = null;
}

export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];

  isRoot(): boolean {
    return this.path === "";
  }
}

export class TFile extends TAbstractFile {
  basename = "";
  extension = "";
  stat = { ctime: 0, mtime: 0, size: 0 };
}

export class App {}

export class Plugin {}

export class MarkdownView {
  constructor(public file: TFile | null = null) {}
}

export const Platform = { isDesktopApp: true, isMobile: false };

export class WorkspaceLeaf {
  view: unknown = null;
}

export class Notice {
  constructor(public message = "") {}
}

export type CachedMetadata = {
  frontmatter?: Record<string, unknown>;
  frontmatterPosition?: unknown;
};

export function parseYaml(text: string): unknown {
  return load(text, { schema: CORE_SCHEMA });
}

export function stringifyYaml(value: unknown): string {
  return dump(value, { schema: CORE_SCHEMA, lineWidth: -1 });
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
}
