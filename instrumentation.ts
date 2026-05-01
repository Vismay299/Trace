import * as Sentry from "@sentry/nextjs";
import { initSentry } from "@/lib/observability";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    initSentry("server");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    initSentry("edge");
  }
}

export const onRequestError = Sentry.captureRequestError;
