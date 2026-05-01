import * as Sentry from "@sentry/nextjs";
import { initSentry } from "@/lib/observability";

initSentry("client");

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
