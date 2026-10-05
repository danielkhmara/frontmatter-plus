import { TFile } from "obsidian";
import type FrontmatterPlusPlugin from "./main";
import { formatNow, formatTimestamp } from "./time";
import { escapeRegExp } from "./utils";

export class TemplateRouter {
  private plugin: FrontmatterPlusPlugin;
  private applying = new Set<string>();

  constructor(plugin: FrontmatterPlusPlugin) {
    this.plugin = plugin;
  }

  isApplying(file: TFile): boolean {
    return this.applying.has(file.path);
  }

  async maybeApply(file: TFile, createdAt: number): Promise<boolean> {
    if (file.extension !== "md") return false;

    const rule = this.findRule(file);
    if (!rule) return false;

    const current = await this.plugin.app.vault.read(file);
    if (current.replace(/\s/g, "").length > 0) return false;

    const templateFile = this.plugin.app.vault.getAbstractFileByPath(rule.templatePath);
    if (!(templateFile instanceof TFile)) return false;

    this.applying.add(file.path);
    try {
      let content = await this.plugin.app.vault.read(templateFile);
      content = this.expandPlaceholders(content, file);
      if (this.plugin.settings.fillEmptyDateKeys && !this.plugin.service.isExcluded(file)) {
        content = this.fillEmptyDates(content, createdAt);
      }
      await this.plugin.app.vault.modify(file, content);
      return true;
    } finally {
      window.setTimeout(() => this.applying.delete(file.path), 120);
    }
  }

  private findRule(file: TFile): { templatePath: string; folderPath: string } | null {
    const parent = file.parent?.path ?? "";
    const rules = this.plugin.settings.folderTemplates;
    let best: { templatePath: string; folderPath: string } | null = null;

    for (const rule of rules) {
      if (!rule.templatePath || !rule.folderPath) continue;
      const folder = rule.folderPath;
      const matches = parent === folder || parent.startsWith(folder + "/");
      if (!matches) continue;
      if (!best || folder.length > best.folderPath.length) {
        best = rule;
      }
    }

    return best;
  }

  private fillEmptyDates(content: string, createdAt: number): string {
    if (!content.startsWith("---")) return content;
    const end = content.indexOf("\n---", 3);
    if (end === -1) return content;

    const { createdKey, updatedKey, dateFormat } = this.plugin.settings;
    const stamp = formatTimestamp(createdAt, dateFormat);
    const value =
      /^[\w.+\-\/:]+(?: [\w.+\-\/:]+)*$/.test(stamp) && !stamp.includes(": ")
        ? stamp
        : JSON.stringify(stamp);
    const keys = [createdKey, updatedKey].filter(Boolean).map(escapeRegExp).join("|");
    const emptyKey = new RegExp(`^(${keys}):[ \\t]*(?:""|''|null|~)?[ \\t]*$`, "gm");

    const frontmatter = content
      .slice(0, end)
      .replace(emptyKey, (_, key: string) => `${key}: ${value}`);
    return frontmatter + content.slice(end);
  }

  private expandPlaceholders(content: string, file: TFile): string {
    const title = file.basename;
    const date = formatNow("YYYY-MM-DD");
    const time = formatNow("HH:mm");
    const datetime = formatNow(this.plugin.settings.dateFormat);

    return content
      .split("{{title}}")
      .join(title)
      .split("{{date}}")
      .join(date)
      .split("{{time}}")
      .join(time)
      .split("{{datetime}}")
      .join(datetime);
  }
}
