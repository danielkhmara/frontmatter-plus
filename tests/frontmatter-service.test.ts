import "./support/environment";
import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";
import { bodyOf, frontmatterOf } from "./support/app";
import { localTime, settle, useClock } from "./support/clock";
import { note, property, stamp } from "./support/notes";
import { createPlugin } from "./support/plugin";

const T0 = localTime(2026, 10, 5, 12, 0);
const OLD_CREATED = "2024-01-01T10:00:00";
const OLD_UPDATED = "2025-05-05T10:00:00";
const DATED = note(`tags:\n  - projects\ncreated: ${OLD_CREATED}\nupdated: ${OLD_UPDATED}\nrating: 3`);

describe("creating notes", () => {
  it("fills empty dates with the time of creation, not the time of writing", async (t) => {
    const clock = useClock(t, T0);
    const plugin = createPlugin();
    const file = plugin.app.vault.add("Notes/New.md", note("created:\nupdated:"));
    clock.set(T0 + 5 * 60 * 1000);
    plugin.service.scheduleCreate(file, T0, []);
    await settle();
    assert.equal(property(plugin.app.vault, file, "created"), stamp(T0));
    assert.equal(property(plugin.app.vault, file, "updated"), stamp(T0));
  });

  it("reads properties from the file even when the metadata cache is not ready", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin();
    const file = plugin.app.vault.add("Notes/Second.md", note("created:\nupdated:"));
    plugin.app.metadataCache.markStale(file.path);
    plugin.service.scheduleCreate(file, T0, []);
    await settle();
    assert.equal(property(plugin.app.vault, file, "created"), stamp(T0));
  });

  it("keeps dates that are already filled", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin();
    const file = plugin.app.vault.add("Notes/Dated.md", DATED);
    plugin.service.scheduleCreate(file, T0, []);
    await settle();
    assert.equal(plugin.app.vault.writes(file.path), 0);
    assert.equal(property(plugin.app.vault, file, "created"), OLD_CREATED);
  });

  it("leaves empty dates when filling is turned off", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin({ fillEmptyDateKeys: false });
    const file = plugin.app.vault.add("Notes/New.md", note("created:\nupdated:"));
    plugin.service.scheduleCreate(file, T0, []);
    await settle();
    assert.equal(plugin.app.vault.writes(file.path), 0);
  });

  it("adds date fields to notes without properties only when enabled", async (t) => {
    useClock(t, T0);
    const off = createPlugin();
    const plain = off.app.vault.add("Notes/Plain.md", "Just text\n");
    off.service.scheduleCreate(plain, T0, []);
    await settle();
    assert.equal(off.app.vault.writes(plain.path), 0);

    const on = createPlugin({ autoInsertCreatedOnCreate: true, autoInsertUpdatedOnCreate: true });
    const file = on.app.vault.add("Notes/Plain.md", "Just text\n");
    on.service.scheduleCreate(file, T0, []);
    await settle();
    assert.equal(property(on.app.vault, file, "created"), stamp(T0));
    assert.equal(property(on.app.vault, file, "updated"), stamp(T0));
    assert.equal(bodyOf(on.app.vault.content(file.path)), "Just text\n");
  });

  it("does not touch excluded files and folders", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin({ excludedFolders: ["Archive"], excludedFiles: ["Notes/Skip.md"] });
    const inFolder = plugin.app.vault.add("Archive/Deep/A.md", note("created:"));
    const skipped = plugin.app.vault.add("Notes/Skip.md", note("created:"));
    plugin.service.scheduleCreate(inFolder, T0, []);
    plugin.service.scheduleCreate(skipped, T0, []);
    await settle();
    assert.equal(plugin.app.vault.totalWrites(), 0);
  });
});

