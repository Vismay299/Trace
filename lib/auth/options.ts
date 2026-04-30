/**
 * NextAuth v5 (beta) configuration. Drizzle adapter wired to our user/account
 * tables. Two providers in Phase 1: Credentials (email/password, bcrypt) and
 * GitHub OAuth.
 *
 * On first sign-in, the user gets a default ai_budgets row (Mon→Sun, free
 * tier limits) so callAI can decrement immediately.
 */
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { z } from "zod";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { getOrCreateBudget } from "@/lib/ai/budget";

// The DrizzleAdapter is overloaded for pg/mysql/sqlite. TypeScript can't
// disambiguate from our untyped `db` proxy, so we cast at the call site.
// Runtime is correct — the adapter only reads/writes columns that exist.

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const adapterDb = db as unknown as Parameters<typeof DrizzleAdapter>[0];
const adapterTables = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
} as unknown as Parameters<typeof DrizzleAdapter>[1];

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(adapterDb, adapterTables),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1);
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
          image: user.avatarUrl ?? null,
        };
      },
    }),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await getOrCreateBudget(user.id, "free");
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        (token as Record<string, unknown>).userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      const userId = (token as Record<string, unknown>).userId;
      if (session.user && typeof userId === "string") {
        (session.user as { id?: string }).id = userId;
      }
      return session;
    },
  },
};

// Note: We do not augment `next-auth/jwt`'s JWT interface because the v5-beta
// package layout makes that augmentation finicky. Instead, the `jwt` and
// `session` callbacks above use targeted `as string` casts when reading the
// stored `userId`. Functionally identical, type-safe at the call sites.
