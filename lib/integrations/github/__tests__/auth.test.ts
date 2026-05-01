import { describe, expect, it, beforeEach } from "vitest";
import {
  buildGitHubAuthorizeUrl,
  createGitHubOAuthState,
  decodeOAuthState,
  encodeOAuthState,
} from "../auth";

describe("GitHub source auth", () => {
  beforeEach(() => {
    process.env.GITHUB_SOURCE_CLIENT_ID = "github-client";
  });

  it("round-trips OAuth state payloads", () => {
    const state = createGitHubOAuthState("/sources");
    expect(decodeOAuthState(encodeOAuthState(state))).toEqual(state);
  });

  it("builds the GitHub authorize URL with repo scopes", () => {
    const url = new URL(
      buildGitHubAuthorizeUrl({
        state: "state",
        redirectUri: "http://localhost:3000/api/sources/github/callback",
      }),
    );
    expect(url.hostname).toBe("github.com");
    expect(url.searchParams.get("client_id")).toBe("github-client");
    expect(url.searchParams.get("scope")).toBe("repo read:user");
    expect(url.searchParams.get("state")).toBe("state");
  });
});
