/**
 * Prompt loader. Reads prompts/<name>.md, parses YAML frontmatter,
 * substitutes {{var}} placeholders. Caches parsed prompts in-process.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { ANTI_SLOP_BLOCK } from "./anti-slop";

export type PromptMeta = {
  name: string;
  version: string;
  task_type: string;
  tier?: 1 | 2 | 3;
  description?: string;
};

export type LoadedPrompt = {
  meta: PromptMeta;
  system: string;
  raw: string;
};

const cache = new Map<string, { meta: PromptMeta; raw: string }>();

function promptsDir(): string {
  return path.join(process.cwd(), "prompts");
}

function load(name: string) {
  if (cache.has(name)) return cache.get(name)!;
  const file = path.join(promptsDir(), `${name}.md`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `Prompt "${name}" not found at ${file}. Available: ${listPrompts().join(", ")}`,
    );
  }
  const src = fs.readFileSync(file, "utf8");
  const parsed = matter(src);
  const meta = parsed.data as PromptMeta;
  if (!meta?.name || !meta?.version || !meta?.task_type) {
    throw new Error(`Prompt "${name}" missing required frontmatter fields.`);
  }
  const entry = { meta, raw: parsed.content.trim() };
  cache.set(name, entry);
  return entry;
}

export function listPrompts(): string[] {
  if (!fs.existsSync(promptsDir())) return [];
  return fs
    .readdirSync(promptsDir())
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function loadPrompt(
  name: string,
  vars: Record<string, string | number | undefined> = {},
): LoadedPrompt {
  const { meta, raw } = load(name);
  const merged: Record<string, string> = { antiSlop: ANTI_SLOP_BLOCK };
  for (const [k, v] of Object.entries(vars)) {
    merged[k] = v == null ? "" : String(v);
  }
  const system = raw.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    merged[key] ?? `{{${key}}}`,
  );
  return { meta, system, raw };
}

/** Used by tests to clear the in-process cache. */
export function _resetPromptCache() {
  cache.clear();
}
