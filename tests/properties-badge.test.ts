import "./support/environment";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { t as translate, tf } from "../src/i18n";
import type { FrontmatterPlusSettings } from "../src/settings";
import { localTime, useClock } from "./support/clock";
import { createPlugin } from "./support/plugin";

const ALL_OFF: Partial<FrontmatterPlusSettings> = {
  showReadingTime: false,
  showYamlCompleteness: false,
  showFileSize: false,
  showFocusTimer: false,
  showStaleWarning: false,
  showTasks: false,
  showBacklinks: false,
  showIsolated: false,
};

async function label(
  content: string,
  settings: Partial<FrontmatterPlusSettings>,
  links: Record<string, Record<string, number>> = {},
  path = "Notes/Target.md"
): Promise<string> {
  const plugin = createPlugin({ ...ALL_OFF, ...settings });
  plugin.app.metadataCache.resolvedLinks = links;
  const file = plugin.app.vault.add(path, content);
  return (plugin.badge as unknown as { buildLabel(file: unknown): Promise<string> }).buildLabel(file);
}

describe("file summary", () => {
  it("shows reading time rounded up to whole minutes", async () => {
    const words = Array.from({ length: 450 }, () => "word").join(" ");
    assert.equal(await label(words, { showReadingTime: true, wordsPerMinute: 200 }), tf("en", "indicatorMinRead", { n: 3 }));
    assert.equal(await label("", { showReadingTime: true }), tf("en", "indicatorMinRead", { n: 0 }));
  });

  it("does not count properties as reading text", async () => {
    const content = `---\nsummary: ${Array.from({ length: 500 }, () => "word").join(" ")}\n---\nOne two three\n`;
    assert.equal(await label(content, { showReadingTime: true }), tf("en", "indicatorMinRead", { n: 1 }));
  });

  it("shows how many properties are filled", async () => {
    const content = "---\ntags:\n  - a\ncreated: 2026-01-01\ntopics: []\n---\n";
    assert.equal(await label(content, { showYamlCompleteness: true }), tf("en", "indicatorYaml", { n: 67 }));
  });

  it("shows completed tasks", async () => {
    const content = "- [x] Done\n- [ ] Open\n* [X] Also done\nText - [ ] not a task\n";
    assert.equal(await label(content, { showTasks: true }), tf("en", "indicatorTasks", { done: 2, total: 3 }));
    assert.equal(await label("No tasks here\n", { showTasks: true }), "");
  });

  it("shows notes as stale after the configured number of days", async (t) => {
    useClock(t, localTime(2026, 10, 5, 12));
    const plugin = createPlugin({ ...ALL_OFF, showStaleWarning: true, staleAfterDays: 30 });
    const fresh = plugin.app.vault.add("Notes/Fresh.md", "Text", { mtime: localTime(2026, 9, 20) });
    const stale = plugin.app.vault.add("Notes/Stale.md", "Text", { mtime: localTime(2026, 8, 1) });
    const build = (file: unknown) =>
      (plugin.badge as unknown as { buildLabel(file: unknown): Promise<string> }).buildLabel(file);
    assert.equal(await build(fresh), "");
    assert.equal(await build(stale), tf("en", "indicatorStale", { n: 65 }));
  });

  it("marks broken properties", async () => {
    const result = await label("---\nkey: [unclosed\n---\nText\n", {});
    assert.equal(result, `${translate("en", "noticeLabel")} ${translate("en", "indicatorYamlError")}`);
  });

  it("uses the plugin language", async () => {
    assert.equal(await label("one two", { showReadingTime: true, locale: "ru" }), tf("ru", "indicatorMinRead", { n: 1 }));
  });

  it("joins several parts in a fixed order", async () => {
    const result = await label("- [ ] Task\n", { showReadingTime: true, showTasks: true, showBacklinks: true });
    assert.equal(
      result,
      [
        tf("en", "indicatorMinRead", { n: 1 }),
        tf("en", "indicatorTasks", { done: 0, total: 1 }),
        tf("en", "indicatorBacklinks", { n: 0 }),
      ].join("  ·  ")
    );
  });
});

