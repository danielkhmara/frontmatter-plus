import "./support/environment";
import assert from "node:assert/strict";
import { afterEach, describe, it, type TestContext } from "node:test";
import { Platform } from "obsidian";
import { StatusBarClock } from "../src/status-bar-clock";
import { localTime, useClock } from "./support/clock";
import { resetMoment, setGlobalLocale } from "./support/moment";
import { createPlugin } from "./support/plugin";

function setup(t: TestContext, overrides = {}) {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const clock = useClock(t, localTime(2026, 10, 5, 21, 5, 30));
  const plugin = createPlugin({
    showStatusBarClock: true,
    statusBarDateFormat: "YYYY-MM-DD",
    statusBarTimeFormat: "HH:mm:ss",
    ...overrides,
  });
  const statusClock = new StatusBarClock(plugin as never);
  statusClock.onload();
  t.after(() => statusClock.onunload());
  return { clock, plugin, statusClock, item: () => plugin.statusBarItems[0] };
}

describe("status bar clock", () => {
  afterEach(() => {
    Platform.isDesktopApp = true;
    resetMoment();
  });

  it("shows the date and time in the chosen formats", (t) => {
    const { item } = setup(t);
    assert.equal(item().text, "2026-10-05  21:05:30");
    assert.ok(item().visible);
  });

  it("updates every second", (t) => {
    const { clock, item } = setup(t);
    clock.advance(1000);
    t.mock.timers.tick(1000);
    assert.equal(item().text, "2026-10-05  21:05:31");
  });

  it("hides itself when turned off and comes back when turned on", (t) => {
    const { plugin, statusClock, item } = setup(t);
    plugin.settings.showStatusBarClock = false;
    statusClock.refresh();
    assert.equal(item().text, "");
    assert.ok(!item().visible);
    plugin.settings.showStatusBarClock = true;
    statusClock.refresh();
    assert.ok(item().visible);
    assert.equal(item().text, "2026-10-05  21:05:30");
  });

  it("uses the plugin language, not the language set by other plugins", (t) => {
    setGlobalLocale("ru");
    const english = setup(t, { statusBarTimeFormat: "hh:mm A", locale: "en" });
    assert.equal(english.item().text, "2026-10-05  09:05 PM");
  });

  it("follows the plugin language when it is not English", (t) => {
    const russian = setup(t, { statusBarTimeFormat: "hh:mm A", locale: "ru" });
    assert.equal(russian.item().text, "2026-10-05  09:05 вечера");
  });

  it("is not created on mobile devices", (t) => {
    Platform.isDesktopApp = false;
    const { plugin } = setup(t);
    assert.equal(plugin.statusBarItems.length, 0);
  });

  it("stops updating when unloaded", (t) => {
    const { clock, statusClock, item } = setup(t);
    statusClock.onunload();
    clock.advance(5000);
    t.mock.timers.tick(5000);
    assert.equal(item().text, "2026-10-05  21:05:30");
  });
});
