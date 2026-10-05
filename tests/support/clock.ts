import type { TestContext } from "node:test";

export interface Clock {
  now(): number;
  set(ms: number): void;
  advance(ms: number): void;
}

export function useClock(t: TestContext, start: number): Clock {
  let current = start;
  t.mock.method(Date, "now", () => current);
  return {
    now: () => current,
    set: (ms) => {
      current = ms;
    },
    advance: (ms) => {
      current += ms;
    },
  };
}

export function localTime(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  return new Date(year, month - 1, day, hour, minute, second).getTime();
}

export async function settle(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
