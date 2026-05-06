import { NextResponse } from "next/server";
import { ForbiddenError, requireProTier, requireUserId } from "@/lib/auth";
import { isSourceType } from "@/lib/integrations/shared/types";
import {
  buildGitHubInstallUrl,
  createGitHubOAuthState,
  encodeOAuthState,
} from "@/lib/integrations/github/auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ type: string }> },
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await requireProTier(userId);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Pro plan required to connect sources." }, { status: 403 });
    }
    throw err;
  }

  const { type } = await ctx.params;
  if (!isSourceType(type)) {
    return NextResponse.json({ error: "Unsupported source" }, { status: 404 });
  }

  if (type !== "github") {
    return NextResponse.json(
      { error: `${type} is deferred to Phase 2.5.` },
      { status: 409 },
    );
  }

  let redirectUrl: string;
  const state = createGitHubOAuthState("/sources");
  const encodedState = encodeOAuthState(state);
  try {
    redirectUrl = buildGitHubInstallUrl({
      state: encodedState,
    });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("GITHUB_SOURCE_APP_SLUG")
    ) {
      const url = new URL(req.url);
      return NextResponse.redirect(
        `${url.origin}/sources?source_error=github_app_not_configured`,
      );
    }
    throw err;
  }
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set("trace_github_source_state", state.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
  return res;
}