describe("copied notes", () => {
  async function copy(t: TestContext, path: string) {
    useClock(t, T0);
    const plugin = createPlugin();
    const original = plugin.app.vault.add("Notes/Original.md", DATED);
    const file = plugin.app.vault.add(path, DATED);
    const sources = await plugin.service.findCopySources(file);
    return { plugin, original, file, sources };
  }

  it("get their own dates in the same folder, whatever the name", async (t) => {
    const { plugin, file, sources } = await copy(t, "Notes/Anything.md");
    plugin.service.scheduleCreate(file, T0, sources);
    await settle();
    assert.equal(property(plugin.app.vault, file, "created"), stamp(T0));
    assert.equal(property(plugin.app.vault, file, "updated"), stamp(T0));
  });

  it("get their own dates in another folder", async (t) => {
    const { plugin, file, sources } = await copy(t, "Elsewhere/Original.md");
    plugin.service.scheduleCreate(file, T0, sources);
    await settle();
    assert.equal(property(plugin.app.vault, file, "created"), stamp(T0));
  });

  it("leave the original unchanged", async (t) => {
    const { plugin, original, file, sources } = await copy(t, "Notes/Original 1.md");
    plugin.service.scheduleCreate(file, T0, sources);
    await settle();
    assert.equal(plugin.app.vault.writes(original.path), 0);
    assert.equal(plugin.app.vault.content(original.path), DATED);
  });

  it("keep their dates when the original disappears, as with a move from sync", async (t) => {
    const { plugin, original, file, sources } = await copy(t, "Moved/Original.md");
    plugin.app.vault.remove(original.path);
    plugin.service.scheduleCreate(file, T0, sources);
    await settle();
    assert.equal(property(plugin.app.vault, file, "created"), OLD_CREATED);
    assert.equal(plugin.app.vault.writes(file.path), 0);
  });

  it("are not detected for notes with different content", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin();
    plugin.app.vault.add("Notes/Original.md", DATED);
    const file = plugin.app.vault.add("Notes/Other.md", DATED.replace("Body text", "Body test"));
    assert.deepEqual(await plugin.service.findCopySources(file), []);
  });

  it("are not detected for empty notes", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin();
    plugin.app.vault.add("Notes/Empty.md", "");
    const file = plugin.app.vault.add("Notes/Empty 1.md", "");
    assert.deepEqual(await plugin.service.findCopySources(file), []);
  });
});

