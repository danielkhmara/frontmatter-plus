import "./support/environment";
import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";
import { FocusSessionTracker } from "../src/focus-session";
import { localTime, useClock } from "./support/clock";
import { createPlugin } from "./support/plugin";

const T0 = localTime(2026, 10, 5, 12, 0);

function setup(t: TestContext) {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const clock = useClock(t, T0);
  const plugin = createPlugin();
  const workspace = plugin.app.workspace;
  const plan = workspace.open(plugin.app.vault.add("Projects/Plan.md", "Text"));
  const notes = workspace.open(plugin.app.vault.add("Projects/Notes.md", "Text"));
  let ticks = 0;
  const tracker = new FocusSessionTracker(plugin as never);
  workspace.activate(plan);
  tracker.onload(() => {
    ticks += 1;
  });
  t.after(() => tracker.onunload());
  return { t, clock, workspace, tracker, plan, notes, ticks: () => ticks };
}

describe("editing time", () => {
  it("counts the time the note is active", (t) => {
    const { clock, tracker } = setup(t);
    clock.advance(65000);
    assert.equal(tracker.getDisplay("Projects/Plan.md"), "1:05");
  });

  it("pauses while another note is active and resumes on return", (t) => {
    const { clock, workspace, tracker, plan, notes } = setup(t);
    clock.advance(30000);
    workspace.activate(notes);
    clock.advance(20000);
    workspace.activate(plan);
    clock.advance(10000);
    assert.equal(tracker.getDisplay("Projects/Plan.md"), "0:40");
    assert.equal(tracker.getDisplay("Projects/Notes.md"), "0:20");
  });

  it("keeps counting the last note while no note is active", (t) => {
    const { clock, workspace, tracker } = setup(t);
    clock.advance(10000);
    workspace.activate(null);
    clock.advance(50000);
    assert.equal(tracker.getDisplay("Projects/Plan.md"), "0:10");
  });

  it("starts from zero after the note is closed and opened again", (t) => {
    const { clock, workspace, tracker, plan } = setup(t);
    clock.advance(30000);
    workspace.close(plan);
    assert.equal(tracker.getDisplay("Projects/Plan.md"), "");
    const reopened = workspace.open(plan.file!);
    workspace.activate(reopened);
    clock.advance(5000);
    assert.equal(tracker.getDisplay("Projects/Plan.md"), "0:05");
  });

  it("shows nothing for notes that were never opened", (t) => {
    const { tracker } = setup(t);
    assert.equal(tracker.getDisplay("Projects/Other.md"), "");
  });

  it("refreshes the summary every second and after switching notes", (t) => {
    const { workspace, notes, ticks } = setup(t);
    const afterLoad = ticks();
    t.mock.timers.tick(3000);
    assert.equal(ticks() - afterLoad, 3);
    workspace.activate(notes);
    assert.equal(ticks() - afterLoad, 4);
  });

  it("stops refreshing and forgets sessions when unloaded", (t) => {
    const { clock, tracker, ticks } = setup(t);
    clock.advance(10000);
    tracker.onunload();
    const before = ticks();
    t.mock.timers.tick(5000);
    assert.equal(ticks(), before);
    assert.equal(tracker.getDisplay("Projects/Plan.md"), "");
  });
});
