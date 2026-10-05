import { isRecord } from "./utils";

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

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

const NUMBER_MINIMUMS = {
  createDelayMs: 0,
  updateDelayMs: 0,
  badgeScrollSpeed: 0,
  staleAfterDays: 1,
  wordsPerMinute: 60,
} as const;

type NumberSetting = keyof typeof NUMBER_MINIMUMS;

export function parseNumberSetting(key: NumberSetting, value: string): number {
  const text = value.trim();
  const n = Number(text);
  return text !== "" && Number.isFinite(n) && n >= NUMBER_MINIMUMS[key]
    ? Math.round(n)
    : DEFAULT_SETTINGS[key];
}

function asNumber(value: unknown, key: NumberSetting): number {
  return typeof value === "number" && Number.isFinite(value) && value >= NUMBER_MINIMUMS[key]
    ? value
    : DEFAULT_SETTINGS[key];
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

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

export function normalizeSettings(raw: unknown): FrontmatterPlusSettings {
  const data = isRecord(raw) ? raw : {};
  const d = DEFAULT_SETTINGS;

  const settings: FrontmatterPlusSettings = {
    locale: typeof data.locale === "string" && isPluginLocale(data.locale) ? data.locale : d.locale,
    createdKey: asString(data.createdKey, d.createdKey),
    updatedKey: asString(data.updatedKey, d.updatedKey),
    dateFormat: asString(data.dateFormat, d.dateFormat),
    createDelayMs: asNumber(data.createDelayMs, "createDelayMs"),
    updateDelayMs: asNumber(data.updateDelayMs, "updateDelayMs"),
    autoInsertCreatedOnCreate: asBoolean(data.autoInsertCreatedOnCreate, d.autoInsertCreatedOnCreate),
    autoInsertUpdatedOnCreate: asBoolean(data.autoInsertUpdatedOnCreate, d.autoInsertUpdatedOnCreate),
    forceInsertCreated: asBoolean(data.forceInsertCreated, d.forceInsertCreated),
    forceInsertUpdated: asBoolean(data.forceInsertUpdated, d.forceInsertUpdated),
    fillEmptyDateKeys: asBoolean(data.fillEmptyDateKeys, d.fillEmptyDateKeys),
    excludedFolders: asStringArray(data.excludedFolders),
    excludedFiles: asStringArray(data.excludedFiles),
    ignoredProperties: asStringArray(data.ignoredProperties),
    showPropertiesBadge: asBoolean(data.showPropertiesBadge, d.showPropertiesBadge),
    badgeScrollSpeed: asNumber(data.badgeScrollSpeed, "badgeScrollSpeed"),
    showReadingTime: asBoolean(data.showReadingTime, d.showReadingTime),
    showYamlCompleteness: asBoolean(data.showYamlCompleteness, d.showYamlCompleteness),
    showFileSize: asBoolean(data.showFileSize, d.showFileSize),
    showStaleWarning: asBoolean(data.showStaleWarning, d.showStaleWarning),
    staleAfterDays: asNumber(data.staleAfterDays, "staleAfterDays"),
    showFocusTimer: asBoolean(data.showFocusTimer, d.showFocusTimer),
    showTasks: asBoolean(data.showTasks, d.showTasks),
    showBacklinks: asBoolean(data.showBacklinks, d.showBacklinks),
    showIsolated: asBoolean(data.showIsolated, d.showIsolated),
    wordsPerMinute: asNumber(data.wordsPerMinute, "wordsPerMinute"),
    folderTemplates: pruneIncompleteRules(asFolderRules(data.folderTemplates)),
    showStatusBarClock: asBoolean(data.showStatusBarClock, d.showStatusBarClock),
    statusBarDateFormat: asString(data.statusBarDateFormat, d.statusBarDateFormat),
    statusBarTimeFormat: asString(data.statusBarTimeFormat, d.statusBarTimeFormat),
  };

  if (
    data.autoInsertCreatedOnCreate === undefined &&
    data.autoInsertUpdatedOnCreate === undefined &&
    typeof data.autoInsertDatesOnCreate === "boolean"
  ) {
    settings.autoInsertCreatedOnCreate = data.autoInsertDatesOnCreate;
    settings.autoInsertUpdatedOnCreate = data.autoInsertDatesOnCreate;
  }

  return settings;
}
