import { describe, it, expect } from "vitest";
import {
  defaultModelForTask,
  estimateCostUsd,
  MODELS,
  TASK_TIERS,
  tierForTask,
  TIER_DEFAULTS,
} from "../models";

describe("model registry", () => {
  it("every task type has a tier", () => {
    for (const [task, tier] of Object.entries(TASK_TIERS)) {
      expect([1, 2, 3]).toContain(tier);
      const model = defaultModelForTask(task as keyof typeof TASK_TIERS);
      expect(model.tier).toBe(tier);
    }
  });

  it("tier defaults map to real models", () => {
    for (const id of Object.values(TIER_DEFAULTS)) {
      expect(MODELS[id]).toBeDefined();
    }
  });

  it("tierForTask returns the right tier", () => {
    expect(tierForTask("content_generation")).toBe(1);
    expect(tierForTask("narrative_plan")).toBe(2);
    expect(tierForTask("slop_check")).toBe(3);
  });

  it("estimates cost in USD with 6 decimals", () => {
    const m = MODELS["deepseek/deepseek-chat-v3"];
    const cost = estimateCostUsd(m, 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(m.inputCostPerMTok + m.outputCostPerMTok, 5);
  });
});
