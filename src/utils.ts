export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

export function recordGet(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

export function frontmatterEnd(content: string): number {
  return content.startsWith("---") ? content.indexOf("\n---", 3) : -1;
}

export function frontmatterText(content: string): string | null {
  const end = frontmatterEnd(content);
  return end === -1 ? null : content.slice(content.indexOf("\n") + 1, end);
}

export function stripFrontmatter(content: string): string {
  const end = frontmatterEnd(content);
  return end === -1 ? content : content.slice(end + 4).replace(/^\r?\n/, "");
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function recordSet(record: Record<string, unknown>, key: string, value: unknown): void {
  record[key] = value;
}
