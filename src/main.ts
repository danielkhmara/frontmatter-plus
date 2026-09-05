import { Plugin, TFile } from "obsidian";
import { FocusSessionTracker } from "./focus-session";
import { FrontmatterService } from "./frontmatter-service";
import { PathSync } from "./path-sync";
import { PropertiesBadge } from "./properties-badge";
import {
  DEFAULT_SETTINGS,
  isPluginLocale,
  pruneIncompleteRules,
  type FolderTemplateRule,
  type FrontmatterPlusSettings,
} from "./settings";
import { FrontmatterPlusSettingTab } from "./settings-tab";
import { StatusBarClock } from "./status-bar-clock";
import { TemplateRouter } from "./template-router";
import { isRecord } from "./utils";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asFolderRules(value: unknown): FolderTemplateRule[] {
  if (!Array.isArray(value)) return [];
  const rules: FolderTemplateRule[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const templatePath = item.templatePath;
    const folderPath = item.folderPath;
    if (typeof templatePath !== "string" || typeof folderPath !== "string") continue;
    rules.push({ templatePath, folderPath });
  }
  return rules;
}

export default class FrontmatterPlusPlugin extends Plugin {
  settings: FrontmatterPlusSettings = DEFAULT_SETTINGS;
  service!: FrontmatterService;
  propertiesBadge!: PropertiesBadge;
  templateRouter!: TemplateRouter;
  focusSession!: FocusSessionTracker;
  statusBarClock!: StatusBarClock;
  pathSync!: PathSync;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.service = new FrontmatterService(this);
    this.templateRouter = new TemplateRouter(this);
    this.pathSync = new PathSync(this);
    this.focusSession = new FocusSessionTracker(this);
    this.propertiesBadge = new PropertiesBadge(this);
    this.statusBarClock = new StatusBarClock(this);

