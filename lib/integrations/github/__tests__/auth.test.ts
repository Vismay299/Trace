import { generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGitHubInstallUrl,
  createGitHubAppJwt,
  createGitHubOAuthState,
  decodeOAuthState,
  encodeOAuthState,
  getInstallationAccessToken,
} from "../auth";

describe("GitHub source auth", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    process.env.GITHUB_SOURCE_APP_ID = "12345";
    process.env.GITHUB_SOURCE_APP_SLUG = "trace-dev";
    process.env.GITHUB_SOURCE_PRIVATE_KEY = testPrivateKey();
  });

  it("round-trips OAuth state payloads", () => {
    const state = createGitHubOAuthState("/sources");
    expect(decodeOAuthState(encodeOAuthState(state))).toEqual(state);
  });

  it("builds the GitHub App installation URL", () => {
    const url = new URL(
      buildGitHubInstallUrl({
        state: "state",
      }),
    );
    expect(url.hostname).toBe("github.com");
    expect(url.pathname).toBe("/apps/trace-dev/installations/new");
    expect(url.searchParams.get("state")).toBe("state");
  });

  it("creates a GitHub App JWT for installation auth", () => {
    const jwt = createGitHubAppJwt(new Date("2026-05-06T12:00:00Z"));
    const [header, payload, signature] = jwt.split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString("utf8"))).toEqual({
      alg: "RS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))).toMatchObject({
      iss: "12345",
    });
    expect(signature.length).toBeGreaterThan(20);
  });

  it("exchanges an installation id for an installation access token", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ token: "installation-token" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getInstallationAccessToken("999")).resolves.toBe(
      "installation-token",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/app/installations/999/access_tokens",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

function testPrivateKey() {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return privateKey.export({ format: "pem", type: "pkcs1" }).toString();
}
