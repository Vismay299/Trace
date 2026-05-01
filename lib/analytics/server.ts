import { PostHog } from "posthog-node";
import type { AnalyticsEvent, AnalyticsProperties } from "./events";

declare global {
  var __tracePostHog: PostHog | undefined;
}

function getPostHog() {
  const key = process.env.POSTHOG_KEY;
  if (!key) return null;
  if (!globalThis.__tracePostHog) {
    globalThis.__tracePostHog = new PostHog(key, {
      host: process.env.POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return globalThis.__tracePostHog;
}

export function captureServerEvent({
  event,
  distinctId,
  properties,
}: {
  event: AnalyticsEvent;
  distinctId?: string | null;
  properties?: AnalyticsProperties;
}) {
  const client = getPostHog();
  if (!client || !distinctId) return;
  client.capture({
    distinctId,
    event,
    properties: scrubProperties(properties),
  });
}

function scrubProperties(properties?: AnalyticsProperties) {
  if (!properties) return undefined;
  return Object.fromEntries(
    Object.entries(properties).filter(([key]) => {
      const normalized = key.toLowerCase();
      return (
        !normalized.includes("token") &&
        !normalized.includes("content") &&
        !normalized.includes("transcript")
      );
    }),
  );
}
