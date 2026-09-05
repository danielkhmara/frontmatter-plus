interface MomentInstance {
  format(format: string): string;
  diff(other: MomentInstance, unit: "days"): number;
}

type MomentFactory = {
  (): MomentInstance;
  (input: number): MomentInstance;
};

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

export function formatNow(format: string): string {
  const instant: MomentInstance = getMomentFactory()();
  return instant.format(format);
}

export function formatTimestamp(ms: number, format: string): string {
  const instant: MomentInstance = getMomentFactory()(ms);
  return instant.format(format);
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
