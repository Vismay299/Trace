/**
 * Model registry. Source of truth: spec §F15 + §14.
 *
 * Tier 1 = frontier (final content gen, voice match, strategy doc).
 * Tier 2 = mid (narrative plans, story extraction, pillar mapping).
 * Tier 3 = small (classification, follow-ups, slop check, voice score).
 *
 * Costs are USD per 1M tokens, OpenRouter-listed prices captured 2026-04.
 * Treat them as approximations — the authoritative numbers come from the
 * monthly OpenRouter bill, not these constants.
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
  "deepseek/deepseek-chat-v3": {
    id: "deepseek/deepseek-chat-v3",
    tier: 1,
    contextWindow: 64_000,
    inputCostPerMTok: 0.14,
    outputCostPerMTok: 0.28,
    supportsJsonMode: true,
  },
  "qwen/qwen-2.5-72b-instruct": {
    id: "qwen/qwen-2.5-72b-instruct",
    tier: 2,
    contextWindow: 32_000,
    inputCostPerMTok: 0.13,
    outputCostPerMTok: 0.4,
    supportsJsonMode: true,
  },
  "meta-llama/llama-4-maverick": {
    id: "meta-llama/llama-4-maverick",
    tier: 2,
    contextWindow: 128_000,
    inputCostPerMTok: 0.18,
    outputCostPerMTok: 0.6,
    supportsJsonMode: true,
  },
  "google/gemini-2.5-flash": {
    id: "google/gemini-2.5-flash",
    tier: 3,
    contextWindow: 1_000_000,
    inputCostPerMTok: 0.075,
    outputCostPerMTok: 0.3,
    supportsJsonMode: true,
  },
};

/** Default model per tier. */
export const TIER_DEFAULTS: Record<Tier, string> = {
  1: "deepseek/deepseek-chat-v3",
  2: "qwen/qwen-2.5-72b-instruct",
  3: "google/gemini-2.5-flash",
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
