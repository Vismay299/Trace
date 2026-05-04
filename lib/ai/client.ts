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
  AIInvalidConfigError,
  AIUpstreamError,
  type CallAIOpts,
  type CallAIResult,
} from "./types";
import { checkAndDecrement, refundBudget } from "./budget";
import { logUsage } from "./usage";
import { resolveAiRouteDecision } from "./routing";
import type { AiProvider } from "@/lib/config/ai-routing";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const NVIDIA_NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const TIER_DEFAULT_TEMP: Record<Tier, number> = { 1: 0.4, 2: 0.3, 3: 0.2 };
const TIER_DEFAULT_MAX_TOK: Record<Tier, number> = {
  1: 4000,
  2: 3000,
  3: 1200,
};
const OPENROUTER_RETRY_DELAYS_MS = [750, 1500];
const FREE_MODEL_FALLBACKS: Record<Tier, string[]> = {
  1: ["openrouter/free", "openai/gpt-oss-120b:free"],
  2: ["openai/gpt-oss-120b:free", "openrouter/free"],
  3: ["openai/gpt-oss-20b:free"],
};
const GENERATE_NOW_MESSAGE = "Generate the requested response now.";

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

  const decision = await resolveAiRouteDecision({
    taskType: opts.taskType,
    tier,
    requestedModel: opts.model,
  });
  const model = pickModel(opts.taskType, decision.modelId);
  if (model.tier !== tier) {
    throw new AIInvalidConfigError(
      `Tier mismatch: task ${opts.taskType} expects tier ${tier}, model ${model.id} is tier ${model.tier}.`,
    );
  }

  // Atomic budget gate. Throws BudgetExhausted on failure.
  await checkAndDecrement(opts.userId, tier);

  let response: Response | null = null;
  let data: OpenRouterResponse | null = null;
  let finalModel = model;
  const startedAt = Date.now();
  try {
    const attempt = await performRequestWithFallbacks({
      provider: decision.provider,
      taskType: opts.taskType,
      preferredModel: model,
      opts,
    });
    response = attempt.response;
    data = attempt.data ?? null;
    finalModel = attempt.model;
  } catch (err) {
    await refundBudget(opts.userId, tier);
    await logUsage({
      userId: opts.userId,
      taskType: opts.taskType,
      costTier: tier,
      modelUsed: finalModel.id,
      provider: decision.provider,
      routeDecisionReason: decision.reason,
      latencyMs: Date.now() - startedAt,
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
      modelUsed: finalModel.id,
      provider: decision.provider,
      routeDecisionReason: decision.reason,
      latencyMs: Date.now() - startedAt,
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

  data ??= (await response.json()) as OpenRouterResponse;
  const choice = responseContent(data);
  const inputTokens = data.usage?.prompt_tokens ?? 0;
  const outputTokens = data.usage?.completion_tokens ?? 0;
  const cost = estimateCostUsd(finalModel, inputTokens, outputTokens);

  await logUsage({
    userId: opts.userId,
    taskType: opts.taskType,
    costTier: tier,
    modelUsed: finalModel.id,
    provider: decision.provider,
    routeDecisionReason: decision.reason,
    latencyMs: Date.now() - startedAt,
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
    modelUsed: finalModel.id,
    tier,
    costUsd: cost,
    cached: false,
  };
}

async function performRequestWithFallbacks({
  provider,
  taskType,
  preferredModel,
  opts,
}: {
  provider: AiProvider;
  taskType: TaskType;
  preferredModel: ModelConfig;
  opts: CallAIOpts;
}): Promise<{
  response: Response;
  model: ModelConfig;
  data?: OpenRouterResponse;
}> {
  const candidates = candidateModels(taskType, preferredModel, opts.model);
  let lastRetryableFailure: { response: Response; model: ModelConfig } | null =
    null;

  for (const candidate of candidates) {
    for (
      let attempt = 0;
      attempt <= OPENROUTER_RETRY_DELAYS_MS.length;
      attempt++
    ) {
      const response = await fetch(providerUrl(provider), {
        method: "POST",
        headers: providerHeaders(provider),
        body: JSON.stringify(buildPayload(candidate, opts, provider)),
      });
      if (shouldRetryOpenRouter(provider, response.status)) {
        lastRetryableFailure = { response, model: candidate };
        if (
          response.status === 429 &&
          attempt < OPENROUTER_RETRY_DELAYS_MS.length
        ) {
          await sleep(OPENROUTER_RETRY_DELAYS_MS[attempt]);
          continue;
        }
        break;
      }
      if (shouldFallbackFromNvidia(provider, response.status)) {
        return performRequestWithFallbacks({
          provider: "openrouter",
          taskType,
          preferredModel: candidate,
          opts,
        });
      }
      if (response.ok) {
        const data = await response
          .clone()
          .json()
          .catch(() => null);
        if (!responseContent(data).trim()) {
          lastRetryableFailure = {
            response: new Response(
              "OpenRouter returned empty content for this provider.",
              { status: 502 },
            ),
            model: candidate,
          };
          break;
        }
        return { response, model: candidate, data };
      }
      return { response, model: candidate };
    }
  }

  return (
    lastRetryableFailure ?? {
      response: new Response("OpenRouter failed all provider retries.", {
        status: 502,
      }),
      model: preferredModel,
    }
  );
}

function shouldRetryOpenRouter(provider: AiProvider, status: number) {
  return (
    provider === "openrouter" &&
    (status === 400 || status === 429 || status >= 500)
  );
}

function candidateModels(
  taskType: TaskType,
  preferredModel: ModelConfig,
  explicitModel?: string,
): ModelConfig[] {
  if (explicitModel) return [preferredModel];
  const tier = TASK_TIERS[taskType];
  const ids = [
    preferredModel.id,
    ...FREE_MODEL_FALLBACKS[tier].filter((id) => id !== preferredModel.id),
  ];
  return ids.map((id) => MODELS[id]).filter(Boolean);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function providerUrl(provider: AiProvider): string {
  return provider === "nvidia_nim"
    ? (process.env.NVIDIA_NIM_BASE_URL ?? NVIDIA_NIM_URL)
    : OPENROUTER_URL;
}

function providerHeaders(provider: AiProvider): Record<string, string> {
  if (provider === "nvidia_nim") return nvidiaNimHeaders();
  return openRouterHeaders();
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

function nvidiaNimHeaders(): Record<string, string> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new AIInvalidConfigError(
      "NVIDIA_NIM_API_KEY is not set. Disable NIM routing or configure the key.",
    );
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function buildPayload(
  model: ModelConfig,
  opts: CallAIOpts,
  provider: AiProvider,
) {
  const tier = model.tier;
  const payload: Record<string, unknown> = {
    model: model.id,
    messages: ensureUserMessage(opts.messages),
    temperature: opts.temperature ?? TIER_DEFAULT_TEMP[tier],
    max_tokens: opts.maxOutputTokens ?? TIER_DEFAULT_MAX_TOK[tier],
  };
  if (
    provider !== "nvidia_nim" &&
    opts.json !== false &&
    model.supportsJsonMode
  ) {
    payload.response_format = { type: "json_object" };
  }
  return payload;
}

function ensureUserMessage(messages: CallAIOpts["messages"]) {
  if (messages.some((message) => message.role === "user")) return messages;
  return [...messages, { role: "user" as const, content: GENERATE_NOW_MESSAGE }];
}

function responseContent(data: unknown): string {
  return (
    (data as OpenRouterResponse | null)?.choices?.[0]?.message?.content ?? ""
  );
}

function shouldFallbackFromNvidia(provider: AiProvider, status: number) {
  return provider === "nvidia_nim" && (status === 400 || status >= 500);
}

type OpenRouterResponse = {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export { MODELS, TASK_TIERS };
export type { TaskType, Tier };
