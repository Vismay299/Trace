export const FEATURE_FLAGS = [
  "billing",
  "github_sync",
  "calendar",
  "ship_to_post",
  "admin_ai_ops",
  "beta_gate",
  "nim_routing",
  "drive_sync",
  "notion_sync",
  "phase2_voice",
] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
type EnvInput = Record<string, string | undefined>;

export type LaunchFlags = {
  betaGate: boolean;
  billing: boolean;
  githubSync: boolean;
  calendar: boolean;
  shipToPost: boolean;
  adminAiOps: boolean;
  nimRouting: boolean;
};

const envKeys: Record<FeatureFlag, string> = {
  billing: "TRACE_FEATURE_BILLING",
  github_sync: "TRACE_FEATURE_GITHUB_SYNC",
  calendar: "TRACE_FEATURE_CALENDAR",
  ship_to_post: "TRACE_FEATURE_SHIP_TO_POST",
  admin_ai_ops: "TRACE_FEATURE_ADMIN_AI_OPS",
  beta_gate: "TRACE_FEATURE_BETA_GATE",
  nim_routing: "TRACE_FEATURE_NIM_ROUTING",
  drive_sync: "TRACE_FEATURE_DRIVE_SYNC",
  notion_sync: "TRACE_FEATURE_NOTION_SYNC",
  phase2_voice: "TRACE_FEATURE_PHASE2_VOICE",
};

export function isFeatureEnabled(
  flag: FeatureFlag,
  env: EnvInput = process.env,
): boolean {
  return env[envKeys[flag]] === "true";
}

export function getLaunchFlags(env: EnvInput = process.env): LaunchFlags {
  return {
    betaGate: envFlag(env, "TRACE_FEATURE_BETA_GATE"),
    billing: envFlag(env, "TRACE_FEATURE_BILLING"),
    githubSync: envFlag(env, "TRACE_FEATURE_GITHUB_SYNC"),
    calendar: envFlag(env, "TRACE_FEATURE_CALENDAR"),
    shipToPost: envFlag(env, "TRACE_FEATURE_SHIP_TO_POST"),
    adminAiOps: envFlag(env, "TRACE_FEATURE_ADMIN_AI_OPS"),
    nimRouting: envFlag(env, "TRACE_FEATURE_NIM_ROUTING"),
  };
}

export function featureFlagSnapshot(env: EnvInput = process.env) {
  return Object.fromEntries(
    FEATURE_FLAGS.map((flag) => [flag, isFeatureEnabled(flag, env)]),
  ) as Record<FeatureFlag, boolean>;
}

export function isAdminEmail(
  email?: string | null,
  env: EnvInput = process.env,
): boolean {
  if (!email) return false;
  return csv(env.TRACE_ADMIN_EMAILS).includes(
    email.trim().toLowerCase(),
  );
}

export function isBetaAllowed(
  email?: string | null,
  env: EnvInput = process.env,
): boolean {
  if (!isFeatureEnabled("beta_gate", env)) return true;
  if (isAdminEmail(email, env)) return true;
  return csv(env.TRACE_BETA_ALLOWED_EMAILS).includes(
    (email ?? "").trim().toLowerCase(),
  );
}

export function isBetaSignupAllowed({
  email,
  accessCode,
  env = process.env,
}: {
  email?: string | null;
  accessCode?: string | null;
  env?: EnvInput;
}): boolean {
  if (isBetaAllowed(email, env)) return true;
  const normalizedCode = accessCode?.trim().toLowerCase();
  if (!normalizedCode) return false;
  return csv(env.TRACE_BETA_ACCESS_CODES).includes(normalizedCode);
}

function envFlag(env: EnvInput, key: string) {
  return env[key]?.trim().toLowerCase() === "true";
}

function csv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
