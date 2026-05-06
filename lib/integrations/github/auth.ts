import { createSign, randomBytes } from "node:crypto";

export type GitHubInstallState = {
  value: string;
  createdAt: number;
  returnTo?: string;
};

export function createGitHubOAuthState(returnTo?: string): GitHubInstallState {
  return {
    value: randomBytes(24).toString("base64url"),
    createdAt: Date.now(),
    returnTo,
  };
}

export function encodeOAuthState(state: GitHubInstallState): string {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

export function decodeOAuthState(value: string): GitHubInstallState | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as GitHubInstallState;
    if (!parsed.value || !parsed.createdAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildGitHubInstallUrl({
  state,
}: {
  state: string;
}) {
  const slug = process.env.GITHUB_SOURCE_APP_SLUG;
  if (!slug) throw new Error("GITHUB_SOURCE_APP_SLUG is not set.");
  const url = new URL(
    `https://github.com/apps/${encodeURIComponent(slug)}/installations/new`,
  );
  url.searchParams.set("state", state);
  return url.toString();
}

export function createGitHubAppJwt(now = new Date()): string {
  const appId = process.env.GITHUB_SOURCE_APP_ID;
  const privateKey = normalizePrivateKey(process.env.GITHUB_SOURCE_PRIVATE_KEY);
  if (!appId || !privateKey) {
    throw new Error("GitHub App env vars are not configured.");
  }

  const issuedAt = Math.floor(now.getTime() / 1000) - 60;
  const expiresAt = issuedAt + 9 * 60;
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({ iat: issuedAt, exp: expiresAt, iss: appId }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey, "base64url");
  return `${unsigned}.${signature}`;
}

export type GitHubInstallationAccount = {
  id: number;
  login?: string;
  avatar_url?: string | null;
  html_url?: string;
  type?: string;
};

export type GitHubInstallation = {
  id: number;
  account?: GitHubInstallationAccount | null;
  repository_selection?: "all" | "selected";
  html_url?: string;
};

export async function getGitHubInstallation(
  installationId: string | number,
): Promise<GitHubInstallation> {
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: githubAppHeaders(),
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub installation lookup failed: ${res.status}`);
  }
  return (await res.json()) as GitHubInstallation;
}

export async function getInstallationAccessToken(
  installationId: string | number,
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: githubAppHeaders(),
    },
  );
  const data = (await res.json()) as { token?: string; message?: string };
  if (!res.ok || !data.token) {
    throw new Error(
      data.message ?? `GitHub installation token failed: ${res.status}`,
    );
  }
  return data.token;
}

function githubAppHeaders(): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${createGitHubAppJwt()}`,
    "x-github-api-version": "2022-11-28",
  };
}

function normalizePrivateKey(value?: string) {
  return value?.replace(/\\n/g, "\n").trim();
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}
