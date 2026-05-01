import { describe, expect, it } from "vitest";
import { FREE_FILE_LIMIT, PRO_FILE_LIMIT, uploadLimitForTier } from "../index";

describe("upload limits", () => {
  it("keeps manual upload quotas aligned with launch pricing", () => {
    expect(uploadLimitForTier("free")).toBe(FREE_FILE_LIMIT);
    expect(uploadLimitForTier("pro")).toBe(PRO_FILE_LIMIT);
    expect(uploadLimitForTier("studio")).toBe(FREE_FILE_LIMIT);
  });
});
