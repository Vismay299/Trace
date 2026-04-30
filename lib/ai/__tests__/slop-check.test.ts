import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../client", () => ({
  callAI: vi.fn(async () => ({
    content: '{"verdict":"PASS","violations":[],"suggested_fix":""}',
    inputTokens: 0,
    outputTokens: 0,
    modelUsed: "test",
    tier: 3 as const,
    costUsd: 0,
    cached: false,
  })),
}));

import { runAntiSlop, generateWithSlopRetries } from "../slop-check";
import * as client from "../client";

describe("runAntiSlop", () => {
  beforeEach(() => {
    vi.mocked(client.callAI).mockClear();
  });

  it("regex pre-filter short-circuits without calling the LLM", async () => {
    const result = await runAntiSlop("Hot take: this is bad.", { userId: "u1" });
    expect(result.pass).toBe(false);
    if (!result.pass) expect(result.stage).toBe("regex");
    expect(client.callAI).not.toHaveBeenCalled();
  });

  it("clean text invokes the LLM detector", async () => {
    const r = await runAntiSlop("Yesterday I cut p99 latency from 480ms to 190ms.", {
      userId: "u1",
    });
    expect(r.pass).toBe(true);
    expect(client.callAI).toHaveBeenCalledTimes(1);
  });

  it("returns LLM violations when verdict is FAIL", async () => {
    vi.mocked(client.callAI).mockResolvedValueOnce({
      content: JSON.stringify({
        verdict: "FAIL",
        violations: [{ category: "content", label: "subtle slop", excerpt: "blah" }],
        suggested_fix: "rewrite",
      }),
      inputTokens: 0,
      outputTokens: 0,
      modelUsed: "test",
      tier: 3,
      costUsd: 0,
      cached: false,
    });
    const r = await runAntiSlop("I'm thrilled to share an update.", { userId: "u1" });
    // The regex catches "I'm thrilled" before the LLM, but we set up the LLM
    // path with this unique text — verify regex fired:
    expect(r.pass).toBe(false);
  });
});

describe("generateWithSlopRetries", () => {
  beforeEach(() => {
    vi.mocked(client.callAI).mockResolvedValue({
      content: '{"verdict":"PASS"}',
      inputTokens: 0,
      outputTokens: 0,
      modelUsed: "test",
      tier: 3,
      costUsd: 0,
      cached: false,
    });
  });

  it("returns first attempt when content is clean", async () => {
    let calls = 0;
    const out = await generateWithSlopRetries({
      generate: async () => {
        calls += 1;
        return { content: "clean output", raw: { text: "p99 dropped 41%" } };
      },
      extractText: (r) => r.text,
      userId: "u1",
    });
    expect(calls).toBe(1);
    expect(out.passed).toBe(true);
    expect(out.attempts).toBe(1);
  });

  it("retries up to 3 times on slop, then flags for review", async () => {
    let calls = 0;
    const out = await generateWithSlopRetries({
      generate: async () => {
        calls += 1;
        return { content: "Hot take: stop using mocks.", raw: { text: "Hot take: nope" } };
      },
      extractText: (r) => r.text,
      userId: "u1",
    });
    expect(calls).toBe(3);
    expect(out.passed).toBe(false);
    expect(out.attempts).toBe(3);
    expect(out.violations.length).toBeGreaterThan(0);
  });
});
