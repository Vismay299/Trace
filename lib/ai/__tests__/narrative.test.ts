import { describe, expect, it } from "vitest";
import { parseNarrativePlan, sanitizeNarrativePlanSourceIds } from "../narrative";

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
          source_chunk_id: "11111111-1111-4111-8111-111111111111",
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
            source_chunk_id: "22222222-2222-4222-8222-222222222222",
          },
        ],
        proof_assets: ["Before/after onboarding screenshot"],
        pillar_balance: { pillar_1: 1, pillar_2: 1, pillar_3: 0 },
      }),
    );

    expect(parsed.recommended_posts).toHaveLength(1);
    expect(parsed.anchor_story.format).toBe("linkedin");
    expect(parsed.anchor_story.source_chunk_id).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
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

  it("drops hallucinated source chunk ids before persistence", () => {
    const parsed = parseNarrativePlan(
      JSON.stringify({
        main_theme: "The webhook loop turns shipping into source material.",
        content_strategy:
          "Use the implementation work as proof that the product listens to real building signals.",
        anchor_story: {
          format: "linkedin",
          story_type: "build_decision",
          title: "Why commit webhooks beat polling",
          summary: "The app moved to event-driven source capture.",
          pillar_match: "pillar_1",
          source_note: "GitHub commit evidence.",
          source_chunk_id: "valid-chunk",
        },
        recommended_posts: [
          {
            format: "x_thread",
            story_type: "proof",
            title: "The commit that made sources automatic",
            summary: "A thread on auto-syncing valuable commits.",
            pillar_match: "pillar_2",
            source_note: "GitHub commit evidence.",
            source_chunk_id: "invented-chunk",
          },
        ],
        proof_assets: [],
        pillar_balance: { pillar_1: 1, pillar_2: 1, pillar_3: 0 },
      }),
    );

    const sanitized = sanitizeNarrativePlanSourceIds(
      parsed,
      new Set(["valid-chunk"]),
    );

    expect(sanitized.anchor_story.source_chunk_id).toBe("valid-chunk");
    expect(sanitized.recommended_posts[0].source_chunk_id).toBeUndefined();
  });
});