describe("updating notes", () => {
  async function opened(t: TestContext, content = DATED, overrides = {}) {
    const clock = useClock(t, T0);
    const plugin = createPlugin(overrides);
    const file = plugin.app.vault.add("Notes/Note.md", content);
    await plugin.service.rememberContent(file);
    const change = async (next: string, edited = true) => {
      if (edited) plugin.service.markUserEdit(file.path);
      await plugin.app.vault.modify(file, next);
      plugin.service.scheduleUpdate(file);
      await settle();
    };
    return { plugin, file, clock, change, vault: plugin.app.vault };
  }

  it("writes the time of the last edit, not the time of saving", async (t) => {
    const { plugin, file, clock, vault } = await opened(t);
    plugin.service.markUserEdit(file.path);
    const editedAt = clock.now();
    clock.advance(2000);
    await vault.modify(file, DATED.replace("Body text", "New text"));
    plugin.service.scheduleUpdate(file);
    clock.advance(5 * 60 * 1000);
    await settle();
    assert.equal(property(vault, file, "updated"), stamp(editedAt));
  });

  it("ignores changes that were not made by the user, such as sync", async (t) => {
    const { file, change, vault } = await opened(t);
    await change(DATED.replace("Body text", "Synced text"), false);
    assert.equal(property(vault, file, "updated"), OLD_UPDATED);
  });

  it("ignores user activity older than ten seconds", async (t) => {
    const { plugin, file, clock, vault } = await opened(t);
    plugin.service.markUserEdit(file.path);
    clock.advance(11000);
    await vault.modify(file, DATED.replace("Body text", "Late text"));
    plugin.service.scheduleUpdate(file);
    await settle();
    assert.equal(property(vault, file, "updated"), OLD_UPDATED);
  });

  it("does not update when the content is the same", async (t) => {
    const { file, change, vault } = await opened(t);
    await change(DATED);
    assert.equal(vault.writes(file.path), 1);
    assert.equal(property(vault, file, "updated"), OLD_UPDATED);
  });

  it("treats line endings and trailing blank lines as no change", async (t) => {
    const { file, change, vault } = await opened(t);
    await change(`${DATED.replace(/\n/g, "\r\n")}\r\n\r\n`);
    assert.equal(property(vault, file, "updated"), OLD_UPDATED);
  });

  it("compares with the content after the last external change", async (t) => {
    const { file, change, clock, vault } = await opened(t);
    const synced = DATED.replace("Body text", "Synced text");
    await change(synced, false);
    clock.advance(2000);
    await change(synced);
    assert.equal(property(vault, file, "updated"), OLD_UPDATED);
  });

  it("updates when the text changes", async (t) => {
    const { file, change, vault } = await opened(t);
    await change(DATED.replace("Body text", "Edited text"));
    assert.equal(property(vault, file, "updated"), stamp(T0));
    assert.equal(property(vault, file, "created"), OLD_CREATED);
    assert.equal(bodyOf(vault.content(file.path)), "Edited text\n");
  });

  it("updates when a property changes", async (t) => {
    const { file, change, vault } = await opened(t);
    await change(DATED.replace("rating: 3", "rating: 5"));
    assert.equal(property(vault, file, "updated"), stamp(T0));
  });

  it("writes once for a burst of edits", async (t) => {
    const { plugin, file, vault } = await opened(t, DATED, { updateDelayMs: 30 });
    for (const text of ["A", "AB", "ABC"]) {
      plugin.service.markUserEdit(file.path);
      await vault.modify(file, DATED.replace("Body text", text));
      plugin.service.scheduleUpdate(file);
    }
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(vault.writes(file.path), 4);
    assert.equal(property(vault, file, "updated"), stamp(T0));
  });

  it("does not touch excluded files", async (t) => {
    const { file, change, vault } = await opened(t, DATED, { excludedFiles: ["Notes/Note.md"] });
    await change(DATED.replace("Body text", "Edited text"));
    assert.equal(property(vault, file, "updated"), OLD_UPDATED);
  });
});

