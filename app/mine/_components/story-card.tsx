"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type StorySeedView = {
  id: string;
  title: string;
  summary: string | null;
  pillarMatch: string | null;
  storyType: string | null;
  relevanceScore: number | null;
  sourceCitation: string | null;
  status: string;
  sourceMode: string;
};

export function StoryCard({ seed }: { seed: StorySeedView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const generateAll = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storySeedId: seed.id,
          formats: ["linkedin", "instagram", "x_thread", "substack"],
        }),
      });
      const data = await res.json();
      const firstId = data?.contentIds?.[0] ?? data?.contentId;
      if (firstId) router.push(`/content/${firstId}`);
    } finally {
      setBusy(false);
    }
  };

  const generateLinkedIn = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storySeedId: seed.id,
          formats: ["linkedin"],
        }),
      });
      const data = await res.json();
      const id = data?.contentIds?.[0] ?? data?.contentId;
      if (id) router.push(`/content/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    setBusy(true);
    await fetch(`/api/stories/${seed.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "skipped" }),
    });
    router.refresh();
  };

  return (
    <article className="flex flex-col gap-3 rounded-card border border-border-strong bg-bg-elev p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
            {seed.pillarMatch ?? "unmapped"}
            {seed.storyType ? ` · ${seed.storyType.replaceAll("_", " ")}` : ""}
          </p>
          <h3 className="mt-1 text-lg font-medium tracking-tight text-text">
            {seed.title}
          </h3>
        </div>
        {typeof seed.relevanceScore === "number" && (
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs text-text-muted">
            {Math.round(seed.relevanceScore * 100)}%
          </span>
        )}
      </header>
      {seed.summary && (
        <p className="text-sm text-text-muted">{seed.summary}</p>
      )}
      {seed.sourceCitation && (
        <p className="text-xs italic text-text-dim">{seed.sourceCitation}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button onClick={generateAll} disabled={busy} size="md">
          {busy ? "Working…" : "Generate all 4 formats"}
        </Button>
        <Button onClick={generateLinkedIn} disabled={busy} variant="ghost">
          LinkedIn only
        </Button>
        <Button onClick={skip} disabled={busy} variant="link">
          Skip
        </Button>
      </div>
    </article>
  );
}
