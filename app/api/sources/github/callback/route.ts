import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import {
  decodeOAuthState,
  getGitHubInstallation,
} from "@/lib/integrations/github/auth";
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
  try {
    const { requireProTier } = await import("@/lib/auth");
    await requireProTier(userId);
  } catch {
    return redirectWithError(req, "pro_required");
  }

  const url = new URL(req.url);
  const installationId = url.searchParams.get("installation_id");
  const setupAction = url.searchParams.get("setup_action");
  const stateParam = url.searchParams.get("state");
  const cookieState = readCookie(req, "trace_github_source_state");
  const state = stateParam ? decodeOAuthState(stateParam) : null;
  if (!installationId || !state || state.value !== cookieState) {
    return redirectWithError(req, "invalid_state");
  }

  try {
    const origin = `${url.protocol}//${url.host}`;
    const installation = await getGitHubInstallation(installationId);
    const account = installation.account;
    const connection = await upsertSourceConnection({
      userId,
      sourceType: "github",
      status: "needs_selection",
      providerAccountId: account?.id ? String(account.id) : null,
      providerInstallationId: String(installation.id),
      sourceMetadata: {
        githubLogin: account?.login ?? null,
        githubAccountId: account?.id ?? null,
        avatarUrl: account?.avatar_url ?? null,
        profileUrl: account?.html_url ?? null,
        accountType: account?.type ?? null,
        installationId: installation.id,
        repositorySelection: installation.repository_selection ?? null,
        setupAction,
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
