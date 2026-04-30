import { describe, expect, it } from "vitest";
import { parseNarrativePlan } from "../narrative";

describe("narrative plan parser", () => {
  it("accepts the prompt contract", () => {
    const parsed = parseNarrativePlan(
      JSON.stringify({
        main_theme: "The onboarding rewrite is really a positioning decision.",
        content_strategy:
          "Lead with the concrete tradeoff, then turn the lesson into proof-backed posts.",
        anchor_story: {
          format: "linkedin",
          story_type: "build_decision",
          title: "Why we cut the onboarding checklist in half",
          summary: "The team traded feature coverage for activation clarity.",
          pillar_match: "pillar_1",
          source_note: "Weekly answer about activation drop-off.",
        },
        recommended_posts: [
          {
            format: "x_thread",
            story_type: "mistake_lesson",
            title: "The metric that made our onboarding feel obvious",
            summary:
              "A short thread on replacing busy UI with one activation moment.",
            pillar_match: "pillar_2",
            source_note: "Weekly answer about user confusion.",
          },
        ],
        proof_assets: ["Before/after onboarding screenshot"],
        pillar_balance: { pillar_1: 1, pillar_2: 1, pillar_3: 0 },
      }),
    );

    expect(parsed.recommended_posts).toHaveLength(1);
    expect(parsed.anchor_story.format).toBe("linkedin");
  });

  it("rejects invented formats", () => {
    expect(() =>
      parseNarrativePlan(
        JSON.stringify({
          main_theme: "x",
          content_strategy: "y",
          anchor_story: {
            format: "podcast",
            story_type: "proof",
            title: "Bad",
            summary: "Bad",
            pillar_match: "pillar_1",
            source_note: "Bad",
          },
          recommended_posts: [],
        }),
      ),
    ).toThrow();
  });
});
