import { describe, it, expect, beforeEach } from "vitest";
import { _resetPromptCache, listPrompts, loadPrompt } from "../prompts";

describe("prompt loader", () => {
  beforeEach(() => _resetPromptCache());

  it("lists every shipped prompt", () => {
    const prompts = listPrompts();
    for (const required of [
      "strategy-generation",
      "interview-followup",
      "story-extraction",
      "content-linkedin",
      "content-instagram",
      "content-x-thread",
      "content-substack",
      "slop-detector",
      "voice-check",
      "weekly-narrative-planner",
      "low-signal-followup",
      "checkin-followup",
      "signal-assessment",
      "sample-posts",
    ]) {
      expect(prompts).toContain(required);
    }
  });

  it("substitutes placeholders", () => {
    const out = loadPrompt("interview-followup", {
      question: "What did you ship this week?",
      answer: "stuff",
      sectionName: "Section 1",
    });
    expect(out.system).toContain("What did you ship this week?");
    expect(out.system).toContain("Section 1");
    expect(out.system).not.toContain("{{question}}");
  });

  it("auto-injects ANTI_SLOP_BLOCK", () => {
    const out = loadPrompt("content-linkedin", { sourceContent: "x" });
    expect(out.system).toContain("ANTI-SLOP RULES");
  });

  it("leaves unknown placeholders intact (non-fatal)", () => {
    const out = loadPrompt("interview-followup", {});
    expect(out.system).toContain("{{question}}");
  });

  it("frontmatter exposes version + task_type", () => {
    const out = loadPrompt("content-linkedin");
    expect(out.meta.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(out.meta.task_type).toBe("content_generation");
  });
});
