/**
 * NextAuth v5 entrypoint. Re-exports `auth`, `handlers`, `signIn`, `signOut`
 * for use across the app.
 */
import NextAuth from "next-auth";
import { authConfig } from "./options";

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
  return ((session?.user as { id?: string } | undefined)?.id) ?? null;
}

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED" as const;
}
