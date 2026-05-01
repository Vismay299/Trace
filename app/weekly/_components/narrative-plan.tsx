"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { NarrativePlan, RecommendedPost } from "@/lib/db/schema";

export function NarrativePlanPanel({
  initialPlan,
}: {
  initialPlan: NarrativePlan | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<NarrativePlan | null>(initialPlan);
  const [mainTheme, setMainTheme] = useState(initialPlan?.mainTheme ?? "");
  const [contentStrategy, setContentStrategy] = useState(
    initialPlan?.contentStrategy ?? "",
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleStart, setScheduleStart] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const posts = useMemo(() => {
    if (!plan) return [];
    const anchor = plan.anchorStory as RecommendedPost | null;
    const recommended = (plan.recommendedPosts ?? []) as RecommendedPost[];
    return [
      ...(anchor ? [{ ...anchor, is_anchor: true }] : []),
      ...recommended,
    ];
  }, [plan]);

  const generate = async () => {
    setBusy("generate");
    setError(null);
    try {
      const res = await fetch("/api/narrative/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not generate plan.");
      setPlan(data.plan);
      setMainTheme(data.plan.mainTheme ?? "");
      setContentStrategy(data.plan.contentStrategy ?? "");
      setSelected([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate plan.");
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!plan) return;
    setBusy("save");
    setError(null);
    try {
      const res = await fetch(`/api/narrative/${plan.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mainTheme, contentStrategy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not save plan.");
      setPlan(data.plan);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save plan.");
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    if (!plan) return;
    setBusy("approve");
    setError(null);
    try {
      const res = await fetch(`/api/narrative/${plan.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not approve plan.");
      setPlan(data.plan);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve plan.");
    } finally {
      setBusy(null);
    }
  };

  const createStories = async () => {
    if (!plan) return;
    setBusy("stories");
    setError(null);
    try {
      const selectedIndexes = selected.length
        ? selected
        : posts.map((_, index) => index);
      const res = await fetch(`/api/narrative/${plan.id}/create-stories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedIndexes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not create stories.");
      router.push("/mine");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create stories.",
      );
    } finally {
      setBusy(null);
    }
  };

  const schedulePlan = async () => {
    if (!plan) return;
    setBusy("schedule");
    setError(null);
    try {
      const selectedIndexes = selected.length
        ? selected
        : posts.map((_, index) => index);
      const res = await fetch(`/api/narrative/${plan.id}/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedIndexes, startDate: scheduleStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not schedule plan.");
      router.push("/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule plan.");
    } finally {
      setBusy(null);
    }
  };

  if (!plan) {
    return (
      <div className="rounded-card border border-border-strong bg-bg-elev p-6">
        <h2 className="text-2xl font-medium tracking-tight text-text">
          Generate this week's narrative plan
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Trace will use your Strategy Doc, weekly check-in, signal status, and
          recent drafts to produce an anchored plan with source notes.
        </p>
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        <Button
          onClick={generate}
          disabled={busy === "generate"}
          className="mt-5"
        >
          {busy === "generate" ? "Generating..." : "Generate plan"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-border-strong bg-bg-elev p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
              {plan.status} · Week of {plan.weekStartDate}
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-text">
              Weekly narrative plan
            </h2>
          </div>
          <Button
            onClick={generate}
            disabled={busy === "generate"}
            variant="ghost"
          >
            Regenerate
          </Button>
        </div>

        <label className="mt-5 block text-sm text-text-muted">
          Main theme
          <Textarea
            rows={3}
            value={mainTheme}
            onChange={(e) => setMainTheme(e.target.value)}
            className="mt-2"
          />
        </label>
        <label className="mt-4 block text-sm text-text-muted">
          Content strategy
          <Textarea
            rows={5}
            value={contentStrategy}
            onChange={(e) => setContentStrategy(e.target.value)}
            className="mt-2"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={save} disabled={busy === "save"}>
            {busy === "save" ? "Saving..." : "Save edits"}
          </Button>
          <Button
            onClick={approve}
            disabled={busy === "approve"}
            variant="ghost"
          >
            {busy === "approve" ? "Approving..." : "Approve plan"}
          </Button>
        </div>
      </section>

      <section className="rounded-card border border-border-strong bg-bg-elev p-6">
        <h3 className="text-xl font-medium text-text">Recommended posts</h3>
        <div className="mt-4 grid gap-3">
          {posts.map((post, index) => (
            <label
              key={`${post.title}-${index}`}
              className="flex gap-3 rounded-2xl border border-border-strong p-4"
            >
              <input
                type="checkbox"
                checked={selected.includes(index)}
                onChange={(e) =>
                  setSelected((current) =>
                    e.target.checked
                      ? [...current, index]
                      : current.filter((i) => i !== index),
                  )
                }
                className="mt-1"
              />
              <span>
                <span className="block text-xs uppercase tracking-[0.18em] text-text-dim">
                  {post.is_anchor ? "anchor" : post.format} ·{" "}
                  {post.story_type.replaceAll("_", " ")}
                </span>
                <span className="mt-1 block font-medium text-text">
                  {post.title}
                </span>
                <span className="mt-1 block text-sm text-text-muted">
                  {post.summary}
                </span>
                <span className="mt-2 block text-xs italic text-text-dim">
                  {post.source_note}
                </span>
              </span>
            </label>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        <Button
          onClick={createStories}
          disabled={busy === "stories"}
          className="mt-5"
        >
          {busy === "stories"
            ? "Creating stories..."
            : selected.length
              ? `Create ${selected.length} story seeds`
              : "Create all story seeds"}
        </Button>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="text-sm text-text-muted">
            Start scheduling on{" "}
            <input
              type="date"
              value={scheduleStart}
              onChange={(event) => setScheduleStart(event.target.value)}
              className="ml-2 rounded-2xl border border-border-strong bg-bg px-3 py-2 text-text"
            />
          </label>
          <Button
            onClick={schedulePlan}
            disabled={busy === "schedule"}
            variant="ghost"
          >
            {busy === "schedule"
              ? "Scheduling..."
              : selected.length
                ? `Schedule ${selected.length} selected`
                : "Schedule all to calendar"}
          </Button>
        </div>
      </section>
    </div>
  );
}
