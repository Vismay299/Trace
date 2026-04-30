"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

export function StoryFilters({
  pillars,
  activePillar,
}: {
  pillars: string[];
  activePillar?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const setPillar = (p?: string) => {
    const next = new URLSearchParams(params);
    if (p) next.set("pillar", p);
    else next.delete("pillar");
    router.push(`/mine?${next.toString()}`);
  };

  const tabs = [{ label: "All", value: undefined }, ...pillars.map((p) => ({ label: p, value: p }))];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.value ?? "all"}
          type="button"
          onClick={() => setPillar(t.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition",
            (activePillar ?? "") === (t.value ?? "")
              ? "border-accent bg-accent text-black"
              : "border-border-strong text-text-muted hover:border-accent",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
