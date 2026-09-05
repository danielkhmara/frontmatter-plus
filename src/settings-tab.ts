import {
  AbstractInputSuggest,
  App,
  Notice,
  PluginSettingTab,
  setIcon,
  Setting,
  TFile,
  TFolder,
} from "obsidian";
import { t, tf } from "./i18n";
import type FrontmatterPlusPlugin from "./main";
import {
  DEFAULT_SETTINGS,
  isPluginLocale,
  isRuleComplete,
  pruneIncompleteRules,
} from "./settings";
import { formatNow } from "./time";

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private onSelectFolder: (folder: TFolder) => void
  ) {
    super(app, inputEl);
  }

  protected getSuggestions(query: string): TFolder[] {
    const q = query.toLowerCase();
    return this.app.vault
      .getAllLoadedFiles()
      .filter((f): f is TFolder => f instanceof TFolder)
      .filter((f) => f.path.toLowerCase().includes(q))
      .slice(0, 50);
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path || "/");
  }

  selectSuggestion(folder: TFolder): void {
    this.onSelectFolder(folder);
    this.close();
  }
}

class FileSuggest extends AbstractInputSuggest<TFile> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private onSelectFile: (file: TFile) => void
  ) {
    super(app, inputEl);
  }

  protected getSuggestions(query: string): TFile[] {
    const q = query.toLowerCase();
    return this.app.vault
      .getMarkdownFiles()
      .filter((f) => f.path.toLowerCase().includes(q))
      .slice(0, 50);
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path);
  }

  selectSuggestion(file: TFile): void {
    this.onSelectFile(file);
    this.close();
  }
}

export class FrontmatterPlusSettingTab extends PluginSettingTab {
  plugin: FrontmatterPlusPlugin;

