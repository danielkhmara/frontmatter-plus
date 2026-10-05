import "./support/environment";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PathSync } from "../src/path-sync";
import { localTime, settle, useClock } from "./support/clock";
import { note, property } from "./support/notes";
import { createPlugin } from "./support/plugin";

const T0 = localTime(2026, 10, 5, 12, 0);

function setup(overrides = {}) {
  const plugin = createPlugin(overrides);
  const pathSync = new PathSync(plugin as never);
  (plugin as unknown as { pathSync: PathSync }).pathSync = pathSync;
  return { plugin, pathSync, vault: plugin.app.vault };
}

async function rename(
  context: ReturnType<typeof setup>,
  path: string,
  newPath: string
): Promise<void> {
  const entry = context.vault.getAbstractFileByPath(path);
  if (!entry) throw new Error(`No such entry: ${path}`);
  const oldPath = context.vault.rename(entry, newPath);
  await context.pathSync.handleRename(entry, oldPath);
}

describe("renaming excluded paths", () => {
  it("updates an excluded folder and its subfolders", async (t) => {
    useClock(t, T0);
    const context = setup({ excludedFolders: ["Archive", "Archive/2025", "Drafts"] });
    context.vault.add("Archive/2025/Report.md", "Text");
    await rename(context, "Archive", "Old projects");
    assert.deepEqual(new Set(context.plugin.settings.excludedFolders), new Set(["Old projects", "Old projects/2025", "Drafts"]));
  });

  it("updates excluded files inside a renamed folder", async (t) => {
    useClock(t, T0);
    const context = setup({ excludedFiles: ["Archive/Report.md", "Inbox.md"] });
    context.vault.add("Archive/Report.md", "Text");
    await rename(context, "Archive", "Old projects");
    assert.deepEqual(new Set(context.plugin.settings.excludedFiles), new Set(["Old projects/Report.md", "Inbox.md"]));
  });

  it("updates a renamed excluded file", async (t) => {
    useClock(t, T0);
    const context = setup({ excludedFiles: ["Inbox.md"] });
    context.vault.add("Inbox.md", "Text");
    await rename(context, "Inbox.md", "Notes/Inbox.md");
    assert.deepEqual(context.plugin.settings.excludedFiles, ["Notes/Inbox.md"]);
  });

  it("does not touch folders that only share the beginning of the name", async (t) => {
    useClock(t, T0);
    const context = setup({ excludedFolders: ["Archive2", "Archive"] });
    context.vault.add("Archive/Report.md", "Text");
    await rename(context, "Archive", "Old projects");
    assert.ok(context.plugin.settings.excludedFolders.includes("Archive2"));
    assert.ok(!context.plugin.settings.excludedFolders.includes("Archive"));
  });

  it("keeps the order the lists were arranged in", async (t) => {
    useClock(t, T0);
    const context = setup({ excludedFolders: ["Drafts", "Archive", "Backups"], excludedFiles: ["Notes/Z.md", "Archive/A.md"] });
    context.vault.add("Archive/A.md", "Text");
    await rename(context, "Archive", "Old projects");
    assert.deepEqual(context.plugin.settings.excludedFolders, ["Drafts", "Old projects", "Backups"]);
    assert.deepEqual(context.plugin.settings.excludedFiles, ["Notes/Z.md", "Old projects/A.md"]);
  });

  it("removes duplicates that appear after a rename", async (t) => {
    useClock(t, T0);
    const context = setup({ excludedFolders: ["Archive", "Old projects"] });
    context.vault.add("Archive/Report.md", "Text");
    await rename(context, "Archive", "Old projects");
    assert.deepEqual(context.plugin.settings.excludedFolders, ["Old projects"]);
  });
});

