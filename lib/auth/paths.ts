const APP_PATHS = new Set([
  "/dashboard",
  "/strategy",
  "/sources",
  "/mine",
  "/content",
  "/calendar",
  "/weekly",
  "/weekly/plan",
  "/settings",
]);

export function buildContinuePath({
  next,
  plan,
}: {
  next?: string | null;
  plan?: string | null;
}) {
  const params = new URLSearchParams();
  const safeNext = safeNextPath(next);
  if (safeNext) params.set("next", safeNext);
  if (plan === "pro") params.set("plan", "pro");
  const query = params.toString();
  return `/auth/continue${query ? `?${query}` : ""}`;
}

export function safeNextPath(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  const [pathname] = next.split("?");
  if (pathname.startsWith("/content/")) return next;
  if (APP_PATHS.has(pathname)) return next;
  return null;
}
