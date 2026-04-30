import type { TaskType, Tier } from "./models";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CallAIOpts = {
  taskType: TaskType;
  /** Owning user. Required for budget enforcement and usage logging. */
  userId: string;
  messages: ChatMessage[];
  /** Optional override; defaults to the tier-appropriate model. */
  model?: string;
  /** Hard cap on output tokens. Defaults sized per tier. */
  maxOutputTokens?: number;
  /** 0–1. Default 0.4 for Tier 1, 0.2 for Tier 2/3. */
  temperature?: number;
  /** Force JSON-mode response. Default true for tasks that have JSON contracts. */
  json?: boolean;
  /** If set, this call counts as cached and bypasses the network. */
  cached?: { value: string; tokens?: number };
  /** Identifies the calling prompt for usage logs. */
  promptVersion?: string;
};

export type CallAIResult = {
  content: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
  tier: Tier;
  costUsd: number;
  cached: boolean;
};

export class AIBudgetExhaustedError extends Error {
  readonly code = "BUDGET_EXHAUSTED" as const;
  constructor(
    public tier: Tier,
    public used: number,
    public limit: number,
    public periodEnd: string,
  ) {
    super(
      `AI budget exhausted for tier ${tier}: ${used}/${limit} used. Resets ${periodEnd}.`,
    );
  }
}

export class AIUpstreamError extends Error {
  readonly code = "UPSTREAM_ERROR" as const;
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export class AIInvalidConfigError extends Error {
  readonly code = "INVALID_CONFIG" as const;
}
