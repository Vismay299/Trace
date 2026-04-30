"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateStrategyTrigger() {
  const router = useRouter();
  const fired = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch("/api/strategy/generate", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(
            data?.error === "AI_BUDGET_EXHAUSTED"
              ? `Out of weekly AI credits. Resets ${data.periodEnd}.`
              : (data?.error ?? "Generation failed."),
          );
          return;
        }
        router.refresh();
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Network error."),
      );
  }, [router]);

  return error ? (
    <p className="mt-6 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {error}
    </p>
  ) : (
    <p className="mt-6 text-sm text-text-dim">
      Working on it… this page will refresh when it's ready.
    </p>
  );
}
