import { describe, it, expect } from "vitest";
import {
  QUESTIONS,
  SECTIONS,
  findQuestion,
  nextQuestionAfter,
  progressFor,
  totalQuestions,
} from "../questions";

describe("interview questions", () => {
  it("has exactly 19 questions across 5 sections", () => {
    expect(totalQuestions()).toBe(19);
    expect(SECTIONS).toHaveLength(5);
  });

  it("global indexes are 1..19 and unique", () => {
    const idxs = QUESTIONS.map((q) => q.globalIndex).sort((a, b) => a - b);
    expect(idxs).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
  });

  it("section counts match spec §4", () => {
    const counts = QUESTIONS.reduce<Record<number, number>>((acc, q) => {
      acc[q.section] = (acc[q.section] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts[1]).toBe(5);
    expect(counts[2]).toBe(4);
    expect(counts[3]).toBe(3);
    expect(counts[4]).toBe(4);
    expect(counts[5]).toBe(3);
  });

  it("findQuestion returns the right question", () => {
    expect(findQuestion("s1q1")?.section).toBe(1);
    expect(findQuestion("s5q3")?.section).toBe(5);
    expect(findQuestion("missing")).toBeUndefined();
  });

  it("nextQuestionAfter walks the sequence", () => {
    expect(nextQuestionAfter("s1q1")?.id).toBe("s1q2");
    expect(nextQuestionAfter("s5q3")).toBeUndefined();
  });

  it("progress percent is 0..100", () => {
    expect(progressFor("s1q1").percent).toBeGreaterThan(0);
    expect(progressFor("s5q3").percent).toBe(100);
  });
});
