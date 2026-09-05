import { TAbstractFile, TFile, TFolder } from "obsidian";
import type FrontmatterPlusPlugin from "./main";

function remapPath(path: string, oldPath: string, newPath: string): string {
  if (path === oldPath) return newPath;
  if (path.startsWith(oldPath + "/")) {
    return newPath + path.slice(oldPath.length);
  }
  return path;
}

function remapList(list: string[], oldPath: string, newPath: string): { next: string[]; changed: boolean } {
  let changed = false;
  const next = list.map((item) => {
    const mapped = remapPath(item, oldPath, newPath);
    if (mapped !== item) changed = true;
    return mapped;
  });
  return { next, changed };
}

export class PathSync {
  private plugin: FrontmatterPlusPlugin;
  private suppressUntil = new Map<string, number>();

  constructor(plugin: FrontmatterPlusPlugin) {
    this.plugin = plugin;
  }

  isSuppressed(path: string): boolean {
    const until = this.suppressUntil.get(path);
    if (until === undefined) return false;
    if (Date.now() >= until) {
      this.suppressUntil.delete(path);
      return false;
    }
    return true;
  }

  suppressPath(path: string, ms = 2500): void {
    this.suppressUntil.set(path, Date.now() + ms);
  }

  suppressTree(oldPath: string, newPath: string): void {
    this.suppressPath(newPath);
    this.suppressPath(oldPath);
    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (file.path === newPath || file.path.startsWith(newPath + "/")) {
        this.suppressPath(file.path);
      }
    }
  }

  async handleRename(file: TAbstractFile, oldPath: string): Promise<void> {
    const newPath = file.path;
    this.suppressTree(oldPath, newPath);

    const s = this.plugin.settings;
    let changed = false;

    const folders = remapList(s.excludedFolders, oldPath, newPath);
    if (folders.changed) {
      s.excludedFolders = Array.from(new Set(folders.next)).sort();
      changed = true;
    }

    const files = remapList(s.excludedFiles, oldPath, newPath);
    if (files.changed) {
      s.excludedFiles = Array.from(new Set(files.next)).sort();
      changed = true;
    }

    const rules = s.folderTemplates.map((rule) => {
      const templatePath = remapPath(rule.templatePath, oldPath, newPath);
      const folderPath = remapPath(rule.folderPath, oldPath, newPath);
      if (templatePath !== rule.templatePath || folderPath !== rule.folderPath) {
        changed = true;
      }
      return { templatePath, folderPath };
    });
    s.folderTemplates = rules;

    this.plugin.service.renameHash(oldPath, newPath);
    this.plugin.service.onUnloadFile(oldPath);

    if (file instanceof TFolder) {
      for (const child of this.plugin.app.vault.getMarkdownFiles()) {
        if (child.path.startsWith(newPath + "/")) {
          this.suppressPath(child.path);
        }
      }
    }

    if (file instanceof TFile) {
      this.suppressPath(file.path);
    }

    if (changed) {
      await this.plugin.saveSettings();
    }
  }
}
