/**
 * NextAuth v5 entrypoint. Re-exports `auth`, `handlers`, `signIn`, `signOut`
 * for use across the app.
 */
import NextAuth from "next-auth";
import { eq } from "drizzle-orm";
import { authConfig } from "./options";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    throw new UnauthorizedError("Not authenticated");
  }
  return userId;
}

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

/** Throws ForbiddenError if the user is not on the pro tier. */
export async function requireProTier(userId: string): Promise<void> {
  const [user] = await db
    .select({ tier: users.tier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (user?.tier !== "pro") {
    throw new ForbiddenError("Pro plan required");
  }
}

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED" as const;
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN" as const;
}
