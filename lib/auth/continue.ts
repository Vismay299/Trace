import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewSessions, strategyDocs, users } from "@/lib/db/schema";
import { safeNextPath } from "@/lib/auth/paths";

export async function resolvePostAuthDestination({
  userId,
  next,
  plan,
}: {
  userId: string;
  next?: string | null;
  plan?: string | null;
}) {
  const wantsPro = plan === "pro";
  const [session, doc, user] = await Promise.all([
    db
      .select({ isComplete: interviewSessions.isComplete })
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .limit(1),
    db
      .select({ id: strategyDocs.id })
      .from(strategyDocs)
      .where(eq(strategyDocs.userId, userId))
      .limit(1),
    db
      .select({ tier: users.tier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);

  const suffix = wantsPro ? "?plan=pro" : "";
  if (!session[0]?.isComplete) return `/onboarding${suffix}`;
  if (!doc[0]) return `/strategy?firstRun=1${wantsPro ? "&plan=pro" : ""}`;
  if (wantsPro && user[0]?.tier !== "pro") return "/checkout";

  return safeNextPath(next) ?? "/dashboard";
}
