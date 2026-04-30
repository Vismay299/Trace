import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __traceDbClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __traceDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  if (!globalThis.__traceDbClient) {
    globalThis.__traceDbClient = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      prepare: false,
    });
  }
  return globalThis.__traceDbClient;
}

export function getDb() {
  if (!globalThis.__traceDb) {
    globalThis.__traceDb = drizzle(getClient(), { schema, logger: false });
  }
  return globalThis.__traceDb;
}

export const db = new Proxy(
  {},
  {
    get(_t, prop) {
      const real = getDb() as unknown as Record<string | symbol, unknown>;
      const v = real[prop];
      return typeof v === "function" ? (v as Function).bind(real) : v;
    },
  },
) as ReturnType<typeof getDb>;

export { schema };
export * from "./schema";
