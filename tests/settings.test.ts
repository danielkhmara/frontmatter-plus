import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SETTINGS, isPluginLocale, isRuleComplete, pruneIncompleteRules } from "../src/settings";

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
