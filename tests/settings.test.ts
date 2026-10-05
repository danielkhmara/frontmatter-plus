import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SETTINGS,
  isPluginLocale,
  isRuleComplete,
  normalizeSettings,
  pruneIncompleteRules,
  type FrontmatterPlusSettings,
} from "../src/settings";

describe("default settings", () => {
  it("use English and the standard property names", () => {
    assert.equal(DEFAULT_SETTINGS.locale, "en");
    assert.equal(DEFAULT_SETTINGS.createdKey, "created");
    assert.equal(DEFAULT_SETTINGS.updatedKey, "updated");
  });

  it("start with empty lists", () => {
    assert.deepEqual(DEFAULT_SETTINGS.excludedFolders, []);
    assert.deepEqual(DEFAULT_SETTINGS.excludedFiles, []);
    assert.deepEqual(DEFAULT_SETTINGS.ignoredProperties, []);
    assert.deepEqual(DEFAULT_SETTINGS.folderTemplates, []);
  });

  it("have non-negative delays and a positive reading speed", () => {
    assert.ok(DEFAULT_SETTINGS.createDelayMs >= 0);
    assert.ok(DEFAULT_SETTINGS.updateDelayMs >= 0);
    assert.ok(DEFAULT_SETTINGS.wordsPerMinute > 0);
    assert.ok(DEFAULT_SETTINGS.badgeScrollSpeed >= 0);
  });
});

describe("isPluginLocale", () => {
  it("accepts supported locales only", () => {
    for (const locale of ["en", "de", "zh", "fr", "ru"]) assert.ok(isPluginLocale(locale));
    for (const locale of ["", "EN", "es", "zh-cn"]) assert.ok(!isPluginLocale(locale));
  });
});

describe("folder template rules", () => {
  it("are complete only with both a template and a folder", () => {
    assert.ok(isRuleComplete({ templatePath: "Templates/Note.md", folderPath: "Notes" }));
    assert.ok(!isRuleComplete({ templatePath: "", folderPath: "Notes" }));
    assert.ok(!isRuleComplete({ templatePath: "Templates/Note.md", folderPath: "  " }));
  });

  it("drop incomplete rules and keep the order of the rest", () => {
    const rules = [
      { templatePath: "A.md", folderPath: "A" },
      { templatePath: "", folderPath: "B" },
      { templatePath: "C.md", folderPath: "C" },
    ];
    assert.deepEqual(pruneIncompleteRules(rules), [rules[0], rules[2]]);
  });
});

describe("normalizeSettings", () => {
  const custom: FrontmatterPlusSettings = {
    ...DEFAULT_SETTINGS,
    locale: "de",
    createdKey: "createdAt",
    updatedKey: "updatedAt",
    dateFormat: "YYYY-MM-DD",
    createDelayMs: 1000,
    updateDelayMs: 0,
    fillEmptyDateKeys: false,
    excludedFolders: ["Archive"],
    excludedFiles: ["Inbox.md"],
    ignoredProperties: ["favorite"],
    badgeScrollSpeed: 0,
    showTasks: true,
    wordsPerMinute: 250,
    folderTemplates: [{ templatePath: "Templates/Project.md", folderPath: "Projects" }],
    statusBarTimeFormat: "HH:mm:ss",
  };

  it("returns the defaults for anything that is not an object", () => {
    for (const value of [undefined, null, 42, "text", []]) {
      assert.deepEqual(normalizeSettings(value), DEFAULT_SETTINGS);
    }
  });

  it("keeps every valid value", () => {
    assert.deepEqual(normalizeSettings(JSON.parse(JSON.stringify(custom))), custom);
  });

  it("falls back to the default for values of the wrong type", () => {
    const result = normalizeSettings({
      createdKey: 5,
      createDelayMs: "5000",
      updateDelayMs: null,
      fillEmptyDateKeys: "yes",
      showTasks: 1,
      wordsPerMinute: Number.NaN,
      badgeScrollSpeed: Number.POSITIVE_INFINITY,
      statusBarDateFormat: false,
    });
    assert.equal(result.createdKey, DEFAULT_SETTINGS.createdKey);
    assert.equal(result.createDelayMs, DEFAULT_SETTINGS.createDelayMs);
    assert.equal(result.updateDelayMs, DEFAULT_SETTINGS.updateDelayMs);
    assert.equal(result.fillEmptyDateKeys, DEFAULT_SETTINGS.fillEmptyDateKeys);
    assert.equal(result.showTasks, DEFAULT_SETTINGS.showTasks);
    assert.equal(result.wordsPerMinute, DEFAULT_SETTINGS.wordsPerMinute);
    assert.equal(result.badgeScrollSpeed, DEFAULT_SETTINGS.badgeScrollSpeed);
    assert.equal(result.statusBarDateFormat, DEFAULT_SETTINGS.statusBarDateFormat);
  });

  it("accepts supported languages only", () => {
    assert.equal(normalizeSettings({ locale: "ru" }).locale, "ru");
    assert.equal(normalizeSettings({ locale: "es" }).locale, "en");
    assert.equal(normalizeSettings({ locale: 1 }).locale, "en");
  });

  it("keeps only text items in lists", () => {
    const result = normalizeSettings({ excludedFolders: ["Archive", 1, null, "Drafts"], ignoredProperties: "favorite" });
    assert.deepEqual(result.excludedFolders, ["Archive", "Drafts"]);
    assert.deepEqual(result.ignoredProperties, []);
  });

  it("keeps only complete folder template rules", () => {
    const result = normalizeSettings({
      folderTemplates: [
        { templatePath: "Templates/Project.md", folderPath: "Projects" },
        { templatePath: "", folderPath: "Notes" },
        { templatePath: "Templates/Meeting.md" },
        "Templates/Other.md",
      ],
    });
    assert.deepEqual(result.folderTemplates, [{ templatePath: "Templates/Project.md", folderPath: "Projects" }]);
  });

  it("drops unknown keys", () => {
    assert.ok(!("unknownKey" in normalizeSettings({ unknownKey: true })));
  });

  it("creates new lists that do not share memory with the defaults", () => {
    const result = normalizeSettings({});
    result.excludedFolders.push("Archive");
    result.ignoredProperties.push("favorite");
    result.folderTemplates.push({ templatePath: "A.md", folderPath: "A" });
    assert.deepEqual(DEFAULT_SETTINGS.excludedFolders, []);
    assert.deepEqual(DEFAULT_SETTINGS.ignoredProperties, []);
    assert.deepEqual(DEFAULT_SETTINGS.folderTemplates, []);
  });

  it("migrates the old single setting for inserting dates", () => {
    const migrated = normalizeSettings({ autoInsertDatesOnCreate: true });
    assert.equal(migrated.autoInsertCreatedOnCreate, true);
    assert.equal(migrated.autoInsertUpdatedOnCreate, true);

    const current = normalizeSettings({ autoInsertDatesOnCreate: true, autoInsertCreatedOnCreate: false });
    assert.equal(current.autoInsertCreatedOnCreate, false);
    assert.equal(current.autoInsertUpdatedOnCreate, DEFAULT_SETTINGS.autoInsertUpdatedOnCreate);
  });
});
