import { describe, expect, it } from "vitest";
import { buildContinuePath, safeNextPath } from "../paths";

describe("post-auth path helpers", () => {
  it("preserves safe app destinations and pro intent", () => {
    expect(buildContinuePath({ next: "/sources", plan: "pro" })).toBe(
      "/auth/continue?next=%2Fsources&plan=pro",
    );
    expect(buildContinuePath({ next: "/content/abc", plan: "free" })).toBe(
      "/auth/continue?next=%2Fcontent%2Fabc",
    );
  });

  it("rejects external or public marketing destinations", () => {
    expect(safeNextPath("https://example.com")).toBeNull();
    expect(safeNextPath("//example.com")).toBeNull();
    expect(safeNextPath("/pricing")).toBeNull();
  });
});
