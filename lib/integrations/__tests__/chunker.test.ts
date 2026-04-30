import { describe, it, expect } from "vitest";
import { chunkText, tokenCount } from "../chunker";

describe("chunkText", () => {
  it("returns empty array for empty input", () => {
    expect(chunkText("", "x")).toEqual([]);
  });

  it("preserves single paragraph as one chunk", () => {
    const text = "Yesterday I cut p99 latency from 480ms to 190ms.";
    const chunks = chunkText(text, "test");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
  });

  it("splits long input into multiple chunks", () => {
    const big = Array.from({ length: 60 }, (_, i) => `Paragraph ${i}: ${"word ".repeat(40)}`).join("\n\n");
    const chunks = chunkText(big, "doc");
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.tokens).toBeLessThanOrEqual(1100);
    }
  });

  it("each chunk has a title", () => {
    const chunks = chunkText("Hello\n\nWorld", "fallback");
    for (const c of chunks) expect(c.title.length).toBeGreaterThan(0);
  });

  it("token count is non-zero for text", () => {
    expect(tokenCount("hello world")).toBeGreaterThan(0);
  });
});
