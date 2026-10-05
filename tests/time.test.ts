import "./support/environment";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { daysSince, formatDuration, formatNow, formatTimestamp, toMomentLocale } from "../src/time";
import { localTime, useClock } from "./support/clock";
import { resetMoment, setAvailableLocales, setGlobalLocale } from "./support/moment";

const DATE_FORMAT = "YYYY-MM-DD[T]HH:mm:[00]";

describe("formatTimestamp", () => {
  afterEach(resetMoment);

  it("formats the given moment with the default date format", () => {
    assert.equal(formatTimestamp(localTime(2026, 10, 5, 8, 30), DATE_FORMAT), "2026-10-05T08:30:00");
  });

  it("formats note dates in English whatever locale another plugin set", () => {
    setGlobalLocale("ru");
    assert.equal(formatTimestamp(localTime(2026, 10, 5, 21, 5), "hh:mm A"), "09:05 PM");
  });

  it("uses an explicitly requested locale", () => {
    assert.equal(formatTimestamp(localTime(2026, 10, 5, 21, 5), "hh:mm A", "ru"), "09:05 вечера");
  });

  it("falls back to English when the requested locale is not loaded", () => {
    setGlobalLocale("ru");
    setAvailableLocales(["en", "ru"]);
    assert.equal(formatTimestamp(localTime(2026, 10, 5, 21, 5), "hh:mm A", "zh-cn"), "09:05 PM");
  });
});

describe("formatNow", () => {
  afterEach(resetMoment);

  it("formats the current time", (t) => {
    useClock(t, localTime(2026, 1, 2, 3, 4));
    assert.equal(formatNow(DATE_FORMAT), "2026-01-02T03:04:00");
  });

  it("ignores the locale set by other plugins unless asked for one", (t) => {
    useClock(t, localTime(2026, 1, 2, 23, 4));
    setGlobalLocale("ru");
    assert.equal(formatNow("A"), "PM");
    assert.equal(formatNow("A", "ru"), "вечера");
  });
});

describe("toMomentLocale", () => {
  it("maps Chinese to the Moment.js locale name", () => {
    assert.equal(toMomentLocale("zh"), "zh-cn");
  });

  it("keeps other plugin locales as they are", () => {
    for (const locale of ["en", "de", "fr", "ru"] as const) {
      assert.equal(toMomentLocale(locale), locale);
    }
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    assert.equal(formatDuration(0), "0:00");
    assert.equal(formatDuration(5000), "0:05");
    assert.equal(formatDuration(65000), "1:05");
  });

  it("adds hours when needed", () => {
    assert.equal(formatDuration(3661000), "1:01:01");
  });

  it("treats negative durations as zero", () => {
    assert.equal(formatDuration(-1000), "0:00");
  });
});

describe("daysSince", () => {
  it("counts calendar days, not 24-hour periods", (t) => {
    useClock(t, localTime(2026, 10, 5, 0, 30));
    assert.equal(daysSince(localTime(2026, 10, 4, 23, 30)), 1);
    assert.equal(daysSince(localTime(2026, 10, 5, 0, 1)), 0);
    assert.equal(daysSince(localTime(2026, 9, 25, 12, 0)), 10);
  });
});
