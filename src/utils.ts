export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

export function recordGet(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

export function recordSet(record: Record<string, unknown>, key: string, value: unknown): void {
  record[key] = value;
}
