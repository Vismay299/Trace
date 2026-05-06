import { NextResponse } from "next/server";
import { ForbiddenError, requireProTier, requireUserId } from "@/lib/auth";
import { getSourceConnection } from "@/lib/integrations/shared/connections";
import {
  GitHubTokenError,
  listGitHubRepos,
} from "@/lib/integrations/github/client";
import { getInstallationAccessToken } from "@/lib/integrations/github/auth";
import { db } from "@/lib/db";
import { sourceConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
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
      return NextResponse.json({ error: "Pro plan required." }, { status: 403 });
    }
    throw err;
  }

  const connectionId = new URL(req.url).searchParams.get("connectionId");
  if (!connectionId) {
    return NextResponse.json({ error: "Missing connectionId" }, { status: 400 });
  }
  const connection = await getSourceConnection(userId, connectionId);
  if (!connection || connection.sourceType !== "github") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!connection.providerInstallationId) {
    return NextResponse.json(
      { error: "Reconnect GitHub to enable app-based repo sync." },
      { status: 409 },
    );
  }

  try {
    const token = await getInstallationAccessToken(
      connection.providerInstallationId,
    );
    const repos = await listGitHubRepos(token);
    return NextResponse.json({ repos });
  } catch (err) {
    if (err instanceof GitHubTokenError) {
      await db
        .update(sourceConnections)
        .set({ connectionStatus: "revoked", lastSyncError: err.message })
        .where(eq(sourceConnections.id, connection.id));
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load repos" },
      { status: 500 },
    );
  }
}
