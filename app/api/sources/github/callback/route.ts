import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import {
  decodeOAuthState,
  exchangeGitHubCode,
} from "@/lib/integrations/github/auth";
import { getGitHubUser } from "@/lib/integrations/github/client";
import { encryptToken } from "@/lib/integrations/github/crypto";
import { upsertSourceConnection } from "@/lib/integrations/shared/connections";
import { captureServerEvent } from "@/lib/analytics/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return redirectWithError(req, "unauthorized");
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const cookieState = readCookie(req, "trace_github_source_state");
  const state = stateParam ? decodeOAuthState(stateParam) : null;
  if (!code || !state || state.value !== cookieState) {
    return redirectWithError(req, "invalid_state");
  }

  try {
    const origin = `${url.protocol}//${url.host}`;
    const token = await exchangeGitHubCode({
      code,
      redirectUri: `${origin}/api/sources/github/callback`,
    });
    const githubUser = await getGitHubUser(token.accessToken);
    const connection = await upsertSourceConnection({
      userId,
      sourceType: "github",
      status: "needs_selection",
      accessTokenEncrypted: encryptToken(token.accessToken),
      providerAccountId: String(githubUser.id),
      sourceMetadata: {
        githubLogin: githubUser.login,
        githubUserId: githubUser.id,
        avatarUrl: githubUser.avatar_url,
        profileUrl: githubUser.html_url,
        accountType: githubUser.type,
        scopes: token.scope.split(",").map((scope) => scope.trim()).filter(Boolean),
      },
    });
    captureServerEvent({
      event: "source_connected",
      distinctId: userId,
      properties: { sourceType: "github" },
    });
    const res = NextResponse.redirect(
      `${origin}/sources?connected=github&connection=${connection.id}`,
    );
    res.cookies.delete("trace_github_source_state");
    return res;
  } catch (err) {
    console.error("[sources/github/callback] failed", err);
    return redirectWithError(req, "github_callback_failed");
  }
}

function redirectWithError(req: Request, error: string) {
  const url = new URL(req.url);
  const res = NextResponse.redirect(`${url.origin}/sources?source_error=${error}`);
  res.cookies.delete("trace_github_source_state");
  return res;
}

function readCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") ?? "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
