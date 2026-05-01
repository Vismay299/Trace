import { describe, expect, it } from "vitest";
import { isSourceType, normalizeConnectionState } from "../types";

describe("shared source integration types", () => {
  it("accepts launch and deferred source types", () => {
    expect(isSourceType("github")).toBe(true);
    expect(isSourceType("google_drive")).toBe(true);
    expect(isSourceType("notion")).toBe(true);
    expect(isSourceType("manual_upload")).toBe(false);
  });

  it("normalizes unknown connection states defensively", () => {
    expect(normalizeConnectionState("ready")).toBe("ready");
    expect(normalizeConnectionState("strange")).toBe("not_connected");
    expect(normalizeConnectionState(null)).toBe("not_connected");
  });
});
