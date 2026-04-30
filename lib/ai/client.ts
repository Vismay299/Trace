/**
 * The single LLM gateway. Every AI call goes through `callAI`.
 *
 * Responsibilities:
 *   1. Tier-correct model selection (TASK_TIERS).
 *   2. Per-user budget enforcement (atomic check-and-decrement).
 *   3. Usage logging (success and failure both).
 *   4. Provider transport (OpenRouter, OpenAI-compatible /chat/completions).
 *   5. Refund on transport failure.
 *
 * Bypassing this file is a bug. Grep should never find `openrouter.ai`
 * outside of this file.
 */
import {
  estimateCostUsd,
  MODELS,
  TASK_TIERS,
  TIER_DEFAULTS,
  type ModelConfig,
  type TaskType,
  type Tier,
} from "./models";
import {
  AIBudgetExhaustedError,
  AIInvalidConfigError,
  AIUpstreamError,
  type CallAIOpts,
  type CallAIResult,
} from "./types";
import { checkAndDecrement, refundBudget } from "./budget";
import { logUsage } from "./usage";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const TIER_DEFAULT_TEMP: Record<Tier, number> = { 1: 0.4, 2: 0.3, 3: 0.2 };
const TIER_DEFAULT_MAX_TOK: Record<Tier, number> = {
  1: 4000,
  2: 3000,
  3: 1200,
};

export async function callAI(opts: CallAIOpts): Promise<CallAIResult> {
  const tier = TASK_TIERS[opts.taskType];
  if (!tier) {
    throw new AIInvalidConfigError(
      `Unknown taskType "${opts.taskType}". Add it to TASK_TIERS.`,
    );
  }

  // Cached-result short-circuit. Caller already paid the budget when warming
  // the cache, so we don't double-charge here.
  if (opts.cached) {
    await logUsage({
      userId: opts.userId,
      taskType: opts.taskType,
      costTier: tier,
      modelUsed: opts.model ?? TIER_DEFAULTS[tier],
      inputTokens: opts.cached.tokens ?? null,
      outputTokens: 0,
      estimatedCostUsd: 0,
      cached: true,
      success: true,
    });
    return {
      content: opts.cached.value,
      inputTokens: opts.cached.tokens ?? 0,
      outputTokens: 0,
      modelUsed: opts.model ?? TIER_DEFAULTS[tier],
      tier,
      costUsd: 0,
      cached: true,
    };
  }

  const model = pickModel(opts.taskType, opts.model);
  if (model.tier !== tier) {
    throw new AIInvalidConfigError(
      `Tier mismatch: task ${opts.taskType} expects tier ${tier}, model ${model.id} is tier ${model.tier}.`,
    );
  }

  // Atomic budget gate. Throws BudgetExhausted on failure.
  await checkAndDecrement(opts.userId, tier);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: openRouterHeaders(),
      body: JSON.stringify(buildPayload(model, opts)),
    });
  } catch (err) {
    await refundBudget(opts.userId, tier);
    await logUsage({
      userId: opts.userId,
      taskType: opts.taskType,
      costTier: tier,
      modelUsed: model.id,
      inputTokens: null,
      outputTokens: null,
      estimatedCostUsd: 0,
      cached: false,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw new AIUpstreamError(0, `Network error: ${(err as Error).message}`);
  }

  if (!response.ok) {
    await refundBudget(opts.userId, tier);
    const text = await response.text().catch(() => "");
    await logUsage({
      userId: opts.userId,
      taskType: opts.taskType,
      costTier: tier,
      modelUsed: model.id,
      inputTokens: null,
      outputTokens: null,
      estimatedCostUsd: 0,
      cached: false,
      success: false,
      errorMessage: `HTTP ${response.status}: ${text.slice(0, 240)}`,
    });
    throw new AIUpstreamError(
      response.status,
      `OpenRouter ${response.status}: ${text.slice(0, 240)}`,
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const choice = data.choices?.[0]?.message?.content ?? "";
  const inputTokens = data.usage?.prompt_tokens ?? 0;
  const outputTokens = data.usage?.completion_tokens ?? 0;
  const cost = estimateCostUsd(model, inputTokens, outputTokens);

  await logUsage({
    userId: opts.userId,
    taskType: opts.taskType,
    costTier: tier,
    modelUsed: model.id,
    inputTokens,
    outputTokens,
    estimatedCostUsd: cost,
    cached: false,
    success: true,
  });

  return {
    content: choice,
    inputTokens,
    outputTokens,
    modelUsed: model.id,
    tier,
    costUsd: cost,
    cached: false,
  };
}

function pickModel(taskType: TaskType, override?: string): ModelConfig {
  if (override) {
    const m = MODELS[override];
    if (!m) throw new AIInvalidConfigError(`Unknown model "${override}".`);
    return m;
  }
  const id = TIER_DEFAULTS[TASK_TIERS[taskType]];
  return MODELS[id];
}

function openRouterHeaders(): Record<string, string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AIInvalidConfigError(
      "OPENROUTER_API_KEY is not set. See .env.example.",
    );
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_NAME ?? "Trace",
  };
}

function buildPayload(model: ModelConfig, opts: CallAIOpts) {
  const tier = model.tier;
  const payload: Record<string, unknown> = {
    model: model.id,
    messages: opts.messages,
    temperature: opts.temperature ?? TIER_DEFAULT_TEMP[tier],
    max_tokens: opts.maxOutputTokens ?? TIER_DEFAULT_MAX_TOK[tier],
  };
  if (opts.json !== false && model.supportsJsonMode) {
    payload.response_format = { type: "json_object" };
  }
  return payload;
}

type OpenRouterResponse = {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export { MODELS, TASK_TIERS };
export type { TaskType, Tier };
