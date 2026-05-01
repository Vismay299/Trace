"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RedoStrategyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function redo() {
    const confirmed = window.confirm(
      "Redo your Strategy Doc? This replaces the current strategy and reopens the onboarding interview.",
    );
    if (!confirmed) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/strategy/redo", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not reset strategy.");
      setLoading(false);
      return;
    }
    router.push("/onboarding?redo=1");
    router.refresh();
  }

  return (
    <div>
      <Button variant="ghost" onClick={redo} disabled={loading}>
        {loading ? "Resetting..." : "Redo Strategy"}
      </Button>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
