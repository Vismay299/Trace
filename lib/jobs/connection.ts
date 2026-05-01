import IORedis from "ioredis";

declare global {
  var __traceRedis: IORedis | undefined;
}

export function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set. Phase 2 workers require Redis.");
  }
  if (!globalThis.__traceRedis) {
    globalThis.__traceRedis = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return globalThis.__traceRedis;
}

export async function checkRedisHealth() {
  if (!process.env.REDIS_URL) {
    return { ok: false, reason: "REDIS_URL not configured" };
  }
  try {
    const pong = await getRedisConnection().ping();
    return { ok: pong === "PONG", reason: pong };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Redis health check failed",
    };
  }
}
