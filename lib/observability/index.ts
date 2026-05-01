import * as Sentry from "@sentry/nextjs";

const REDACTED_KEYS = [
  "access_token",
  "refresh_token",
  "token",
  "authorization",
  "content",
  "transcript",
  "source",
  "password",
];

export function initSentry(runtime: "client" | "server" | "edge") {
  const dsn =
    runtime === "client"
      ? process.env.NEXT_PUBLIC_SENTRY_DSN
      : process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    beforeSend(event) {
      return redactEvent(event);
    },
  });
}

export function setObservabilityUser(user?: {
  id?: string | null;
  email?: string | null;
}) {
  if (!user?.id && !user?.email) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id ?? undefined,
    email: user.email ?? undefined,
  });
}

export function captureException(error: unknown, context?: string) {
  Sentry.captureException(error, context ? { tags: { context } } : undefined);
}

function redactEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request?.headers) {
    for (const key of Object.keys(event.request.headers)) {
      if (shouldRedact(key)) event.request.headers[key] = "[Filtered]";
    }
  }
  if (event.extra) {
    event.extra = redactObject(event.extra) as typeof event.extra;
  }
  return event;
}

function redactObject(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactObject);
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      shouldRedact(key) ? "[Filtered]" : redactObject(item),
    ]),
  );
}

function shouldRedact(key: string): boolean {
  const normalized = key.toLowerCase();
  return REDACTED_KEYS.some((redacted) => normalized.includes(redacted));
}
