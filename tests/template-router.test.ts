import "./support/environment";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bodyOf, frontmatterOf } from "./support/app";
import { localTime, useClock } from "./support/clock";
import { stamp } from "./support/notes";
import { createPlugin } from "./support/plugin";

const T0 = localTime(2026, 10, 5, 12, 30);
const TEMPLATE = "---\ntags:\n  - projects\ncreated:\nupdated:\ntopics:\n---\n# {{title}}\n";

function setup(overrides = {}) {
  const plugin = createPlugin({
    folderTemplates: [
      { folderPath: "Projects", templatePath: "Templates/Project.md" },
      { folderPath: "Projects/Meetings", templatePath: "Templates/Meeting.md" },
    ],
    ...overrides,
  });
  plugin.app.vault.add("Templates/Project.md", TEMPLATE);
  plugin.app.vault.add("Templates/Meeting.md", "Meeting {{date}} {{time}} {{datetime}}\n");
  return plugin;
}

describe("folder templates", () => {
  it("apply the template to a new empty note in the folder", async (t) => {
    useClock(t, T0);
    const plugin = setup();
    const file = plugin.app.vault.add("Projects/Launch plan.md", "");
    assert.ok(await plugin.templateRouter.maybeApply(file, T0));
    assert.equal(bodyOf(plugin.app.vault.content(file.path)), "# Launch plan\n");
  });

  it("use the most specific folder rule", async (t) => {
    useClock(t, T0);
    const plugin = setup();
    const file = plugin.app.vault.add("Projects/Meetings/Weekly sync.md", "");
    await plugin.templateRouter.maybeApply(file, T0);
    assert.equal(plugin.app.vault.content(file.path), `Meeting 2026-10-05 12:30 ${stamp(T0)}\n`);
  });

  it("apply to subfolders without their own rule", async (t) => {
    useClock(t, T0);
    const plugin = setup();
    const file = plugin.app.vault.add("Projects/Archive/Old.md", "");
    assert.ok(await plugin.templateRouter.maybeApply(file, T0));
  });

  it("do not touch notes that already have content", async (t) => {
    useClock(t, T0);
    const plugin = setup();
    const file = plugin.app.vault.add("Projects/Existing.md", "Text\n");
    assert.equal(await plugin.templateRouter.maybeApply(file, T0), false);
    assert.equal(plugin.app.vault.writes(file.path), 0);
  });

  it("do not apply outside the folder or to similarly named folders", async (t) => {
    useClock(t, T0);
    const plugin = setup();
    const outside = plugin.app.vault.add("Notes/New.md", "");
    const similar = plugin.app.vault.add("Projects2/New.md", "");
    assert.equal(await plugin.templateRouter.maybeApply(outside, T0), false);
    assert.equal(await plugin.templateRouter.maybeApply(similar, T0), false);
  });

  it("do nothing when the template file is missing", async (t) => {
    useClock(t, T0);
    const plugin = createPlugin({ folderTemplates: [{ folderPath: "Projects", templatePath: "Missing.md" }] });
    const file = plugin.app.vault.add("Projects/New.md", "");
    assert.equal(await plugin.templateRouter.maybeApply(file, T0), false);
    assert.equal(plugin.app.vault.writes(file.path), 0);
  });

  it("report the note as being applied right after writing", async (t) => {
    useClock(t, T0);
    const plugin = setup();
    const file = plugin.app.vault.add("Projects/New.md", "");
    await plugin.templateRouter.maybeApply(file, T0);
    assert.ok(plugin.templateRouter.isApplying(file));
  });
});

describe("dates in folder templates", () => {
  it("are filled with the creation time in the same write as the template", async (t) => {
    useClock(t, T0 + 60000);
    const plugin = setup();
    const file = plugin.app.vault.add("Projects/New.md", "");
    await plugin.templateRouter.maybeApply(file, T0);
    const properties = frontmatterOf(plugin.app.vault.content(file.path));
    assert.equal(properties.created, stamp(T0));
    assert.equal(properties.updated, stamp(T0));
    assert.equal(properties.topics, null);
    assert.equal(plugin.app.vault.writes(file.path), 1);
  });

  it("are left empty when filling is turned off", async (t) => {
    useClock(t, T0);
    const plugin = setup({ fillEmptyDateKeys: false });
    const file = plugin.app.vault.add("Projects/New.md", "");
    await plugin.templateRouter.maybeApply(file, T0);
    assert.equal(frontmatterOf(plugin.app.vault.content(file.path)).created, null);
  });

  it("are left empty in excluded notes", async (t) => {
    useClock(t, T0);
    const plugin = setup({ excludedFiles: ["Projects/New.md"] });
    const file = plugin.app.vault.add("Projects/New.md", "");
    await plugin.templateRouter.maybeApply(file, T0);
    assert.equal(frontmatterOf(plugin.app.vault.content(file.path)).created, null);
  });

  it("keep values that the template already has", async (t) => {
    useClock(t, T0);
    const plugin = setup();
    plugin.app.vault.add("Templates/Project.md", "---\ncreated: 2020-01-01T00:00:00\nupdated: ''\n---\n");
    const file = plugin.app.vault.add("Projects/New.md", "");
    await plugin.templateRouter.maybeApply(file, T0);
    const properties = frontmatterOf(plugin.app.vault.content(file.path));
    assert.equal(properties.created, "2020-01-01T00:00:00");
    assert.equal(properties.updated, stamp(T0));
  });

  it("use custom property names, including names with dots", async (t) => {
    useClock(t, T0);
    const plugin = setup({ createdKey: "date.created", updatedKey: "date.updated" });
    plugin.app.vault.add("Templates/Project.md", "---\ndate.created:\ndateXcreated:\ndate.updated: null\n---\n");
    const file = plugin.app.vault.add("Projects/New.md", "");
    await plugin.templateRouter.maybeApply(file, T0);
    const properties = frontmatterOf(plugin.app.vault.content(file.path));
    assert.equal(properties["date.created"], stamp(T0));
    assert.equal(properties["date.updated"], stamp(T0));
    assert.equal(properties.dateXcreated, null);
  });

  it("stay valid YAML when the date format needs quotes", async (t) => {
    useClock(t, T0);
    const plugin = setup({ dateFormat: "DD, YYYY: HH:mm" });
    const file = plugin.app.vault.add("Projects/New.md", "");
    await plugin.templateRouter.maybeApply(file, T0);
    assert.equal(frontmatterOf(plugin.app.vault.content(file.path)).created, "05, 2026: 12:30");
  });
});
