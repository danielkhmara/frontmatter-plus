type Meridiem = (hour: number) => string;

const LOCALES: Record<string, Meridiem> = {
  en: (hour) => (hour < 12 ? "AM" : "PM"),
  de: (hour) => (hour < 12 ? "AM" : "PM"),
  fr: (hour) => (hour < 12 ? "AM" : "PM"),
  ru: (hour) => (hour < 4 ? "ночи" : hour < 12 ? "утра" : hour < 17 ? "дня" : "вечера"),
  "zh-cn": (hour) => (hour < 12 ? "上午" : "下午"),
};

const TOKEN_RE = /\[([^\]]*)]|YYYY|MM|DD|HH|hh|mm|ss|A/g;

let globalLocale = "en";
let available = Object.keys(LOCALES);

const pad = (value: number): string => String(value).padStart(2, "0");

export interface FakeMomentInstance {
  format(pattern: string): string;
  locale(name: string): FakeMomentInstance;
  diff(other: FakeMomentInstance, unit: "days"): number;
  valueOf(): number;
}

function create(ms: number): FakeMomentInstance {
  let locale = globalLocale;
  const instance: FakeMomentInstance = {
    format(pattern) {
      const date = new Date(ms);
      return pattern.replace(TOKEN_RE, (token, literal: string | undefined) => {
        if (literal !== undefined) return literal;
        switch (token) {
          case "YYYY":
            return String(date.getFullYear());
          case "MM":
            return pad(date.getMonth() + 1);
          case "DD":
            return pad(date.getDate());
          case "HH":
            return pad(date.getHours());
          case "hh":
            return pad(date.getHours() % 12 || 12);
          case "mm":
            return pad(date.getMinutes());
          case "ss":
            return pad(date.getSeconds());
          default:
            return LOCALES[locale](date.getHours());
        }
      });
    },
    locale(name) {
      if (available.includes(name)) locale = name;
      return instance;
    },
    diff(other, unit) {
      if (unit !== "days") throw new Error(`Unsupported unit: ${unit}`);
      return Math.floor((ms - other.valueOf()) / 86400000);
    },
    valueOf() {
      return ms;
    },
  };
  return instance;
}

export const fakeMoment = Object.assign(
  (input?: number): FakeMomentInstance => create(input === undefined ? Date.now() : input),
  { locales: (): string[] => [...available] }
);

export function setGlobalLocale(name: string): void {
  globalLocale = name;
}

export function setAvailableLocales(names: string[]): void {
  available = names;
}

export function resetMoment(): void {
  globalLocale = "en";
  available = Object.keys(LOCALES);
}