describe("ignored properties", () => {
  const BASE = note(
    [
      "created: 2024-01-01T10:00:00",
      "updated: 2025-05-05T10:00:00",
      "favorite: false",
      "pinned: false",
      "rating: 3",
      "deadline: 2026-12-31",
      "reviewAt: 2026-12-31T09:00:00",
      "summary: Short text",
      "topics:\n  - Design\n  - Research",
      "links:\n  - https://example.com/a",
    ].join("\n")
  );
  const IGNORED = ["Favorite", " pinned ", "topics", "deadline", "reviewAt", "summary"];

  async function updatedAfter(t: TestContext, next: string): Promise<boolean> {
    useClock(t, T0);
    const plugin = createPlugin({ ignoredProperties: IGNORED });
    const file = plugin.app.vault.add("Projects/Website redesign.md", BASE);
    await plugin.service.rememberContent(file);
    plugin.service.markUserEdit(file.path);
    await plugin.app.vault.modify(file, next);
    plugin.service.scheduleUpdate(file);
    await settle();
    return property(plugin.app.vault, file, "updated") !== "2025-05-05T10:00:00";
  }

  const cases: [string, string, boolean][] = [
    ["a checkbox", BASE.replace("favorite: false", "favorite: true"), false],
    ["a checkbox written with spaces in the settings", BASE.replace("pinned: false", "pinned: true"), false],
    ["a list", BASE.replace("  - Research", "  - Testing"), false],
    ["a list order", BASE.replace("  - Design\n  - Research", "  - Research\n  - Design"), false],
    ["a date", BASE.replace("deadline: 2026-12-31", "deadline: 2027-01-01"), false],
    ["a date and time", BASE.replace("T09:00:00", "T18:30:00"), false],
    ["a text", BASE.replace("Short text", "Longer text"), false],
    ["an ignored property being removed", BASE.replace("favorite: false\n", ""), false],
    ["an ignored property being added", BASE.replace("rating: 3", "rating: 3\nFavorite: true").replace("favorite: false\n", ""), false],
    ["a property that is not ignored", BASE.replace("rating: 3", "rating: 5"), true],
    ["a list that is not ignored", BASE.replace("https://example.com/a", "https://example.com/b"), true],
    ["an ignored property together with the text", BASE.replace("favorite: false", "favorite: true").replace("Body text", "New text"), true],
    ["an ignored property together with another property", BASE.replace("favorite: false", "favorite: true").replace("rating: 3", "rating: 4"), true],
  ];

  for (const [name, next, expected] of cases) {
    it(`${expected ? "update" : "do not update"} the date after changing ${name}`, async (t) => {
      assert.equal(await updatedAfter(t, next), expected);
    });
  }

  it("apply to open notes once their content is remembered again", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin();
    const file = plugin.app.vault.add("Projects/Website redesign.md", BASE);
    await plugin.service.rememberContent(file);
    plugin.settings.ignoredProperties = ["favorite"];
    plugin.service.forgetContent();
    await plugin.service.rememberContent(file);
    plugin.service.markUserEdit(file.path);
    await plugin.app.vault.modify(file, BASE.replace("favorite: false", "favorite: true"));
    plugin.service.scheduleUpdate(file);
    await settle();
    assert.equal(property(plugin.app.vault, file, "updated"), "2025-05-05T10:00:00");
  });
});

describe("removing trailing blank lines", () => {
  const cases: [string, string, string][] = [
    ["empty lines", "Hello\n\n\n", "Hello"],
    ["Windows line endings", "Hello\r\n\r\n", "Hello"],
    ["lines with spaces and tabs", "Hello\n   \n\t\n", "Hello"],
    ["a single final line break", "Hello\n", "Hello"],
    ["empty lines after a code block", "```js\ncode\n```\n\n", "```js\ncode\n```"],
  ];

  for (const [name, before, after] of cases) {
    it(`removes ${name}`, async () => {
      const plugin = createPlugin();
      plugin.app.vault.add("Notes/A.md", before);
      assert.equal(await plugin.service.removeTrailingBlankLines(), 1);
      assert.equal(plugin.app.vault.content("Notes/A.md"), after);
    });
  }

  const kept: [string, string][] = [
    ["clean notes", "Hello"],
    ["two spaces that make a line break", "Line  "],
    ["blank lines inside the note", "A\n\n\nB"],
    ["a non-breaking space", "Hello\n\u00a0"],
    ["the line break after properties in a note without text", "---\ntags: a\n---\n"],
  ];

  for (const [name, content] of kept) {
    it(`keeps ${name}`, async () => {
      const plugin = createPlugin();
      plugin.app.vault.add("Notes/A.md", content);
      assert.equal(await plugin.service.removeTrailingBlankLines(), 0);
      assert.equal(plugin.app.vault.content("Notes/A.md"), content);
    });
  }

  it("keeps one line break after properties and removes the rest", async () => {
    const plugin = createPlugin();
    plugin.app.vault.add("Notes/A.md", "---\ntags: a\n---\n\n\n");
    plugin.app.vault.add("Notes/B.md", "---\r\ntags: a\r\n---\r\n\r\n");
    assert.equal(await plugin.service.removeTrailingBlankLines(), 2);
    assert.equal(plugin.app.vault.content("Notes/A.md"), "---\ntags: a\n---\n");
    assert.equal(plugin.app.vault.content("Notes/B.md"), "---\r\ntags: a\r\n---\r\n");
  });

  it("skips excluded files and writes only where needed", async () => {
    const plugin = createPlugin({ excludedFolders: ["Archive"] });
    plugin.app.vault.add("Archive/A.md", "Archived\n\n");
    plugin.app.vault.add("Notes/B.md", "Clean");
    plugin.app.vault.add("Notes/C.md", "Dirty\n\n");
    assert.equal(await plugin.service.removeTrailingBlankLines(), 1);
    assert.equal(plugin.app.vault.content("Archive/A.md"), "Archived\n\n");
    assert.equal(plugin.app.vault.totalWrites(), 1);
    assert.equal(await plugin.service.removeTrailingBlankLines(), 0);
  });
});

