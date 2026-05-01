export type CodingConversationImport = {
  detected: boolean;
  text: string;
  metadata: {
    tool: "claude_code" | "cursor" | "codex" | "ai_coding_log";
    transcriptFormat: "markdown" | "json" | "text";
    project?: string;
    dateRange?: { start?: string; end?: string };
    retainedTurns: number;
  };
};

const toolPatterns = [
  {
    tool: "claude_code" as const,
    pattern: /\b(claude code|claude\.ai\/code)\b/i,
  },
  { tool: "cursor" as const, pattern: /\bcursor\b/i },
  { tool: "codex" as const, pattern: /\bcodex\b/i },
];

const noisePattern =
  /^(tool result|thinking|token count|wall time|chunk id|original token count|output:|exit code:)/i;

export function normalizeCodingConversation(
  raw: string,
  filename: string,
): CodingConversationImport {
  const format = filename.endsWith(".json")
    ? "json"
    : filename.endsWith(".md") || filename.endsWith(".markdown")
      ? "markdown"
      : "text";
  const parsed = format === "json" ? flattenJsonTranscript(raw) : raw;
  const tool =
    toolPatterns.find((candidate) => candidate.pattern.test(parsed))?.tool ??
    (looksLikeCodingConversation(parsed) ? "ai_coding_log" : undefined);

  if (!tool) {
    return {
      detected: false,
      text: raw,
      metadata: {
        tool: "ai_coding_log",
        transcriptFormat: format,
        retainedTurns: 0,
      },
    };
  }

  const lines = parsed
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !noisePattern.test(line.trim()));

  const retainedTurns = lines.filter((line) =>
    /^(user|assistant|developer|system|codex|claude|human):/i.test(line),
  ).length;

  return {
    detected: true,
    text: lines.join("\n").slice(0, 200_000),
    metadata: {
      tool,
      transcriptFormat: format,
      project: inferProject(parsed, filename),
      dateRange: inferDateRange(parsed),
      retainedTurns,
    },
  };
}

function looksLikeCodingConversation(text: string) {
  return (
    /\b(apply_patch|git diff|pnpm|npm run|tsx|typescript|next\.js|drizzle|schema|route\.ts|tsx)\b/i.test(
      text,
    ) && /\b(user|assistant|developer|system|human|codex|claude):/i.test(text)
  );
}

function flattenJsonTranscript(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const out: string[] = [];
    walk(parsed, out);
    return out.join("\n");
  } catch {
    return raw;
  }
}

function walk(value: unknown, out: string[]) {
  if (!value) return;
  if (typeof value === "string") {
    if (value.trim()) out.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walk(item, out);
    return;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const role = record.role ?? record.type ?? record.speaker;
    const content = record.content ?? record.text ?? record.message;
    if (typeof role === "string" && typeof content === "string") {
      out.push(`${role}: ${content}`);
      return;
    }
    for (const item of Object.values(record)) walk(item, out);
  }
}

function inferProject(text: string, filename: string) {
  const explicit = text.match(/\b(?:project|repo|workspace):\s*([^\n]+)/i)?.[1];
  if (explicit) return explicit.trim().slice(0, 120);
  return filename.replace(/\.[^.]+$/, "");
}

function inferDateRange(text: string) {
  const dates = [...text.matchAll(/\b20\d{2}-\d{2}-\d{2}\b/g)].map((m) => m[0]);
  if (!dates.length) return undefined;
  return { start: dates[0], end: dates[dates.length - 1] };
}