  constructor(app: App, plugin: FrontmatterPlusPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private tr(key: string): string {
    return t(this.plugin.settings.locale, key);
  }

  private scrollParent(): HTMLElement | null {
    return (
      this.containerEl.closest(".vertical-tab-content") ??
      this.containerEl.closest(".mm-modal") ??
      this.containerEl.parentElement
    );
  }

  private redraw(): void {
    const parent = this.scrollParent();
    const top = parent?.scrollTop ?? 0;
    const active = document.activeElement;
    if (active instanceof HTMLElement && this.containerEl.contains(active)) {
      active.blur();
    }
    this.renderSettingsInto(this.containerEl);
    if (!parent) return;
    const restore = (): void => {
      parent.scrollTop = top;
    };
    restore();
    window.requestAnimationFrame(() => {
      restore();
      window.requestAnimationFrame(restore);
    });
  }

  getSettingDefinitions(): [] {
    return [];
  }

  display(): void {
    this.renderSettingsInto(this.containerEl);
  }

  hide(): void {
    this.plugin.settings.folderTemplates = pruneIncompleteRules(
      this.plugin.settings.folderTemplates
    );
    void this.plugin.saveSettings();
    super.hide();
  }

  private addNotice(parent: HTMLElement, body: string): void {
    if (!body.trim()) return;
    const notice = parent.createDiv({ cls: "fp-notice" });
    notice.createSpan({ cls: "fp-notice-label", text: this.tr("noticeLabel") });
    notice.createSpan({ cls: "fp-notice-body", text: ` ${body}` });
  }

  private setMomentFormatDesc(setting: Setting, format: string): void {
    const preview = tf(this.plugin.settings.locale, "statusBarFormatPreview", {
      preview: formatNow(format),
    });
    setting.setDesc(`${this.tr("statusBarMomentDesc")} ${preview}`);
  }

  private createSection(parent: HTMLElement, titleKey?: string): HTMLElement {
    const section = parent.createDiv({ cls: "setting-group fp-section" });
    if (titleKey) {
      new Setting(section).setName(this.tr(titleKey)).setHeading();
    }
    return section.createDiv({ cls: "setting-items fp-group" });
  }

  private renderSettingsInto(containerEl: HTMLElement): void {
    containerEl.empty();

    const language = this.createSection(containerEl);
    new Setting(language)
      .setName(this.tr("language"))
      .setDesc(this.tr("languageDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("en", this.tr("langEn"))
          .addOption("de", this.tr("langDe"))
          .addOption("zh", this.tr("langZh"))
          .addOption("fr", this.tr("langFr"))
          .addOption("ru", this.tr("langRu"))
          .setValue(this.plugin.settings.locale)
          .onChange(async (value) => {
            if (!isPluginLocale(value)) return;
            this.plugin.settings.locale = value;
            await this.plugin.saveSettings();
            this.redraw();
          });
      });

    const status = this.createSection(containerEl, "statusBarTitle");

    const statusShow = new Setting(status)
      .setName(this.tr("statusBarShow"))
      .setDesc(this.tr("statusBarShowDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showStatusBarClock).onChange(async (value) => {
          this.plugin.settings.showStatusBarClock = value;
          await this.plugin.saveSettings();
        })
      );
    this.addNotice(statusShow.descEl, this.tr("desktopOnlyBody"));

    const statusDate = new Setting(status).setName(this.tr("statusBarDateFormat"));
    this.setMomentFormatDesc(statusDate, this.plugin.settings.statusBarDateFormat);
    statusDate.addText((text) =>
      text
        .setPlaceholder("MMM D, YYYY")
        .setValue(this.plugin.settings.statusBarDateFormat)
        .onChange(async (value) => {
          this.plugin.settings.statusBarDateFormat = value.trim() || "YYYY-MM-DD";
          this.setMomentFormatDesc(statusDate, this.plugin.settings.statusBarDateFormat);
          await this.plugin.saveSettings();
        })
    );

    const statusTime = new Setting(status).setName(this.tr("statusBarTimeFormat"));
    this.setMomentFormatDesc(statusTime, this.plugin.settings.statusBarTimeFormat);
    statusTime.addText((text) =>
      text
        .setPlaceholder("h:mm A")
        .setValue(this.plugin.settings.statusBarTimeFormat)
        .onChange(async (value) => {
          this.plugin.settings.statusBarTimeFormat = value.trim() || "HH:mm";
          this.setMomentFormatDesc(statusTime, this.plugin.settings.statusBarTimeFormat);
          await this.plugin.saveSettings();
        })
    );

    const core = this.createSection(containerEl, "coreTitle");

    new Setting(core)
      .setName(this.tr("createdKey"))
      .setDesc(this.tr("createdKeyDesc"))
      .addText((text) =>
        text
          .setPlaceholder("created")
          .setValue(this.plugin.settings.createdKey)
          .onChange(async (value) => {
            this.plugin.settings.createdKey = value.trim() || "created";
            await this.plugin.saveSettings();
          })
      );

    new Setting(core)
      .setName(this.tr("updatedKey"))
      .setDesc(this.tr("updatedKeyDesc"))
      .addText((text) =>
        text
          .setPlaceholder("updated")
          .setValue(this.plugin.settings.updatedKey)
          .onChange(async (value) => {
            this.plugin.settings.updatedKey = value.trim() || "updated";
            await this.plugin.saveSettings();
          })
      );

    new Setting(core)
      .setName(this.tr("createDelay"))
      .setDesc(this.tr("createDelayDesc"))
      .addText((text) =>
        text
          .setPlaceholder("5000")
          .setValue(String(this.plugin.settings.createDelayMs))
          .onChange(async (value) => {
            const n = Number(value);
            this.plugin.settings.createDelayMs = Number.isFinite(n) && n >= 0 ? n : 5000;
            await this.plugin.saveSettings();
          })
      );

    new Setting(core)
      .setName(this.tr("updateDelay"))
      .setDesc(this.tr("updateDelayDesc"))
      .addText((text) =>
        text
          .setPlaceholder("15000")
          .setValue(String(this.plugin.settings.updateDelayMs))
          .onChange(async (value) => {
            const n = Number(value);
            this.plugin.settings.updateDelayMs = Number.isFinite(n) && n >= 0 ? n : 15000;
            await this.plugin.saveSettings();
          })
      );

    const dateFormat = new Setting(core).setName(this.tr("dateFormat"));
    this.setMomentFormatDesc(dateFormat, this.plugin.settings.dateFormat);
    dateFormat.addText((text) =>
      text
        .setPlaceholder("YYYY-MM-DD[T]HH:mm:[00]")
        .setValue(this.plugin.settings.dateFormat)
        .onChange(async (value) => {
          this.plugin.settings.dateFormat = value.trim() || "YYYY-MM-DD[T]HH:mm:[00]";
          this.setMomentFormatDesc(dateFormat, this.plugin.settings.dateFormat);
          await this.plugin.saveSettings();
        })
    );

    const triggers = this.createSection(containerEl, "triggersTitle");

    new Setting(triggers)
      .setName(this.tr("fillEmptyKeys"))
      .setDesc(this.tr("fillEmptyKeysDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.fillEmptyDateKeys).onChange(async (value) => {
          this.plugin.settings.fillEmptyDateKeys = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(triggers)
      .setName(this.tr("autoInsertCreated"))
      .setDesc(this.tr("autoInsertCreatedDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoInsertCreatedOnCreate)
          .onChange(async (value) => {
            this.plugin.settings.autoInsertCreatedOnCreate = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(triggers)
      .setName(this.tr("autoInsertUpdated"))
      .setDesc(this.tr("autoInsertUpdatedDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoInsertUpdatedOnCreate)
          .onChange(async (value) => {
            this.plugin.settings.autoInsertUpdatedOnCreate = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(triggers)
      .setName(this.tr("forceInsertCreated"))
      .setDesc(this.tr("forceInsertCreatedDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.forceInsertCreated).onChange(async (value) => {
          this.plugin.settings.forceInsertCreated = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(triggers)
      .setName(this.tr("forceInsertUpdated"))
      .setDesc(this.tr("forceInsertUpdatedDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.forceInsertUpdated).onChange(async (value) => {
          this.plugin.settings.forceInsertUpdated = value;
          await this.plugin.saveSettings();
        })
      );

    this.renderFolderTemplates(triggers);

    const exclusions = this.createSection(containerEl, "exclusionsTitle");
    this.renderPathList(
      exclusions,
      "files",
      this.tr("excludedFiles"),
      this.tr("excludedFilesDesc"),
      this.tr("filePlaceholder")
    );
    this.renderPathList(
      exclusions,
      "folders",
      this.tr("excludedFolders"),
      this.tr("excludedFoldersDesc"),
      this.tr("folderPlaceholder"),
      this.tr("exclusionsNote")
    );

    const badge = this.createSection(containerEl, "badgeTitle");

    new Setting(badge)
      .setName(this.tr("showBadge"))
      .setDesc(this.tr("showBadgeDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showPropertiesBadge).onChange(async (value) => {
          this.plugin.settings.showPropertiesBadge = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(badge)
      .setName(this.tr("readingTime"))
      .setDesc(this.tr("readingTimeDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showReadingTime).onChange(async (value) => {
          this.plugin.settings.showReadingTime = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(badge)
      .setName(this.tr("wpm"))
      .setDesc(this.tr("wpmDesc"))
      .addText((text) =>
        text
          .setPlaceholder("200")
          .setValue(String(this.plugin.settings.wordsPerMinute))
          .onChange(async (value) => {
            const n = Number(value);
            this.plugin.settings.wordsPerMinute =
              Number.isFinite(n) && n >= 60 ? Math.round(n) : 200;
            await this.plugin.saveSettings();
          })
      );

    new Setting(badge)
      .setName(this.tr("yamlPct"))
      .setDesc(this.tr("yamlPctDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showYamlCompleteness).onChange(async (value) => {
          this.plugin.settings.showYamlCompleteness = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(badge)
      .setName(this.tr("fileSize"))
      .setDesc(this.tr("fileSizeDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showFileSize).onChange(async (value) => {
          this.plugin.settings.showFileSize = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(badge)
      .setName(this.tr("focusTimer"))
      .setDesc(this.tr("focusTimerDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showFocusTimer).onChange(async (value) => {
          this.plugin.settings.showFocusTimer = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(badge)
      .setName(this.tr("staleWarning"))
      .setDesc(this.tr("staleWarningDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showStaleWarning).onChange(async (value) => {
          this.plugin.settings.showStaleWarning = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(badge)
      .setName(this.tr("staleDays"))
      .setDesc(this.tr("staleDaysDesc"))
      .addText((text) =>
        text
          .setPlaceholder("30")
          .setValue(String(this.plugin.settings.staleAfterDays))
          .onChange(async (value) => {
            const n = Number(value);
            this.plugin.settings.staleAfterDays =
              Number.isFinite(n) && n >= 1 ? Math.round(n) : 30;
            await this.plugin.saveSettings();
          })
      );

    new Setting(badge)
      .setName(this.tr("tasksIndicator"))
      .setDesc(this.tr("tasksIndicatorDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showTasks).onChange(async (value) => {
          this.plugin.settings.showTasks = value;
          await this.plugin.saveSettings();
        })
      );

    const isolated = new Setting(badge)
      .setName(this.tr("isolatedIndicator"))
      .setDesc(this.tr("isolatedIndicatorDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showIsolated).onChange(async (value) => {
          this.plugin.settings.showIsolated = value;
          await this.plugin.saveSettings();
        })
      );
    this.addNotice(isolated.descEl, this.tr("isolatedNote"));

    const backup = this.createSection(containerEl, "backupTitle");
    new Setting(backup)
      .setName(this.tr("backupName"))
      .setDesc(this.tr("backupDesc"))
      .addButton((btn) =>
        btn.setButtonText(this.tr("exportButton")).onClick(async () => {
          await this.plugin.service.exportSettings();
          new Notice(this.tr("exportResult"));
        })
      )
      .addButton((btn) =>
        btn.setButtonText(this.tr("importButton")).onClick(async () => {
          const ok = await this.plugin.service.importSettings();
          new Notice(this.tr(ok ? "importResult" : "importMissing"));
          if (ok) this.redraw();
        })
      );

    const resetItems = this.createSection(containerEl, "resetTitle");
    new Setting(resetItems)
      .setName(this.tr("fillEmptyName"))
      .setDesc(this.tr("fillEmptyDesc"))
      .addButton((btn) => {
        btn.setButtonText(this.tr("fillEmptyButton"));
        btn.onClick(async () => {
          btn.setDisabled(true);
          const count = await this.plugin.service.fillEmptyExisting();
          btn.setDisabled(false);
          new Notice(tf(this.plugin.settings.locale, "fillEmptyResult", { count }));
        });
      });
    new Setting(resetItems)
      .setName(this.tr("resetName"))
      .setDesc(this.tr("resetDesc"))
      .addButton((btn) => {
        btn.setButtonText(this.tr("resetButton"));
        btn.buttonEl.addClass("mod-destructive");
        btn.onClick(async () => {
          this.plugin.settings = {
            ...DEFAULT_SETTINGS,
            excludedFolders: [],
            excludedFiles: [],
            folderTemplates: [],
          };
          await this.plugin.saveSettings();
          this.redraw();
        });
      });
  }

  private renderPathList(
    group: HTMLElement,
    kind: "folders" | "files",
    name: string,
    desc: string,
    placeholder: string,
    noticeBody?: string
  ): void {
    const setting = new Setting(group).setName(name).setDesc(desc);
    if (noticeBody) this.addNotice(setting.descEl, noticeBody);

    const items =
      kind === "folders"
        ? this.plugin.settings.excludedFolders
        : this.plugin.settings.excludedFiles;

    if (items.length > 0) {
      setting.settingEl.addClass("fp-list-heading");
    }

    setting.addText((text) => {
      text.setPlaceholder(placeholder);
      const addPath = async (path: string): Promise<void> => {
        if (kind === "folders") {
          if (this.plugin.settings.excludedFolders.includes(path)) {
            text.setValue("");
            return;
          }
          this.plugin.settings.excludedFolders.push(path);
        } else {
          if (this.plugin.settings.excludedFiles.includes(path)) {
            text.setValue("");
            return;
          }
          this.plugin.settings.excludedFiles.push(path);
        }
        text.setValue("");
        text.inputEl.blur();
        await this.plugin.saveSettings();
        this.redraw();
      };
      if (kind === "folders") {
        new FolderSuggest(this.app, text.inputEl, (folder) => {
          void addPath(folder.path);
        });
      } else {
        new FileSuggest(this.app, text.inputEl, (file) => {
          void addPath(file.path);
        });
      }
    });

    if (items.length === 0) return;

    const list = group.createDiv({ cls: "fp-list-box" });
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = list.createDiv({ cls: "fp-list-row" });

      if (items.length > 1) {
        const handle = row.createDiv({
          cls: "clickable-icon fp-drag-handle",
          attr: { "aria-label": this.tr("dragToReorder"), draggable: "true" },
        });
        setIcon(handle, "grip-vertical");
        handle.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("text/plain", String(i));
          row.addClass("fp-dragging");
        });
        handle.addEventListener("dragend", () => {
          row.removeClass("fp-dragging");
        });
        row.addEventListener("dragover", (e) => {
          e.preventDefault();
        });
        row.addEventListener("drop", (e) => {
          e.preventDefault();
          const from = Number(e.dataTransfer?.getData("text/plain"));
          if (Number.isNaN(from) || from === i) return;
          const arr =
            kind === "folders"
              ? this.plugin.settings.excludedFolders
              : this.plugin.settings.excludedFiles;
          const [moved] = arr.splice(from, 1);
          arr.splice(i, 0, moved);
          void (async () => {
            await this.plugin.saveSettings();
            this.redraw();
          })();
        });
      }

      const input = row.createEl("input", {
        cls: "fp-path-input",
        attr: { type: "text", readonly: "true", value: item || "/" },
      });
      input.value = item || "/";
      input.tabIndex = -1;

      const remove = row.createDiv({
        cls: "clickable-icon",
        attr: { "aria-label": this.tr("remove") },
      });
      setIcon(remove, "x");
      remove.addEventListener("click", () => {
        void (async () => {
          if (kind === "folders") {
            this.plugin.settings.excludedFolders = this.plugin.settings.excludedFolders.filter(
              (f) => f !== item
            );
          } else {
            this.plugin.settings.excludedFiles = this.plugin.settings.excludedFiles.filter(
              (f) => f !== item
            );
          }
          await this.plugin.saveSettings();
          this.redraw();
        })();
      });
    }
  }

  private renderFolderTemplates(group: HTMLElement): void {
    const heading = new Setting(group)
      .setName(this.tr("templatesTitle"))
      .setDesc(this.tr("templatesDesc"))
      .addButton((btn) =>
        btn.setButtonText(this.tr("addRule")).onClick(() => {
          const rules = this.plugin.settings.folderTemplates;
          if (rules.some((r) => !isRuleComplete(r))) return;
          rules.push({ templatePath: "", folderPath: "" });
          btn.buttonEl.blur();
          this.redraw();
        })
      );
    const rules = this.plugin.settings.folderTemplates;
    if (rules.length > 0) {
      heading.settingEl.addClass("fp-list-heading");
    }
    if (rules.length === 0) return;

    const list = group.createDiv({ cls: "fp-list-box" });
    const conflictEls: HTMLElement[] = [];

    const updateConflicts = (): void => {
      for (let idx = 0; idx < rules.length; idx++) {
        const r = rules[idx];
        const conflict = rules.some(
          (other, j) =>
            j !== idx &&
            r.folderPath !== "" &&
            other.folderPath === r.folderPath &&
            other.templatePath !== r.templatePath
        );
        const el = conflictEls[idx];
        if (!el) continue;
        if (conflict) {
          el.empty();
          el.createSpan({ cls: "fp-notice-label", text: this.tr("noticeLabel") });
          el.createSpan({ cls: "fp-notice-body", text: ` ${this.tr("templateConflict")}` });
          el.show();
        } else {
          el.hide();
        }
      }
    };

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const row = list.createDiv({ cls: "fp-list-row" });

      if (rules.length > 1) {
        const handle = row.createDiv({
          cls: "clickable-icon fp-drag-handle",
          attr: { "aria-label": this.tr("dragToReorder"), draggable: "true" },
        });
        setIcon(handle, "grip-vertical");
        handle.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("text/plain", String(i));
          row.addClass("fp-dragging");
        });
        handle.addEventListener("dragend", () => {
          row.removeClass("fp-dragging");
        });
        row.addEventListener("dragover", (e) => {
          e.preventDefault();
        });
        row.addEventListener("drop", (e) => {
          e.preventDefault();
          const from = Number(e.dataTransfer?.getData("text/plain"));
          if (Number.isNaN(from) || from === i) return;
          const arr = this.plugin.settings.folderTemplates;
          const [moved] = arr.splice(from, 1);
          arr.splice(i, 0, moved);
          void (async () => {
            await this.persistRules();
            this.redraw();
          })();
        });
      }

      const templateInput = row.createEl("input", {
        cls: "fp-rule-input",
        attr: { type: "text", placeholder: this.tr("filePlaceholder") },
      });
      templateInput.value = rule.templatePath;
      new FileSuggest(this.app, templateInput, (file) => {
        void (async () => {
          rule.templatePath = file.path;
          templateInput.value = file.path;
          await this.persistRules();
          updateConflicts();
        })();
      });
      templateInput.addEventListener("input", () => {
        rule.templatePath = templateInput.value.trim();
        updateConflicts();
      });
      templateInput.addEventListener("change", () => {
        void (async () => {
          rule.templatePath = templateInput.value.trim();
          await this.persistRules();
          updateConflicts();
        })();
      });

      const arrow = row.createDiv({ cls: "fp-rule-arrow" });
      setIcon(arrow, "arrow-right");

      const folderInput = row.createEl("input", {
        cls: "fp-rule-input",
        attr: { type: "text", placeholder: this.tr("folderPlaceholder") },
      });
      folderInput.value = rule.folderPath;
      new FolderSuggest(this.app, folderInput, (folder) => {
        void (async () => {
          rule.folderPath = folder.path;
          folderInput.value = folder.path;
          await this.persistRules();
          updateConflicts();
        })();
      });
      folderInput.addEventListener("input", () => {
        rule.folderPath = folderInput.value.trim();
        updateConflicts();
      });
      folderInput.addEventListener("change", () => {
        void (async () => {
          rule.folderPath = folderInput.value.trim();
          await this.persistRules();
          updateConflicts();
        })();
      });

      const remove = row.createDiv({
        cls: "clickable-icon",
        attr: { "aria-label": this.tr("remove") },
      });
      setIcon(remove, "x");
      remove.addEventListener("click", () => {
        void (async () => {
          this.plugin.settings.folderTemplates.splice(i, 1);
          await this.persistRules();
          this.redraw();
        })();
      });

      const conflictEl = list.createDiv({ cls: "fp-notice" });
      conflictEl.hide();
      conflictEls.push(conflictEl);
    }

    updateConflicts();
  }

  private async persistRules(): Promise<void> {
    const complete = pruneIncompleteRules(this.plugin.settings.folderTemplates);
    const drafts = this.plugin.settings.folderTemplates.filter((r) => !isRuleComplete(r));
    await this.plugin.saveData(
      Object.assign({}, this.plugin.settings, { folderTemplates: complete })
    );
    this.plugin.settings.folderTemplates = [...complete, ...drafts];
    this.plugin.propertiesBadge?.refreshNow();
    this.plugin.statusBarClock?.refresh();
  }
}
