import { z } from "zod";
import { isFeatureEnabled, type FeatureFlag } from "@/lib/flags";

type EnvInput = Record<string, string | undefined>;

const requiredByFlag: Partial<Record<FeatureFlag, string[]>> = {
  billing: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRO_PRICE_ID"],
  github_sync: ["GITHUB_SOURCE_CLIENT_ID", "GITHUB_SOURCE_CLIENT_SECRET"],
  ship_to_post: ["REDIS_URL"],
  admin_ai_ops: ["POSTHOG_KEY"],
  nim_routing: ["NVIDIA_NIM_API_KEY"],
};

const phase2EnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  GITHUB_SOURCE_CLIENT_ID: z.string().optional(),
  GITHUB_SOURCE_CLIENT_SECRET: z.string().optional(),
  GITHUB_SOURCE_APP_ID: z.string().optional(),
  GITHUB_SOURCE_PRIVATE_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  NVIDIA_NIM_API_KEY: z.string().optional(),
  GOOGLE_DRIVE_CLIENT_ID: z.string().optional(),
  GOOGLE_DRIVE_CLIENT_SECRET: z.string().optional(),
  NOTION_CLIENT_ID: z.string().optional(),
  NOTION_CLIENT_SECRET: z.string().optional(),
  TRACE_BETA_ALLOWED_EMAILS: z.string().optional(),
  TRACE_BETA_ACCESS_CODES: z.string().optional(),
});

export type Phase2Env = z.infer<typeof phase2EnvSchema>;

export function getPhase2Env(env: EnvInput = process.env): Phase2Env {
  return phase2EnvSchema.parse(env);
}

export function validatePhase2Env(
  env: EnvInput = process.env,
): { ok: true } | { ok: false; missing: string[] } {
  getPhase2Env(env);
  const missing = new Set<string>();

  if (isFeatureEnabled("nim_routing", env) && !env.NVIDIA_NIM_API_KEY) {
    missing.add("NVIDIA_NIM_API_KEY");
  }

  for (const [flag, keys] of Object.entries(requiredByFlag)) {
    if (!isFeatureEnabled(flag as FeatureFlag, env)) continue;
    for (const key of keys ?? []) {
      if (!env[key]?.trim()) missing.add(key);
    }
  }

  return missing.size ? { ok: false, missing: [...missing].sort() } : { ok: true };
}

export function requirePhase2Env(flag: FeatureFlag): void {
  const validation = validatePhase2Env();
  if (validation.ok) return;
  const required = requiredByFlag[flag] ?? [];
  const missing = validation.missing.filter((key) => required.includes(key));
  if (missing.length) {
    throw new Error(
      `Missing ${flag} environment variables: ${missing.join(", ")}`,
    );
  }
}
