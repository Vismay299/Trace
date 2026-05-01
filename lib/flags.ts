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

function envFlag(env: EnvInput, key: string) {
  return env[key]?.trim().toLowerCase() === "true";
}

function envList(env: EnvInput, key: string) {
  return (
    env[key]
      ?.split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
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

export function isBetaSignupAllowed({
  email,
  accessCode,
  env = process.env,
}: {
  email: string;
  accessCode?: string | null;
  env?: EnvInput;
}) {
  if (!getLaunchFlags(env).betaGate) return true;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = accessCode?.trim().toLowerCase();
  const allowedEmails = envList(env, "TRACE_BETA_ALLOWED_EMAILS");
  const allowedCodes = envList(env, "TRACE_BETA_ACCESS_CODES");

  return (
    allowedEmails.includes(normalizedEmail) ||
    (Boolean(normalizedCode) && allowedCodes.includes(normalizedCode ?? ""))
  );
}
