import "./support/environment";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PathSync } from "../src/path-sync";
import { localTime, settle, useClock } from "./support/clock";
import { note, property, stamp } from "./support/notes";
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

describe("pending work after a rename", () => {
  it("still fills dates of a new note renamed before the delay ends", async (t) => {
    useClock(t, T0);
    const context = setup({ createDelayMs: 30 });
    const file = context.vault.add("Untitled.md", note("created:\nupdated:"));
    context.plugin.service.scheduleCreate(file, T0, []);
    await rename(context, "Untitled.md", "Projects/Launch plan.md");
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(property(context.vault, file, "created"), stamp(T0));
    assert.equal(property(context.vault, file, "updated"), stamp(T0));
  });

  it("still updates the date of a note edited and then renamed", async (t) => {
    useClock(t, T0);
    const context = setup({ updateDelayMs: 30 });
    const content = note("created: 2024-01-01T10:00:00\nupdated: 2025-05-05T10:00:00");
    const file = context.vault.add("Notes/Plan.md", content);
    await context.plugin.service.rememberContent(file);
    context.plugin.service.markUserEdit(file.path);
    await context.vault.modify(file, content.replace("Body text", "Edited text"));
    context.plugin.service.scheduleUpdate(file);
    await rename(context, "Notes/Plan.md", "Notes/Roadmap.md");
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(property(context.vault, file, "updated"), stamp(T0));
  });

  it("moves pending work of every note inside a renamed folder", async (t) => {
    useClock(t, T0);
    const context = setup({ createDelayMs: 30 });
    const first = context.vault.add("Drafts/A.md", note("created:"));
    const second = context.vault.add("Drafts/Deep/B.md", note("created:"));
    context.plugin.service.scheduleCreate(first, T0, []);
    context.plugin.service.scheduleCreate(second, T0, []);
    await rename(context, "Drafts", "Projects");
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(property(context.vault, first, "created"), stamp(T0));
    assert.equal(property(context.vault, second, "created"), stamp(T0));
  });
});

describe("cleanup after a rename", () => {
  it("cancels pending work of a renamed note when it is removed", async (t) => {
    useClock(t, T0);
    const context = setup({ createDelayMs: 30 });
    const file = context.vault.add("Untitled.md", note("created:"));
    context.plugin.service.scheduleCreate(file, T0, []);
    await rename(context, "Untitled.md", "Projects/Launch plan.md");
    context.plugin.service.onUnloadFile("Projects/Launch plan.md");
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(context.vault.writes(file.path), 0);
  });

  it("passes the rename on to the editing time", async (t) => {
    useClock(t, T0);
    const context = setup();
    const renames: [string, string][] = [];
    (context.plugin as unknown as { focusSession: unknown }).focusSession = {
      renamePath: (from: string, to: string) => renames.push([from, to]),
    };
    context.vault.add("Notes/Plan.md", "Text");
    await rename(context, "Notes/Plan.md", "Notes/Roadmap.md");
    assert.deepEqual(renames, [["Notes/Plan.md", "Notes/Roadmap.md"]]);
  });
});
