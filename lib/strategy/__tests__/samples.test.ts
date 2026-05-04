import { describe, expect, it } from "vitest";
import { buildFallbackSamples } from "@/lib/strategy/samples";
import type { StrategyDoc } from "@/lib/db/schema";

describe("buildFallbackSamples", () => {
  it("creates five draftable samples from the interview and strategy", () => {
    const doc = {
      positioningStatement:
        "I help builders turn real work into clear positioning.",
      pillar1Topic: "Signal capture",
      pillar2Topic: "Credibility systems",
      pillar3Topic: "Depth-first AI",
      pillar2Description: "Systems should preserve specificity.",
      pillar3Description: "Depth beats volume when trust matters.",
    } as StrategyDoc;

    const generated = buildFallbackSamples(doc, {
      q1: { answer: "I started by shipping small product tools." },
      q2: {
        answer:
          "I am proud of Trace because it turns raw answers into strategy.",
      },
      q3: { answer: "The trade-off was fewer features for more trust." },
    });

    expect(generated.samples).toHaveLength(5);
    expect(generated.samples.map((s) => s.format)).toEqual([
      "linkedin",
      "linkedin",
      "x_thread",
      "instagram",
      "substack",
    ]);
    expect(generated.samples.every((s) => s.citation_line)).toBe(true);
  });
});