describe("filling empty dates in the vault", () => {
  it("uses the file dates and skips filled and excluded notes", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin({ excludedFolders: ["Archive"] });
    const ctime = localTime(2025, 1, 2, 3, 4);
    const mtime = localTime(2025, 6, 7, 8, 9);
    const empty = plugin.app.vault.add("Notes/Empty.md", note("created:\nupdated:"), { ctime, mtime });
    plugin.app.vault.add("Notes/Dated.md", DATED);
    plugin.app.vault.add("Archive/Empty.md", note("created:"));
    assert.equal(await plugin.service.fillEmptyExisting(), 1);
    assert.equal(property(plugin.app.vault, empty, "created"), stamp(ctime));
    assert.equal(property(plugin.app.vault, empty, "updated"), stamp(mtime));
  });
});

describe("exclusions", () => {
  it("match exact files, folders, subfolders and the whole vault", () => {
    const plugin = createPlugin({ excludedFiles: ["Notes/A.md"], excludedFolders: ["Archive"] });
    const vault = plugin.app.vault;
    assert.ok(plugin.service.isExcluded(vault.add("Notes/A.md", "")));
    assert.ok(plugin.service.isExcluded(vault.add("Archive/B.md", "")));
    assert.ok(plugin.service.isExcluded(vault.add("Archive/Deep/C.md", "")));
    assert.ok(!plugin.service.isExcluded(vault.add("ArchiveNotes/D.md", "")));
    assert.ok(!plugin.service.isExcluded(vault.add("Notes/A copy.md", "")));

    const all = createPlugin({ excludedFolders: ["/"] });
    assert.ok(all.service.isExcluded(all.app.vault.add("Anything.md", "")));
  });
});

describe("settings backup", () => {
  it("restores exported settings", async () => {
    const plugin = createPlugin({ createdKey: "createdAt", ignoredProperties: ["favorite"] });
    await plugin.service.exportSettings();
    plugin.settings.createdKey = "changed";
    assert.ok(await plugin.service.importSettings());
    assert.equal(plugin.settings.createdKey, "createdAt");
    assert.deepEqual(plugin.settings.ignoredProperties, ["favorite"]);
  });

  it("replaces an invalid list of ignored properties with an empty one", async () => {
    const plugin = createPlugin();
    await plugin.app.vault.create("frontmatter-plus-settings.json", JSON.stringify({ ignoredProperties: "favorite" }));
    assert.ok(await plugin.service.importSettings());
    assert.deepEqual(plugin.settings.ignoredProperties, []);
  });

  it("reports a missing or broken backup file", async () => {
    const plugin = createPlugin();
    assert.equal(await plugin.service.importSettings(), false);
    await plugin.app.vault.create("frontmatter-plus-settings.json", "{ not json");
    assert.equal(await plugin.service.importSettings(), false);
  });
});

describe("frontmatter emulation", () => {
  it("keeps the note text when properties are written", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin();
    const file = plugin.app.vault.add("Notes/New.md", note("created:", "Line one\n\nLine two\n"));
    plugin.service.scheduleCreate(file, T0, []);
    await settle();
    assert.equal(bodyOf(plugin.app.vault.content(file.path)), "Line one\n\nLine two\n");
    assert.deepEqual(Object.keys(frontmatterOf(plugin.app.vault.content(file.path))), ["created"]);
  });
});
