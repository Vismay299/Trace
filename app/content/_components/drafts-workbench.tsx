"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type DraftFormat = "linkedin" | "instagram" | "x_thread" | "substack";

export type DraftListItem = {
  id: string;
  format: DraftFormat;
  title: string;
  origin: string | null;
  slopReviewNeeded: boolean;
};

const createFormats: { value: DraftFormat; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "x_thread", label: "X thread" },
  { value: "substack", label: "Substack" },
];

export function DraftsWorkbench({
  initialDrafts,
}: {
  initialDrafts: DraftListItem[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(initialDrafts);
  const [createFormat, setCreateFormat] = useState<DraftFormat>("linkedin");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setBusy(`${status}:${id}`);
    setError(null);
    const res = await fetch(`/api/content/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? `Could not ${status} draft.`);
      setBusy(null);
      return;
    }
    setDrafts((current) => current.filter((draft) => draft.id !== id));
    setBusy(null);
    router.refresh();
  }

  async function createDraft() {
    setBusy("create");
    setError(null);
    const res = await fetch("/api/content/drafts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ format: createFormat }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message ?? data?.error ?? "Could not create draft.");
      setBusy(null);
      return;
    }
    const draft = data.draft;
    setDrafts((current) => [
      {
        id: draft.id,
        format: draft.format,
        title:
          draft.contentMetadata?.title ??
          draft.content?.split("\n").find(Boolean)?.slice(0, 120) ??
          "Draft",
        origin: draft.contentMetadata?.origin ?? null,
        slopReviewNeeded: Boolean(draft.slopReviewNeeded),
      },
      ...current,
    ]);
    setBusy(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          Pending drafts stay here until you approve or reject them.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block">
            <span className="sr-only">Create draft format</span>
            <select
              value={createFormat}
              onChange={(event) =>
                setCreateFormat(event.target.value as DraftFormat)
              }
              className="min-h-11 appearance-none rounded-full border border-border-strong bg-bg-elev px-4 py-2 pr-10 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {createFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  Create: {format.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-dim"
            />
          </label>
          <Button onClick={createDraft} disabled={busy === "create"}>
            <Plus className="size-4" />
            {busy === "create" ? "Creating..." : "Create new draft"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {drafts.length === 0 ? (
        <p className="rounded-card border border-border-strong bg-bg-elev p-6 text-center text-text-muted">
          No pending drafts. Create one here, or approve new source-backed
          drafts when they appear.
        </p>
      ) : (
        <ul className="space-y-2">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border-strong bg-bg-elev px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
                  {formatLabel(draft.format)} · draft
                  {draft.origin === "ship_to_post" ? " · ship-to-post" : ""}
                  {draft.slopReviewNeeded ? " · slop review" : ""}
                </p>
                <p className="truncate text-sm text-text">{draft.title}</p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => updateStatus(draft.id, "approved")}
                  disabled={busy === `approved:${draft.id}`}
                  variant="ghost"
                  className="min-h-9 px-4"
                >
                  <Check className="size-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => updateStatus(draft.id, "rejected")}
                  disabled={busy === `rejected:${draft.id}`}
                  variant="ghost"
                  className="min-h-9 px-4 text-danger hover:border-danger hover:bg-danger/10"
                >
                  <X className="size-4" />
                  Reject
                </Button>
                <Link
                  href={`/content/${draft.id}`}
                  className="text-sm text-accent hover:underline"
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatLabel(format: DraftFormat) {
  return createFormats.find((item) => item.value === format)?.label ?? format;
}
