import { TFile } from "obsidian";
import { FakeVault, frontmatterOf } from "./app";

const pad = (value: number): string => String(value).padStart(2, "0");

export function stamp(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export function note(properties: string, body = "Body text\n"): string {
  return `---\n${properties.trim()}\n---\n${body}`;
}

export function property(vault: FakeVault, file: TFile, key: string): unknown {
  return frontmatterOf(vault.content(file.path))[key];
}
