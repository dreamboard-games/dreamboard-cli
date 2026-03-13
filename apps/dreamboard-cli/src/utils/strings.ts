import path from "node:path";
import type { RuleInputFlags } from "../flags.js";
import { readTextFile } from "./fs.js";

export function normalizeSlug(input: string): string {
  const lowered = input.trim().toLowerCase();
  const replaced = lowered.replace(/[^a-z0-9]+/g, "-");
  return replaced.replace(/^-+/, "").replace(/-+$/, "");
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function readRuleInput(flags: RuleInputFlags): Promise<string> {
  if (flags["rule-file"] && typeof flags["rule-file"] === "string") {
    const filePath = path.resolve(process.cwd(), flags["rule-file"]);
    return readTextFile(filePath);
  }
  if (flags.rule && typeof flags.rule === "string") {
    return flags.rule;
  }
  throw new Error('Provide rule input via --rule-file or --rule "...".');
}

export function parsePositiveInt(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
