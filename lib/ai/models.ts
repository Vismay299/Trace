/**
 * Model registry. Source of truth: spec §F15 + §14.
 *
 * Tier 1 = high-capability (final content gen, voice match, strategy doc).
 * Tier 2 = mid (narrative plans, story extraction, pillar mapping).
 * Tier 3 = small (classification, follow-ups, slop check, voice score).
 *
 * Defaults intentionally use OpenRouter free models so a no-credit account can
 * still generate. Free models are rate-limited by OpenRouter, so this should be
 * treated as bootstrap routing rather than production-grade capacity.
 */

export type Tier = 1 | 2 | 3;

export type ModelConfig = {
  /** OpenRouter model id (slash-prefixed). */
  id: string;
  tier: Tier;
  contextWindow: number;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  /** True if the model reliably honors `response_format: { type: "json_object" }`. */
  supportsJsonMode: boolean;
};

export const MODELS: Record<string, ModelConfig> = {
  "openrouter/free": {
    id: "openrouter/free",
    tier: 1,
    contextWindow: 200_000,
    inputCostPerMTok: 0,
    outputCostPerMTok: 0,
    supportsJsonMode: true,
  },
  "openai/gpt-oss-120b:free": {
    id: "openai/gpt-oss-120b:free",
    tier: 2,
    contextWindow: 131_072,
    inputCostPerMTok: 0,
    outputCostPerMTok: 0,
    supportsJsonMode: true,
  },
  "openai/gpt-oss-20b:free": {
    id: "openai/gpt-oss-20b:free",
    tier: 3,
    contextWindow: 131_072,
    inputCostPerMTok: 0,
    outputCostPerMTok: 0,
    supportsJsonMode: true,
  },
};

/** Default model per tier. */
export const TIER_DEFAULTS: Record<Tier, string> = {
  1: "openrouter/free",
  2: "openai/gpt-oss-120b:free",
  3: "openai/gpt-oss-20b:free",
};

/** Task-type → tier classification. Wrong tier is a bug, not a style choice. */
export const TASK_TIERS = {
  // Tier 1
  content_generation: 1,
  anchor_story: 1,
  strategy_doc: 1,
  sample_posts: 1,
  // Tier 2
  narrative_plan: 2,
  story_extraction: 2,
  pillar_mapping: 2,
  // Tier 3
  interview_followup: 3,
  checkin_followup: 3,
  signal_assessment: 3,
  stage_classification: 3,
  slop_check: 3,
  voice_score: 3,
  transcript_cleanup: 3,
} as const satisfies Record<string, Tier>;

export type TaskType = keyof typeof TASK_TIERS;

export function tierForTask(task: TaskType): Tier {
  return TASK_TIERS[task];
}

export function defaultModelForTask(task: TaskType): ModelConfig {
  const id = TIER_DEFAULTS[TASK_TIERS[task]];
  return MODELS[id];
}

export function estimateCostUsd(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number,
): number {
  const input = (inputTokens / 1_000_000) * model.inputCostPerMTok;
  const output = (outputTokens / 1_000_000) * model.outputCostPerMTok;
  return Number((input + output).toFixed(6));
}
