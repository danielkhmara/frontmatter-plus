import type { PluginLocale } from "./settings";

interface MomentInstance {
  format(format: string): string;
  locale(locale: string): MomentInstance;
  diff(other: MomentInstance, unit: "days"): number;
}

type MomentFactory = {
  (): MomentInstance;
  (input: number): MomentInstance;
  locales(): string[];
};

const DATA_LOCALE = "en";

function getMomentFactory(): MomentFactory {
  const candidate: unknown = (window as Window & { moment?: unknown }).moment;
  if (typeof candidate !== "function") {
    throw new Error("Moment.js is not available");
  }
  return candidate as MomentFactory;
}

function pad2(value: number): string {
  const n = Math.floor(value);
  return n < 10 ? `0${n}` : String(n);
}

function withLocale(moment: MomentFactory, instant: MomentInstance, locale: string): MomentInstance {
  return instant.locale(moment.locales().includes(locale) ? locale : DATA_LOCALE);
}

export function toMomentLocale(locale: PluginLocale): string {
  return locale === "zh" ? "zh-cn" : locale;
}

export function formatNow(format: string, locale: string = DATA_LOCALE): string {
  const moment = getMomentFactory();
  return withLocale(moment, moment(), locale).format(format);
}

export function formatTimestamp(ms: number, format: string, locale: string = DATA_LOCALE): string {
  const moment = getMomentFactory();
  return withLocale(moment, moment(ms), locale).format(format);
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${pad2(m)}:${pad2(s)}`;
  }
  return `${m}:${pad2(s)}`;
}

export function daysSince(mtimeMs: number): number {
  const startOfDay = (ms: number): number => {
    const d = new Date(ms);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  };
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((startOfDay(Date.now()) - startOfDay(mtimeMs)) / dayMs);
}
