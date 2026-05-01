import { afterEach, describe, expect, it, vi } from "vitest";
import {
  featureFlagSnapshot,
  isBetaSignupAllowed,
  isFeatureEnabled,
} from "../index";

describe("feature flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads explicit true values only", () => {
    expect(isFeatureEnabled("beta_gate", { TRACE_FEATURE_BETA_GATE: "true" }))
      .toBe(true);
    expect(isFeatureEnabled("beta_gate", { TRACE_FEATURE_BETA_GATE: "TRUE" }))
      .toBe(false);
  });

  it("returns a complete feature snapshot", () => {
    expect(
      featureFlagSnapshot({
        TRACE_FEATURE_BILLING: "true",
        TRACE_FEATURE_GITHUB_SYNC: "false",
      }),
    ).toMatchObject({
      billing: true,
      github_sync: false,
      beta_gate: false,
    });
  });

  it("allows beta signup by allow-listed email or access code", () => {
    vi.stubEnv("TRACE_FEATURE_BETA_GATE", "true");
    vi.stubEnv(
      "TRACE_BETA_ALLOWED_EMAILS",
      "founder@example.com,builder@example.com",
    );
    vi.stubEnv("TRACE_BETA_ACCESS_CODES", "launch-alpha,launch-pro");

    expect(isBetaSignupAllowed({ email: " BUILDER@example.com " })).toBe(true);
    expect(
      isBetaSignupAllowed({
        email: "new@example.com",
        accessCode: " Launch-Pro ",
      }),
    ).toBe(true);
    expect(
      isBetaSignupAllowed({ email: "new@example.com", accessCode: "wrong" }),
    ).toBe(false);
  });
});
