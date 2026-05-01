import { randomBytes } from "node:crypto";

export const GITHUB_SCOPES = ["repo", "read:user"] as const;

export type GitHubOAuthState = {
  value: string;
  createdAt: number;
  returnTo?: string;
};

export function createGitHubOAuthState(returnTo?: string): GitHubOAuthState {
  return {
    value: randomBytes(24).toString("base64url"),
    createdAt: Date.now(),
    returnTo,
  };
}

export function encodeOAuthState(state: GitHubOAuthState): string {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

export function decodeOAuthState(value: string): GitHubOAuthState | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as GitHubOAuthState;
    if (!parsed.value || !parsed.createdAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildGitHubAuthorizeUrl({
  state,
  redirectUri,
}: {
  state: string;
  redirectUri: string;
}) {
  const clientId = process.env.GITHUB_SOURCE_CLIENT_ID;
  if (!clientId) throw new Error("GITHUB_SOURCE_CLIENT_ID is not set.");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", GITHUB_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "true");
  return url.toString();
}

export async function exchangeGitHubCode({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}) {
  const clientId = process.env.GITHUB_SOURCE_CLIENT_ID;
  const clientSecret = process.env.GITHUB_SOURCE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GitHub source OAuth env vars are not configured.");
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "GitHub OAuth failed.");
  }
  return {
    accessToken: data.access_token,
    tokenType: data.token_type ?? "bearer",
    scope: data.scope ?? "",
  };
}
