import { describe, expect, it } from "vitest";
import { getAuthEnv } from "../env";

describe("getAuthEnv", () => {
  it("prefers Auth.js v5 names", () => {
    expect(
      getAuthEnv({
        AUTH_SECRET: "auth-secret",
        NEXTAUTH_SECRET: "nextauth-secret",
        AUTH_GITHUB_ID: "auth-github-id",
        GITHUB_CLIENT_ID: "github-client-id",
        AUTH_GITHUB_SECRET: "auth-github-secret",
        GITHUB_CLIENT_SECRET: "github-client-secret",
        AUTH_GOOGLE_ID: "auth-google-id",
        GOOGLE_CLIENT_ID: "google-client-id",
        AUTH_GOOGLE_SECRET: "auth-google-secret",
        GOOGLE_CLIENT_SECRET: "google-client-secret",
      }),
    ).toEqual({
      secret: "auth-secret",
      githubClientId: "auth-github-id",
      githubClientSecret: "auth-github-secret",
      googleClientId: "auth-google-id",
      googleClientSecret: "auth-google-secret",
    });
  });

  it("falls back to existing Vercel/NextAuth names", () => {
    expect(
      getAuthEnv({
        NEXTAUTH_SECRET: "nextauth-secret",
        GITHUB_CLIENT_ID: "github-client-id",
        GITHUB_CLIENT_SECRET: "github-client-secret",
        GOOGLE_CLIENT_ID: "google-client-id",
        GOOGLE_CLIENT_SECRET: "google-client-secret",
      }),
    ).toEqual({
      secret: "nextauth-secret",
      githubClientId: "github-client-id",
      githubClientSecret: "github-client-secret",
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
    });
  });

  it("ignores empty and whitespace-only values", () => {
    expect(
      getAuthEnv({
        AUTH_SECRET: " ",
        NEXTAUTH_SECRET: " nextauth-secret ",
        AUTH_GOOGLE_ID: "",
        GOOGLE_CLIENT_ID: " google-client-id ",
      }),
    ).toMatchObject({
      secret: "nextauth-secret",
      googleClientId: "google-client-id",
      googleClientSecret: undefined,
    });
  });
});