    this.propertiesBadge.onload();
    this.focusSession.onload(() => this.propertiesBadge.refreshNow());
    this.statusBarClock.onload();
    this.addSettingTab(new FrontmatterPlusSettingTab(this.app, this));

    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        if (this.pathSync.isSuppressed(file.path)) return;
        void (async () => {
          await this.templateRouter.maybeApply(file);
          this.service.scheduleCreate(file);
        })();
      })
    );

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        if (this.service.isSelfWrite(file)) return;
        if (this.templateRouter.isApplying(file)) return;
        if (this.pathSync.isSuppressed(file.path)) return;
        this.service.scheduleUpdate(file);
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile) {
          this.service.onUnloadFile(file.path);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        void this.pathSync.handleRename(file, oldPath);
      })
    );
  }

  onunload(): void {
    this.statusBarClock?.onunload();
    this.focusSession?.onunload();
    this.propertiesBadge?.onunload();
    this.service?.clearTimers();
  }

  async loadSettings(): Promise<void> {
    const raw: unknown = await this.loadData();
    const data = isRecord(raw) ? raw : {};
    const locale = typeof data.locale === "string" && isPluginLocale(data.locale) ? data.locale : "en";

    this.settings = {
      ...DEFAULT_SETTINGS,
      locale,
      folderTemplates: pruneIncompleteRules(asFolderRules(data.folderTemplates)),
      excludedFolders: asStringArray(data.excludedFolders),
      excludedFiles: asStringArray(data.excludedFiles),
      createdKey: typeof data.createdKey === "string" ? data.createdKey : DEFAULT_SETTINGS.createdKey,
      updatedKey: typeof data.updatedKey === "string" ? data.updatedKey : DEFAULT_SETTINGS.updatedKey,
      dateFormat: typeof data.dateFormat === "string" ? data.dateFormat : DEFAULT_SETTINGS.dateFormat,
      createDelayMs:
        typeof data.createDelayMs === "number" ? data.createDelayMs : DEFAULT_SETTINGS.createDelayMs,
      updateDelayMs:
        typeof data.updateDelayMs === "number" ? data.updateDelayMs : DEFAULT_SETTINGS.updateDelayMs,
      autoInsertCreatedOnCreate:
        typeof data.autoInsertCreatedOnCreate === "boolean"
          ? data.autoInsertCreatedOnCreate
          : DEFAULT_SETTINGS.autoInsertCreatedOnCreate,
      autoInsertUpdatedOnCreate:
        typeof data.autoInsertUpdatedOnCreate === "boolean"
          ? data.autoInsertUpdatedOnCreate
          : DEFAULT_SETTINGS.autoInsertUpdatedOnCreate,
      forceInsertCreated:
        typeof data.forceInsertCreated === "boolean"
          ? data.forceInsertCreated
          : DEFAULT_SETTINGS.forceInsertCreated,
      forceInsertUpdated:
        typeof data.forceInsertUpdated === "boolean"
          ? data.forceInsertUpdated
          : DEFAULT_SETTINGS.forceInsertUpdated,
      fillEmptyDateKeys:
        typeof data.fillEmptyDateKeys === "boolean"
          ? data.fillEmptyDateKeys
          : DEFAULT_SETTINGS.fillEmptyDateKeys,
      showPropertiesBadge:
        typeof data.showPropertiesBadge === "boolean"
          ? data.showPropertiesBadge
          : DEFAULT_SETTINGS.showPropertiesBadge,
      showReadingTime:
        typeof data.showReadingTime === "boolean"
          ? data.showReadingTime
          : DEFAULT_SETTINGS.showReadingTime,
      showYamlCompleteness:
        typeof data.showYamlCompleteness === "boolean"
          ? data.showYamlCompleteness
          : DEFAULT_SETTINGS.showYamlCompleteness,
      showFileSize:
        typeof data.showFileSize === "boolean" ? data.showFileSize : DEFAULT_SETTINGS.showFileSize,
      showStaleWarning:
        typeof data.showStaleWarning === "boolean"
          ? data.showStaleWarning
          : DEFAULT_SETTINGS.showStaleWarning,
      staleAfterDays:
        typeof data.staleAfterDays === "number"
          ? data.staleAfterDays
          : DEFAULT_SETTINGS.staleAfterDays,
      showFocusTimer:
        typeof data.showFocusTimer === "boolean"
          ? data.showFocusTimer
          : DEFAULT_SETTINGS.showFocusTimer,
      showTasks: typeof data.showTasks === "boolean" ? data.showTasks : DEFAULT_SETTINGS.showTasks,
      showIsolated:
        typeof data.showIsolated === "boolean" ? data.showIsolated : DEFAULT_SETTINGS.showIsolated,
      wordsPerMinute:
        typeof data.wordsPerMinute === "number"
          ? data.wordsPerMinute
          : DEFAULT_SETTINGS.wordsPerMinute,
      showStatusBarClock:
        typeof data.showStatusBarClock === "boolean"
          ? data.showStatusBarClock
          : DEFAULT_SETTINGS.showStatusBarClock,
      statusBarDateFormat:
        typeof data.statusBarDateFormat === "string"
          ? data.statusBarDateFormat
          : DEFAULT_SETTINGS.statusBarDateFormat,
      statusBarTimeFormat:
        typeof data.statusBarTimeFormat === "string"
          ? data.statusBarTimeFormat
          : DEFAULT_SETTINGS.statusBarTimeFormat,
    };

    if (
      data.autoInsertCreatedOnCreate === undefined &&
      data.autoInsertUpdatedOnCreate === undefined &&
      typeof data.autoInsertDatesOnCreate === "boolean"
    ) {
      this.settings.autoInsertCreatedOnCreate = data.autoInsertDatesOnCreate;
      this.settings.autoInsertUpdatedOnCreate = data.autoInsertDatesOnCreate;
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.propertiesBadge?.refreshNow();
    this.statusBarClock?.refresh();
  }
}
