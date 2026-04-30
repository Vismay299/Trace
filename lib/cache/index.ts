/**
 * DB-backed cache layer. Spec §F15: caching is architecture, not optimization.
 *
 * Key shape: namespace + sha256(input). Always scoped per user where applicable.
 * Used by Strategy Doc analysis, voice score, pillar defs, product-stage,
 * narrative inputs.
 */
import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cacheEntries } from "@/lib/db/schema";

export type CacheNamespace =
  | "strategy_doc_generation"
  | "voice_few_shot"
  | "voice_score"
  | "signal_status"
  | "stage_classification"
  | "pillar_definitions"
  | "story_extraction"
  | "narrative_plan"
  | "sample_posts";

export function hashKey(input: unknown): string {
  return crypto
    .createHash("sha256")
    .update(typeof input === "string" ? input : JSON.stringify(input))
    .digest("hex");
}

export type CacheGetOpts<T> = {
  userId: string | null;
  namespace: CacheNamespace;
  key: unknown;
  /** Time-to-live in seconds. `null` = until explicitly invalidated. */
  ttl?: number | null;
  fn: () => Promise<T>;
};

export async function getCached<T>(opts: CacheGetOpts<T>): Promise<T> {
  const keyHash = hashKey(opts.key);
  const now = new Date();
  const where = and(
    opts.userId
      ? eq(cacheEntries.userId, opts.userId)
      : sql`${cacheEntries.userId} IS NULL`,
    eq(cacheEntries.namespace, opts.namespace),
    eq(cacheEntries.keyHash, keyHash),
  );

  const [hit] = await db
    .select()
    .from(cacheEntries)
    .where(where)
    .limit(1);

  if (hit && (hit.expiresAt == null || hit.expiresAt > now)) {
    return hit.value as T;
  }

  const value = await opts.fn();
  const expiresAt =
    opts.ttl == null ? null : new Date(now.getTime() + opts.ttl * 1000);

  await db
    .insert(cacheEntries)
    .values({
      userId: opts.userId,
      namespace: opts.namespace,
      keyHash,
      value: value as unknown,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [cacheEntries.userId, cacheEntries.namespace, cacheEntries.keyHash],
      set: {
        value: value as unknown,
        expiresAt,
      },
    });

  return value;
}

export async function invalidateNamespace(
  userId: string | null,
  namespace: CacheNamespace,
): Promise<void> {
  await db
    .delete(cacheEntries)
    .where(
      and(
        userId
          ? eq(cacheEntries.userId, userId)
          : sql`${cacheEntries.userId} IS NULL`,
        eq(cacheEntries.namespace, namespace),
      ),
    );
}

export async function invalidateKey(
  userId: string | null,
  namespace: CacheNamespace,
  key: unknown,
): Promise<void> {
  await db
    .delete(cacheEntries)
    .where(
      and(
        userId
          ? eq(cacheEntries.userId, userId)
          : sql`${cacheEntries.userId} IS NULL`,
        eq(cacheEntries.namespace, namespace),
        eq(cacheEntries.keyHash, hashKey(key)),
      ),
    );
}
