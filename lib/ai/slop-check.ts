/**
 * Anti-slop runtime. Two-stage check:
 *   1. `containsSlop` — zero-cost regex pre-filter against the banned-pattern
 *      list. If anything trips, return immediately.
 *   2. LLM slop detector (Tier 3) — catches subtler violations the regex misses.
 *
 * Used by every content generation path. The generation pipeline retries
 * up to 3 times before flagging `slop_review_needed`.
 */
import { callAI } from "./client";
import { loadPrompt } from "./prompts";
import { containsSlop, type SlopViolation } from "./anti-slop";

export type SlopCheckResult =
  | { pass: true }
  | {
      pass: false;
      violations: SlopViolation[];
      suggestedFix?: string;
      stage: "regex" | "llm";
    };

export async function runAntiSlop(
  content: string,
  ctx: { userId: string },
): Promise<SlopCheckResult> {
  // Stage 1: regex pre-filter.
  const regexHits = containsSlop(content);
  if (regexHits.length > 0) {
    return {
      pass: false,
      violations: regexHits,
      stage: "regex",
    };
  }

  // Stage 2: LLM slop detector.
  const prompt = loadPrompt("slop-detector", { content });
  let parsed: {
    verdict: "PASS" | "FAIL";
    violations?: { category: string; label: string; excerpt?: string }[];
    suggested_fix?: string;
  };
  try {
    const result = await callAI({
      taskType: "slop_check",
      userId: ctx.userId,
      messages: [{ role: "system", content: prompt.system }],
      json: true,
      promptVersion: prompt.meta.version,
    });
    parsed = JSON.parse(result.content);
  } catch (err) {
    // If the detector itself fails, default to PASS — we already filtered the
    // worst offenders with regex, and we don't want a network blip to block
    // a finished generation.
    console.warn("[slop-check] LLM detector failed; passing through.", err);
    return { pass: true };
  }

  if (parsed.verdict === "PASS") return { pass: true };

  return {
    pass: false,
    violations: (parsed.violations ?? []).map((v) => ({
      category: (v.category as SlopViolation["category"]) ?? "content",
      label: v.label,
      excerpt: v.excerpt,
    })),
    suggestedFix: parsed.suggested_fix,
    stage: "llm",
  };
}

export type GenerateWithSlopRetriesOpts<T> = {
  generate: (
    attempt: number,
    lastViolations?: SlopViolation[],
  ) => Promise<{
    content: string;
    raw: T;
  }>;
  userId: string;
  /** How to extract the slop-checkable text from the raw generation result. */
  extractText: (raw: T) => string;
  maxAttempts?: number;
};

export type GenerateWithSlopRetriesResult<T> = {
  raw: T;
  content: string;
  passed: boolean;
  attempts: number;
  violations: SlopViolation[];
};

/**
 * Generation pipeline. Retries up to `maxAttempts` (default 3) when slop
 * is detected. After the cap, returns the last result with `passed=false`
 * so the caller can mark the row `slop_review_needed=true` and surface
 * it for human review (per spec §6).
 */
export async function generateWithSlopRetries<T>(
  opts: GenerateWithSlopRetriesOpts<T>,
): Promise<GenerateWithSlopRetriesResult<T>> {
  const max = opts.maxAttempts ?? 3;
  let lastViolations: SlopViolation[] = [];
  let last: { content: string; raw: T } | null = null;

  for (let attempt = 1; attempt <= max; attempt++) {
    const result = await opts.generate(attempt, lastViolations);
    last = result;
    const text = opts.extractText(result.raw);
    const check = await runAntiSlop(text, { userId: opts.userId });

    if (check.pass) {
      return {
        raw: result.raw,
        content: result.content,
        passed: true,
        attempts: attempt,
        violations: [],
      };
    }
    lastViolations = check.violations;
  }

  return {
    raw: last!.raw,
    content: last!.content,
    passed: false,
    attempts: max,
    violations: lastViolations,
  };
}
