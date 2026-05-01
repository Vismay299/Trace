import { describe, expect, it } from "vitest";
import { getLaunchFlags, isBetaSignupAllowed } from "../flags";

describe("launch flags", () => {
  it("parses explicit true values only", () => {
    expect(
      getLaunchFlags({
        TRACE_FEATURE_BETA_GATE: "true",
        TRACE_FEATURE_BILLING: "TRUE",
        TRACE_FEATURE_GITHUB_SYNC: "false",
        TRACE_FEATURE_CALENDAR: "1",
        TRACE_FEATURE_SHIP_TO_POST: " true ",
      }),
    ).toMatchObject({
      betaGate: true,
      billing: true,
      githubSync: false,
      calendar: false,
      shipToPost: true,
    });
  });

  it("allows all signups when beta gate is off", () => {
    expect(
      isBetaSignupAllowed({
        email: "builder@example.com",
        env: { TRACE_FEATURE_BETA_GATE: "false" },
      }),
    ).toBe(true);
  });

  it("allows beta signups by email allow-list or access code", () => {
    const env = {
      TRACE_FEATURE_BETA_GATE: "true",
      TRACE_BETA_ALLOWED_EMAILS: "founder@example.com, builder@example.com",
      TRACE_BETA_ACCESS_CODES: "launch-alpha, launch-pro",
    };

    expect(isBetaSignupAllowed({ email: " BUILDER@example.com ", env })).toBe(
      true,
    );
    expect(
      isBetaSignupAllowed({
        email: "new@example.com",
        accessCode: " Launch-Pro ",
        env,
      }),
    ).toBe(true);
  });

  it("blocks beta signups outside the allow-list", () => {
    expect(
      isBetaSignupAllowed({
        email: "new@example.com",
        accessCode: "wrong",
        env: {
          TRACE_FEATURE_BETA_GATE: "true",
          TRACE_BETA_ALLOWED_EMAILS: "founder@example.com",
          TRACE_BETA_ACCESS_CODES: "launch-alpha",
        },
      }),
    ).toBe(false);
  });
});
