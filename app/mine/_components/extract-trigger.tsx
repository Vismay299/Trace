"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ExtractTrigger({ pendingChunks }: { pendingChunks: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stories/extract", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error === "AI_BUDGET_EXHAUSTED"
            ? `Out of weekly AI credits. Resets ${data.periodEnd}.`
            : (data?.error ?? "Extraction failed."),
        );
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (pendingChunks === 0) {
    return (
      <p className="text-xs text-text-dim">
        No new chunks to mine. Upload more files to surface fresh story seeds.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onClick} disabled={busy}>
        {busy ? "Mining…" : `Mine ${pendingChunks} new chunks for stories`}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
