type AuthEnvInput = Record<string, string | undefined>;

function firstDefinedEnv(env: AuthEnvInput, keys: string[]) {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getAuthEnv(env: AuthEnvInput = process.env) {
  return {
    secret: firstDefinedEnv(env, ["AUTH_SECRET", "NEXTAUTH_SECRET"]),
    githubClientId: firstDefinedEnv(env, [
      "AUTH_GITHUB_ID",
      "GITHUB_CLIENT_ID",
    ]),
    githubClientSecret: firstDefinedEnv(env, [
      "AUTH_GITHUB_SECRET",
      "GITHUB_CLIENT_SECRET",
    ]),
    googleClientId: firstDefinedEnv(env, [
      "AUTH_GOOGLE_ID",
      "GOOGLE_CLIENT_ID",
    ]),
    googleClientSecret: firstDefinedEnv(env, [
      "AUTH_GOOGLE_SECRET",
      "GOOGLE_CLIENT_SECRET",
    ]),
  };
}
