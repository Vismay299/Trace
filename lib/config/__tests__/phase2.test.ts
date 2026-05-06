import { describe, expect, it } from "vitest";
import { getAiRouteConfig } from "../ai-routing";
import { validatePhase2Env } from "../phase2";

describe("Phase 2 config", () => {
  it("does not require Stripe env while billing is disabled", () => {
    expect(validatePhase2Env({ TRACE_FEATURE_BILLING: "false" }).ok).toBe(true);
  });

  it("requires billing env only when billing flag is enabled", () => {
    const result = validatePhase2Env({ TRACE_FEATURE_BILLING: "true" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain("STRIPE_SECRET_KEY");
      expect(result.missing).toContain("STRIPE_WEBHOOK_SECRET");
      expect(result.missing).toContain("STRIPE_PRO_PRICE_ID");
    }
  });

  it("requires GitHub App env only when GitHub sync flag is enabled", () => {
    const result = validatePhase2Env({ TRACE_FEATURE_GITHUB_SYNC: "true" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain("GITHUB_SOURCE_APP_ID");
      expect(result.missing).toContain("GITHUB_SOURCE_APP_SLUG");
      expect(result.missing).toContain("GITHUB_SOURCE_PRIVATE_KEY");
      expect(result.missing).toContain("GITHUB_SOURCE_WEBHOOK_SECRET");
    }
  });

  it("keeps OpenRouter primary and exposes NIM only as opt-in alternate", () => {
    expect(getAiRouteConfig({}).primaryProvider).toBe("openrouter");
    expect(
      getAiRouteConfig({
        TRACE_FEATURE_NIM_ROUTING: "true",
        NVIDIA_NIM_API_KEY: "nim",
      }).alternateProviders,
    ).toEqual(["nvidia_nim"]);
  });
});
