import { describe, expect, it } from "vitest";
import { normalizeCodingConversation } from "../normalize";

describe("coding conversation import normalization", () => {
  it("detects Claude Code transcripts and strips obvious terminal noise", () => {
    const normalized = normalizeCodingConversation(
      [
        "Claude Code session",
        "User: fix the route.ts regression",
        "Chunk ID: abc123",
        "Assistant: I will patch app/api/foo/route.ts and run pnpm test.",
        "Tool result",
        "Assistant: Tests pass.",
      ].join("\n"),
      "trace-session.md",
    );

    expect(normalized.detected).toBe(true);
    expect(normalized.metadata.tool).toBe("claude_code");
    expect(normalized.text).toContain("route.ts");
    expect(normalized.text).not.toContain("Chunk ID");
  });

  it("leaves ordinary documents as non-detected", () => {
    const normalized = normalizeCodingConversation(
      "Quarterly planning notes with no assistant transcript.",
      "notes.md",
    );

    expect(normalized.detected).toBe(false);
  });
});