describe("renaming paths used by folder templates", () => {
  it("updates the folder of a rule", async (t) => {
    useClock(t, T0);
    const context = setup({ folderTemplates: [{ folderPath: "Projects", templatePath: "Templates/Project.md" }] });
    context.vault.add("Projects/Plan.md", "Text");
    await rename(context, "Projects", "Work");
    assert.deepEqual(context.plugin.settings.folderTemplates, [{ folderPath: "Work", templatePath: "Templates/Project.md" }]);
  });

  it("updates the template of a rule when the template or its folder moves", async (t) => {
    useClock(t, T0);
    const context = setup({ folderTemplates: [{ folderPath: "Projects", templatePath: "Templates/Project.md" }] });
    context.vault.add("Templates/Project.md", "Template");
    await rename(context, "Templates", "Resources/Templates");
    assert.deepEqual(context.plugin.settings.folderTemplates, [
      { folderPath: "Projects", templatePath: "Resources/Templates/Project.md" },
    ]);
  });

  it("updates nested rule folders", async (t) => {
    useClock(t, T0);
    const context = setup({
      folderTemplates: [{ folderPath: "Projects/Meetings", templatePath: "Templates/Meeting.md" }],
    });
    context.vault.add("Projects/Meetings/Weekly.md", "Text");
    await rename(context, "Projects", "Work");
    assert.equal(context.plugin.settings.folderTemplates[0].folderPath, "Work/Meetings");
  });
});

describe("saving settings after a rename", () => {
  it("saves when a path in the settings changed", async (t) => {
    useClock(t, T0);
    const context = setup({ excludedFolders: ["Archive"] });
    context.vault.add("Archive/Report.md", "Text");
    await rename(context, "Archive", "Old projects");
    assert.equal(context.plugin.saveCount, 1);
  });

  it("does not save when no path in the settings was affected", async (t) => {
    useClock(t, T0);
    const context = setup({ excludedFolders: ["Drafts"] });
    context.vault.add("Notes/Plan.md", "Text");
    await rename(context, "Notes/Plan.md", "Notes/Roadmap.md");
    assert.equal(context.plugin.saveCount, 0);
  });
});

describe("events caused by a rename", () => {
  it("are ignored for the renamed note for a short time", async (t) => {
    const clock = useClock(t, T0);
    const context = setup();
    context.vault.add("Notes/Plan.md", "Text");
    await rename(context, "Notes/Plan.md", "Notes/Roadmap.md");
    assert.ok(context.pathSync.isSuppressed("Notes/Roadmap.md"));
    assert.ok(context.pathSync.isSuppressed("Notes/Plan.md"));
    clock.advance(2500);
    assert.ok(!context.pathSync.isSuppressed("Notes/Roadmap.md"));
  });

  it("are ignored for every note inside a renamed folder", async (t) => {
    useClock(t, T0);
    const context = setup();
    context.vault.add("Projects/A.md", "Text");
    context.vault.add("Projects/Deep/B.md", "Text");
    context.vault.add("Other/C.md", "Text");
    await rename(context, "Projects", "Work");
    assert.ok(context.pathSync.isSuppressed("Work/A.md"));
    assert.ok(context.pathSync.isSuppressed("Work/Deep/B.md"));
    assert.ok(!context.pathSync.isSuppressed("Other/C.md"));
  });
});

describe("remembered content after a rename", () => {
  it("moves with the note, so an edit without changes does not update the date", async (t) => {
    const clock = useClock(t, T0);
    const context = setup();
    const content = note("created: 2024-01-01T10:00:00\nupdated: 2025-05-05T10:00:00");
    const file = context.vault.add("Notes/Plan.md", content);
    await context.plugin.service.rememberContent(file);
    await rename(context, "Notes/Plan.md", "Notes/Roadmap.md");
    clock.advance(3000);
    context.plugin.service.markUserEdit(file.path);
    await context.vault.modify(file, content);
    context.plugin.service.scheduleUpdate(file);
    await settle();
    assert.equal(property(context.vault, file, "updated"), "2025-05-05T10:00:00");
  });
});
