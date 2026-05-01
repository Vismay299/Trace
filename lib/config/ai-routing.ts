import { isFeatureEnabled } from "@/lib/flags";
import type { Tier } from "@/lib/ai/models";

type EnvInput = Record<string, string | undefined>;

export type AiProvider = "openrouter" | "nvidia_nim";

export type AiRoute = {
  primaryProvider: AiProvider;
  alternateProviders: AiProvider[];
  timeoutMsByTier: Record<Tier, number>;
  fallbackReasons: string[];
};

const defaultTimeouts: Record<Tier, number> = {
  1: 45_000,
  2: 35_000,
  3: 20_000,
};

export function getAiRouteConfig(
  env: EnvInput = process.env,
): AiRoute {
  const nimEnabled =
    isFeatureEnabled("nim_routing", env) && Boolean(env.NVIDIA_NIM_API_KEY);

  return {
    primaryProvider: "openrouter",
    alternateProviders: nimEnabled ? ["nvidia_nim"] : [],
    timeoutMsByTier: defaultTimeouts,
    fallbackReasons: [
      "timeout",
      "rate_limit",
      "provider_unavailable",
      "admin_experiment_disabled",
    ],
  };
}
