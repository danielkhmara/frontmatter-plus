import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { t, TABLES, tf } from "../src/i18n";

const PLACEHOLDER_RE = /\{(\w+)\}/g;
const locales = Object.keys(TABLES) as (keyof typeof TABLES)[];
const englishKeys = Object.keys(TABLES.en).sort();

function placeholders(text: string): string[] {
  return Array.from(text.matchAll(PLACEHOLDER_RE), (match) => match[1]).sort();
}

function keysUsedInSource(): Set<string> {
  const used = new Set<string>();
  const patterns = [
    /this\.tr\(([^)]*)\)/g,
    /createSection\(\s*\w+\s*,\s*"(\w+)"/g,
    /\btf\(\s*[^,]+,\s*"(\w+)"/g,
    /\bt\(\s*[^,]+,\s*"(\w+)"/g,
  ];
  for (const name of readdirSync("src").filter((file) => file.endsWith(".ts"))) {
    const source = readFileSync(join("src", name), "utf8");
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        for (const literal of match[0].matchAll(/"(\w+)"/g)) used.add(literal[1]);
      }
    }
  }
  return used;
}

describe("translations", () => {
  it("include the same keys in every language", () => {
    for (const locale of locales) {
      assert.deepEqual(Object.keys(TABLES[locale]).sort(), englishKeys, `keys differ in "${locale}"`);
    }
  });

  it("use the same placeholders in every language", () => {
    for (const key of englishKeys) {
      const expected = placeholders(TABLES.en[key]);
      for (const locale of locales) {
        assert.deepEqual(placeholders(TABLES[locale][key]), expected, `placeholders differ in "${locale}.${key}"`);
      }
    }
  });

  it("have no empty texts", () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(TABLES[locale])) {
        assert.ok(value.trim().length > 0, `"${locale}.${key}" is empty`);
      }
    }
  });

  it("contain every key the code refers to", () => {
    const used = keysUsedInSource();
    assert.ok(used.size > 50, "too few keys were found in the source, check the patterns");
    const missing = Array.from(used).filter((key) => !(key in TABLES.en)).sort();
    assert.deepEqual(missing, []);
  });
});

describe("t and tf", () => {
  it("return the text for the requested language", () => {
    assert.equal(t("ru", "remove"), TABLES.ru.remove);
  });

  it("fall back to the key for unknown keys", () => {
    assert.equal(t("en", "noSuchKey"), "noSuchKey");
  });

  it("substitute every occurrence of a placeholder", () => {
    assert.equal(tf("en", "indicatorBacklinks", { n: 3 }), TABLES.en.indicatorBacklinks.split("{n}").join("3"));
  });
});
