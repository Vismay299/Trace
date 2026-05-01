import { auth } from "@/lib/auth";

export async function requireAdminUser() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; email?: string | null; name?: string | null }
    | undefined;
  if (!user?.id || !isAdminEmail(user.email)) {
    throw new AdminUnauthorizedError("Admin access required.");
  }
  return { id: user.id, email: user.email ?? null, name: user.name ?? null };
}

export class AdminUnauthorizedError extends Error {
  readonly code = "ADMIN_UNAUTHORIZED" as const;
}

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return (process.env.TRACE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
