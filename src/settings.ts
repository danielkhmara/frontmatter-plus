export type PluginLocale = "en" | "de" | "zh" | "fr" | "ru";

const PLUGIN_LOCALES: readonly PluginLocale[] = ["en", "de", "zh", "fr", "ru"];

export function isPluginLocale(value: string): value is PluginLocale {
  return (PLUGIN_LOCALES as readonly string[]).includes(value);
}

export interface FolderTemplateRule {
  templatePath: string;
  folderPath: string;
}

export interface FrontmatterPlusSettings {
  locale: PluginLocale;
  createdKey: string;
  updatedKey: string;
  dateFormat: string;
  createDelayMs: number;
  updateDelayMs: number;
  autoInsertCreatedOnCreate: boolean;
  autoInsertUpdatedOnCreate: boolean;
  forceInsertCreated: boolean;
  forceInsertUpdated: boolean;
  fillEmptyDateKeys: boolean;
  excludedFolders: string[];
  excludedFiles: string[];
  ignoredProperties: string[];
  showPropertiesBadge: boolean;
  badgeScrollSpeed: number;
  showReadingTime: boolean;
  showYamlCompleteness: boolean;
  showFileSize: boolean;
  showStaleWarning: boolean;
  staleAfterDays: number;
  showFocusTimer: boolean;
  showTasks: boolean;
  showBacklinks: boolean;
  showIsolated: boolean;
  wordsPerMinute: number;
  folderTemplates: FolderTemplateRule[];
  showStatusBarClock: boolean;
  statusBarDateFormat: string;
  statusBarTimeFormat: string;
}

export const DEFAULT_SETTINGS: FrontmatterPlusSettings = {
  locale: "en",
  createdKey: "created",
  updatedKey: "updated",
  dateFormat: "YYYY-MM-DD[T]HH:mm:[00]",
  createDelayMs: 5000,
  updateDelayMs: 15000,
  autoInsertCreatedOnCreate: false,
  autoInsertUpdatedOnCreate: false,
  forceInsertCreated: false,
  forceInsertUpdated: false,
  fillEmptyDateKeys: true,
  excludedFolders: [],
  excludedFiles: [],
  ignoredProperties: [],
  showPropertiesBadge: true,
  badgeScrollSpeed: 30,
  showReadingTime: true,
  showYamlCompleteness: false,
  showFileSize: true,
  showStaleWarning: false,
  staleAfterDays: 30,
  showFocusTimer: true,
  showTasks: false,
  showBacklinks: false,
  showIsolated: false,
  wordsPerMinute: 200,
  folderTemplates: [],
  showStatusBarClock: false,
  statusBarDateFormat: "YYYY-MM-DD",
  statusBarTimeFormat: "HH:mm",
};

export function isRuleComplete(rule: FolderTemplateRule): boolean {
  return Boolean(rule.templatePath.trim() && rule.folderPath.trim());
}

export function pruneIncompleteRules(rules: FolderTemplateRule[]): FolderTemplateRule[] {
  return rules.filter(isRuleComplete);
}