describe("backlinks in the file summary", () => {
  const target = "Notes/Target.md";

  it("count each linking note once and ignore links to itself", async () => {
    const links = {
      "Notes/A.md": { [target]: 3, "Notes/X.md": 1 },
      "Notes/B.md": { [target]: 1 },
      [target]: { [target]: 2 },
      "Notes/C.md": { [target]: 0 },
    };
    assert.equal(await label("Text", { showBacklinks: true }, links), tf("en", "indicatorBacklinks", { n: 2 }));
  });

  it("show zero when nothing links to the note", async () => {
    assert.equal(await label("Text", { showBacklinks: true }, {}), tf("en", "indicatorBacklinks", { n: 0 }));
  });
});

describe("isolated notes in the file summary", () => {
  const target = "Notes/Target.md";
  const isolated = translate("en", "indicatorIsolated");

  const cases: [string, Record<string, Record<string, number>>, boolean][] = [
    ["a note without links", {}, true],
    ["a note that only links to itself", { [target]: { [target]: 1 } }, false],
    ["a note with outgoing links", { [target]: { "Notes/A.md": 1 } }, false],
    ["a note with incoming links", { "Notes/A.md": { [target]: 1 } }, false],
    ["a note with zero counters only", { [target]: { "Notes/A.md": 0 }, "Notes/A.md": { [target]: 0 } }, true],
  ];

  for (const [name, links, expected] of cases) {
    it(`${expected ? "mark" : "do not mark"} ${name}`, async () => {
      assert.equal(await label("Text", { showIsolated: true }, links), expected ? isolated : "");
    });
  }

  it("agree with the backlinks count when both are shown", async () => {
    const links = { "Notes/A.md": { [target]: 1 } };
    assert.equal(
      await label("Text", { showIsolated: true, showBacklinks: true }, links),
      tf("en", "indicatorBacklinks", { n: 1 })
    );
    assert.equal(
      await label("Text", { showIsolated: true, showBacklinks: true }, {}),
      [tf("en", "indicatorBacklinks", { n: 0 }), isolated].join("  ·  ")
    );
  });
});

describe("file summary statistics", () => {
  type Badge = { buildLabel(file: unknown): Promise<string>; forgetFile(path: string): void; onFocusTick(): void; refreshNow(): void };

  it("are reused while the note does not change", async (t) => {
    const plugin = createPlugin({ ...ALL_OFF, showReadingTime: true });
    const file = plugin.app.vault.add("Notes/Plan.md", "one two three");
    const reads = t.mock.method(plugin.app.vault, "cachedRead");
    const badge = plugin.badge as unknown as Badge;
    await badge.buildLabel(file);
    await badge.buildLabel(file);
    assert.equal(reads.mock.callCount(), 1);
  });

  it("are recalculated after the note changes", async (t) => {
    const clock = useClock(t, localTime(2026, 10, 5, 12));
    const plugin = createPlugin({ ...ALL_OFF, showTasks: true });
    const file = plugin.app.vault.add("Notes/Plan.md", "- [ ] One\n");
    const badge = plugin.badge as unknown as Badge;
    assert.equal(await badge.buildLabel(file), tf("en", "indicatorTasks", { done: 0, total: 1 }));
    clock.advance(1000);
    await plugin.app.vault.modify(file, "- [x] One\n");
    assert.equal(await badge.buildLabel(file), tf("en", "indicatorTasks", { done: 1, total: 1 }));
  });

  it("are recalculated after the properties of the note are reindexed", async (t) => {
    const plugin = createPlugin({ ...ALL_OFF, showYamlCompleteness: true });
    const file = plugin.app.vault.add("Notes/Plan.md", "---\nstatus: draft\nowner:\n---\n");
    const badge = plugin.badge as unknown as Badge;
    assert.equal(await badge.buildLabel(file), tf("en", "indicatorYaml", { n: 50 }));
    const reads = t.mock.method(plugin.app.vault, "cachedRead");
    badge.forgetFile(file.path);
    await badge.buildLabel(file);
    assert.equal(reads.mock.callCount(), 1);
  });

  it("refresh every second only when the editing time is shown", (t) => {
    const plugin = createPlugin({ showPropertiesBadge: true, showFocusTimer: true });
    const badge = plugin.badge as unknown as Badge;
    const refreshes = t.mock.method(badge, "refreshNow", () => undefined);
    badge.onFocusTick();
    plugin.settings.showFocusTimer = false;
    badge.onFocusTick();
    plugin.settings.showFocusTimer = true;
    plugin.settings.showPropertiesBadge = false;
    badge.onFocusTick();
    assert.equal(refreshes.mock.callCount(), 1);
  });
});
