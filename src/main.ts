import { MarkdownView, Plugin, TFile } from "obsidian";
import { FocusSessionTracker } from "./focus-session";
import { FrontmatterService } from "./frontmatter-service";
import { PathSync } from "./path-sync";
import { PropertiesBadge } from "./properties-badge";
import { DEFAULT_SETTINGS, normalizeSettings, type FrontmatterPlusSettings } from "./settings";
import { FrontmatterPlusSettingTab } from "./settings-tab";
import { StatusBarClock } from "./status-bar-clock";
import { TemplateRouter } from "./template-router";

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
    this.focusSession.onload(() => this.propertiesBadge.onFocusTick());
    this.statusBarClock.onload();
    this.addSettingTab(new FrontmatterPlusSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      this.rememberOpenFiles();
      this.registerEvent(
        this.app.vault.on("create", (file) => {
          if (!(file instanceof TFile) || file.extension !== "md") return;
          if (this.pathSync.isSuppressed(file.path)) return;
          const createdAt = Date.now();
          void (async () => {
            const copySources = await this.service.findCopySources(file);
            await this.templateRouter.maybeApply(file, createdAt);
            this.service.scheduleCreate(file, createdAt, copySources);
          })();
        })
      );
    });

    this.registerEvent(
      this.app.workspace.on("editor-change", (_editor, info) => {
        if (info.file) this.service.markUserEdit(info.file.path);
      })
    );

    const markPropertiesEdit = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".metadata-container")) return;
      const file = this.app.workspace.getActiveFile();
      if (file) this.service.markUserEdit(file.path);
    };
    this.registerDomEvent(document, "input", markPropertiesEdit, true);
    this.registerDomEvent(document, "change", markPropertiesEdit, true);
    this.registerDomEvent(document, "click", markPropertiesEdit, true);
    this.registerDomEvent(document, "keydown", markPropertiesEdit, true);

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file) void this.service.rememberContent(file);
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

  rememberOpenFiles(): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView && leaf.view.file) {
        void this.service.rememberContent(leaf.view.file);
      }
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    if (this.service?.forgetContentIfStale()) this.rememberOpenFiles();
    this.propertiesBadge?.refreshNow();
    this.statusBarClock?.refresh();
  }
}
