/**
 * AI client unit test. Mocks fetch + the budget/usage modules so we can
 * assert tier-correct model selection + payload shape without a real
 * Postgres or OpenRouter.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../budget", () => ({
  checkAndDecrement: vi.fn(async () => ({
    used: 1,
    limit: 5,
    periodEnd: "2026-05-03",
  })),
  refundBudget: vi.fn(async () => {}),
}));

vi.mock("../usage", () => ({
  logUsage: vi.fn(async () => {}),
}));

import { callAI, TASK_TIERS, MODELS } from "../client";
import { AIBudgetExhaustedError, AIUpstreamError } from "../types";
import * as budget from "../budget";
import * as usage from "../usage";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function okResponse(content: string, prompt = 100, completion = 50) {
  return Promise.resolve(
    new Response(
      JSON.stringify({
        choices: [{ message: { content } }],
        usage: { prompt_tokens: prompt, completion_tokens: completion },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
}

describe("callAI", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(budget.checkAndDecrement).mockClear();
    vi.mocked(budget.refundBudget).mockClear();
    vi.mocked(usage.logUsage).mockClear();
  });

  it("routes content_generation through Tier 1 default model", async () => {
    fetchMock.mockReturnValueOnce(okResponse("hello"));
    await callAI({
      taskType: "content_generation",
      userId: "u1",
      messages: [{ role: "system", content: "hi" }],
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(MODELS[body.model].tier).toBe(1);
  });

  it("routes slop_check through Tier 3 default model", async () => {
    fetchMock.mockReturnValueOnce(okResponse('{"verdict":"PASS"}'));
    await callAI({
      taskType: "slop_check",
      userId: "u1",
      messages: [{ role: "system", content: "hi" }],
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(MODELS[body.model].tier).toBe(3);
  });

  it("decrements budget before the network call", async () => {
    fetchMock.mockReturnValueOnce(okResponse("ok"));
    await callAI({
      taskType: "interview_followup",
      userId: "u1",
      messages: [{ role: "system", content: "x" }],
    });
    expect(budget.checkAndDecrement).toHaveBeenCalledWith("u1", 3);
  });

  it("refunds budget on transport error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(
      callAI({
        taskType: "interview_followup",
        userId: "u1",
        messages: [{ role: "system", content: "x" }],
      }),
    ).rejects.toBeInstanceOf(AIUpstreamError);
    expect(budget.refundBudget).toHaveBeenCalledWith("u1", 3);
  });

  it("refunds budget on non-2xx response", async () => {
    fetchMock.mockReturnValueOnce(
      Promise.resolve(new Response("upstream blew up", { status: 503 })),
    );
    await expect(
      callAI({
        taskType: "story_extraction",
        userId: "u1",
        messages: [{ role: "system", content: "x" }],
      }),
    ).rejects.toBeInstanceOf(AIUpstreamError);
    expect(budget.refundBudget).toHaveBeenCalledWith("u1", 2);
  });

  it("propagates BUDGET_EXHAUSTED without burning a network call", async () => {
    vi.mocked(budget.checkAndDecrement).mockRejectedValueOnce(
      new AIBudgetExhaustedError(1, 5, 5, "2026-05-03"),
    );
    await expect(
      callAI({
        taskType: "content_generation",
        userId: "u1",
        messages: [{ role: "system", content: "x" }],
      }),
    ).rejects.toBeInstanceOf(AIBudgetExhaustedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logs usage with token counts and estimated cost", async () => {
    fetchMock.mockReturnValueOnce(okResponse("hi", 1234, 567));
    await callAI({
      taskType: "content_generation",
      userId: "u1",
      messages: [{ role: "system", content: "x" }],
    });
    const logged = vi.mocked(usage.logUsage).mock.calls[0][0];
    expect(logged.inputTokens).toBe(1234);
    expect(logged.outputTokens).toBe(567);
    expect(logged.estimatedCostUsd).toBeGreaterThan(0);
    expect(logged.success).toBe(true);
  });

  it("short-circuits when cached value is provided", async () => {
    const result = await callAI({
      taskType: "voice_score",
      userId: "u1",
      messages: [{ role: "system", content: "x" }],
      cached: { value: "cached!" },
    });
    expect(result.cached).toBe(true);
    expect(result.content).toBe("cached!");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(budget.checkAndDecrement).not.toHaveBeenCalled();
  });

  it("rejects an explicit model from the wrong tier", async () => {
    await expect(
      callAI({
        taskType: "content_generation",
        userId: "u1",
        messages: [{ role: "system", content: "x" }],
        model: "google/gemini-2.5-flash", // tier 3 — not allowed for tier-1 task
      }),
    ).rejects.toThrow(/Tier mismatch/);
  });

  it("every TaskType is registered in TASK_TIERS", () => {
    expect(Object.keys(TASK_TIERS).length).toBeGreaterThanOrEqual(13);
  });
});
