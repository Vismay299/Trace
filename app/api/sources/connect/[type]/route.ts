import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { isSourceType } from "@/lib/integrations/shared/types";
import {
  buildGitHubAuthorizeUrl,
  createGitHubOAuthState,
  encodeOAuthState,
} from "@/lib/integrations/github/auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ type: string }> },
) {
  try {
    await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const requestUrl = new URL(req.url);
  const origin = `${requestUrl.protocol}//${requestUrl.host}`;
  const state = createGitHubOAuthState("/sources");
  const encodedState = encodeOAuthState(state);
  const redirectUrl = buildGitHubAuthorizeUrl({
    state: encodedState,
    redirectUri: `${origin}/api/sources/github/callback`,
  });
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
