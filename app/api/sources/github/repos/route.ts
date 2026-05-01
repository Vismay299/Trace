import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getSourceConnection } from "@/lib/integrations/shared/connections";
import { decryptToken } from "@/lib/integrations/github/crypto";
import {
  GitHubTokenError,
  listGitHubRepos,
} from "@/lib/integrations/github/client";
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

  const connectionId = new URL(req.url).searchParams.get("connectionId");
  if (!connectionId) {
    return NextResponse.json({ error: "Missing connectionId" }, { status: 400 });
  }
  const connection = await getSourceConnection(userId, connectionId);
  if (!connection || connection.sourceType !== "github") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!connection.accessTokenEncrypted) {
    return NextResponse.json({ error: "GitHub is not connected" }, { status: 409 });
  }

  try {
    const repos = await listGitHubRepos(decryptToken(connection.accessTokenEncrypted));
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
