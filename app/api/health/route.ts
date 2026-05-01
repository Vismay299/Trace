import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { checkRedisHealth } from "@/lib/jobs/connection";

export const runtime = "nodejs";

export async function GET() {
  const dbHealth = await checkDatabase();
  const redisHealth = await checkRedisHealth();
  const ok = dbHealth.ok && redisHealth.ok;

  return NextResponse.json(
    {
      ok,
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    },
    { status: ok ? 200 : 503 },
  );
}

async function checkDatabase() {
  try {
    await db.execute(sql`select 1`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Database check failed",
    };
  }
}
