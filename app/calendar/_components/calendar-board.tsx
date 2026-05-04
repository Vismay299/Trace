"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CalendarItem = {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  platform: string;
  status: string;
  sourceOrigin: string;
  contentId: string | null;
};

type DraftItem = {
  id: string;
  title: string;
  format: string;
  citation: string | null;
};

export function CalendarBoard({
  initialItems,
  initialDrafts,
}: {
  initialItems: CalendarItem[];
  initialDrafts: DraftItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [selectedDraft, setSelectedDraft] = useState(
    initialDrafts[0]?.id ?? "",
  );
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = dateKey(item.scheduledDate);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  const days = useMemo(() => nextDays(28), []);

  async function scheduleDraft() {
    if (!selectedDraft) return;
    setBusy("schedule");
    setError(null);
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        generatedContentId: selectedDraft,
        scheduledDate: date,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Could not schedule draft.");
      setBusy(null);
      return;
    }
    const draft = drafts.find((item) => item.id === selectedDraft);
    setItems((current) => [
      ...current,
      {
        id: data.item.id,
        title: data.item.title ?? draft?.title ?? "Draft",
        description: data.item.description ?? draft?.citation ?? null,
        scheduledDate: data.item.scheduledDate,
        platform: data.item.platform,
        status: data.item.status,
        sourceOrigin: data.item.sourceOrigin ?? "generated_content",
        contentId: data.item.generatedContentId,
      },
    ]);
    setDrafts((current) => current.filter((item) => item.id !== selectedDraft));
    setSelectedDraft("");
    setBusy(null);
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(id);
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    setItems((current) => current.filter((item) => item.id !== id));
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-card border border-border-strong bg-bg-elev p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-text">Next 4 weeks</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
            Internal planning only
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {days.map((day) => {
            const dayItems = byDate.get(day) ?? [];
            return (
              <article
                key={day}
                className="min-h-36 rounded-2xl border border-border-strong bg-bg p-4"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
                  {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="mt-3 space-y-2">
                  {dayItems.length ? (
                    dayItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border-strong px-3 py-2"
                      >
                        <p className="text-xs uppercase tracking-[0.16em] text-accent">
                          {(item.platform || "draft").replaceAll("_", " ")} ·{" "}
                          {item.sourceOrigin}
                        </p>
                        <p className="mt-1 text-sm font-medium text-text">
                          {item.title}
                        </p>
                        {item.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                            {item.description}
                          </p>
                        ) : null}
                        <div className="mt-2 flex gap-3 text-xs">
                          {item.contentId ? (
                            <Link
                              href={`/content/${item.contentId}`}
                              className="text-accent hover:underline"
                            >
                              Open
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            disabled={busy === item.id}
                            className="text-text-dim hover:text-danger"
                          >
                            Unschedule
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-dim">Open slot</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="rounded-card border border-border-strong bg-bg-elev p-5">
        <h2 className="text-xl font-medium text-text">Schedule a draft</h2>
        <p className="mt-2 text-sm text-text-muted">
          Pick an unscheduled draft and give it a date. Publishing still stays
          manual.
        </p>
        <label className="mt-5 block text-sm text-text-muted">
          Draft
          <select
            value={selectedDraft}
            onChange={(event) => setSelectedDraft(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-border-strong bg-bg px-4 py-3 text-sm text-text"
          >
            <option value="">Choose a draft</option>
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.format}: {draft.title}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm text-text-muted">
          Date
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-2"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button
          onClick={scheduleDraft}
          disabled={!selectedDraft || busy === "schedule"}
          className="mt-5 w-full"
        >
          {busy === "schedule" ? "Scheduling..." : "Schedule draft"}
        </Button>
      </aside>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextDays(count: number) {
  const start = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function dateKey(value: unknown) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}
