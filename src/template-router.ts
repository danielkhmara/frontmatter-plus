import { TFile } from "obsidian";
import type FrontmatterPlusPlugin from "./main";
import { formatNow } from "./time";

export class TemplateRouter {
  private plugin: FrontmatterPlusPlugin;
  private applying = new Set<string>();

  constructor(plugin: FrontmatterPlusPlugin) {
    this.plugin = plugin;
  }

  isApplying(file: TFile): boolean {
    return this.applying.has(file.path);
  }

  async maybeApply(file: TFile): Promise<boolean> {
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
