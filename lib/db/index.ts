import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __traceDbClient: ReturnType<typeof postgres> | undefined;
  var __traceDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function buildClient() {
  const url = process.env.DATABASE_URL;
  if (!url && !isNextBuild()) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  return postgres(url ?? "postgres://postgres:postgres@127.0.0.1:5432/trace_build", {
    max: 10,
    idle_timeout: 20,
    prepare: false,
  });
}

function isNextBuild() {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

function buildDb() {
  if (!globalThis.__traceDbClient) {
    globalThis.__traceDbClient = buildClient();
  }
  if (!globalThis.__traceDb) {
    globalThis.__traceDb = drizzle(globalThis.__traceDbClient, {
      schema,
      logger: false,
    });
  }
  return globalThis.__traceDb;
}

// Eager initialization. Drizzle adapters use `is()` instanceof checks under
// the hood, which means we cannot ship a Proxy here — `db` must be a real
// drizzle instance the first time anything imports it.
export const db = buildDb();
export const getDb = buildDb;

export { schema };
export * from "./schema";
