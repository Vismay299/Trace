"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { VoiceFeedbackButtons } from "@/components/voice/feedback-buttons";
import { cn } from "@/lib/cn";

type VoiceFeedbackValue =
  | "sounds_like_me"
  | "doesnt_sound_like_me"
  | "close_but_edited";

export type ContentRow = {
  id: string;
  format: "linkedin" | "instagram" | "x_thread" | "substack";
  hookVariant: number;
  content: string;
  editedContent: string | null;
  contentMetadata: {
    hooks?: string[];
    tweets?: { index: number; text: string }[];
    slides?: { index: number; text: string; design_note?: string }[];
    title?: string;
    subtitle?: string;
    caption?: string;
  } | null;
  sourceCitation: string | null;
  status: string;
  slopReviewNeeded: boolean;
  voiceFeedback: string | null;
  storySeedId: string | null;
};

export function ContentEditor({
  initial,
  siblings,
}: {
  initial: ContentRow;
  siblings: ContentRow[];
}) {
  const router = useRouter();
  const [active, setActive] = useState(initial);
  const [edited, setEdited] = useState(active.editedContent ?? active.content);
  const [hookIndex, setHookIndex] = useState(active.hookVariant - 1);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenGuidance, setRegenGuidance] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);

  // Sync editor state when switching tabs.
  useEffect(() => {
    setEdited(active.editedContent ?? active.content);
    setHookIndex(active.hookVariant - 1);
  }, [active]);

  const hooks = active.contentMetadata?.hooks ?? [];
  const isPickable = hooks.length > 0;

  const formatTabs: ContentRow["format"][] = [
    "linkedin",
    "instagram",
    "x_thread",
    "substack",
  ];
  const byFormat = useMemo(() => {
    const m = new Map<ContentRow["format"], ContentRow>();
    for (const r of [active, ...siblings]) {
      if (!m.has(r.format)) m.set(r.format, r);
    }
    return m;
  }, [active, siblings]);

  const swap = (f: ContentRow["format"]) => {
    const r = byFormat.get(f);
    if (r) setActive(r);
  };

  const persist = async (patch: Record<string, unknown>) => {
    const res = await fetch(`/api/content/${active.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setActive(data.content);
    }
  };

  const saveEdit = async () => {
    setSavingStatus("Saving…");
    await persist({ editedContent: edited });
    setSavingStatus("Saved");
    setTimeout(() => setSavingStatus(null), 1200);
  };

  const setStatus = async (status: ContentRow["status"]) => {
    setSavingStatus("Saving…");
    await persist({ status });
    setSavingStatus(null);
  };

  const pickHook = async (i: number) => {
    setHookIndex(i);
    await persist({ hookVariant: i + 1 });
    // Replace the hook line in editor view.
    if (active.format === "linkedin" && hooks[i]) {
      const lines = edited.split("\n\n");
      lines[0] = hooks[i];
      setEdited(lines.join("\n\n"));
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(edited);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const regenerate = async () => {
    setRegenBusy(true);
    try {
      const res = await fetch(`/api/content/${active.id}/regenerate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guidance: regenGuidance }),
      });
      if (res.ok) {
        const data = await res.json();
        setActive(data.content);
        setRegenOpen(false);
        setRegenGuidance("");
      }
    } finally {
      setRegenBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this generation? It will be gone for good.")) return;
    await fetch(`/api/content/${active.id}`, { method: "DELETE" });
    router.push("/content");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {active.slopReviewNeeded && (
        <div className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          Heads up: this draft tripped the anti-slop check after 3 retries.
          Review it carefully before approving — or click Regenerate with
          guidance.
        </div>
      )}

      {/* Format tabs */}
      <div className="flex flex-wrap gap-2">
        {formatTabs.map((f) => {
          const r = byFormat.get(f);
          if (!r) return null;
          return (
            <button
              key={f}
              type="button"
              onClick={() => swap(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition",
                active.format === f
                  ? "border-accent bg-accent text-black"
                  : "border-border-strong text-text-muted hover:border-accent",
              )}
            >
              {labelFor(f)}
            </button>
          );
        })}
      </div>

      {/* Hook picker */}
      {isPickable && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
            Hook variants
          </p>
          <div className="grid gap-2">
            {hooks.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickHook(i)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left text-sm transition",
                  hookIndex === i
                    ? "border-accent bg-accent-soft text-text"
                    : "border-border-strong bg-bg-elev text-text-muted hover:border-accent",
                )}
              >
                <span className="text-xs uppercase tracking-[0.18em] text-text-dim">
                  Hook {i + 1}
                </span>
                <p className="mt-1">{h}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Body editor */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          Edit
        </p>
        <Textarea
          rows={Math.min(28, Math.max(10, edited.split("\n").length + 2))}
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          className="font-sans"
        />
      </section>

      {active.sourceCitation && (
        <p className="text-xs italic text-text-dim">{active.sourceCitation}</p>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={saveEdit}>Save edits</Button>
        {active.status !== "approved" ? (
          <Button onClick={() => setStatus("approved")} variant="ghost">
            Approve
          </Button>
        ) : (
          <Button onClick={() => setStatus("draft")} variant="ghost">
            Unapprove
          </Button>
        )}
        <Button onClick={() => setStatus("rejected")} variant="ghost">
          Reject
        </Button>
        <Button onClick={copy} variant="ghost">
          {copied ? (
            <>
              <Check className="mr-2 size-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 size-4" /> Copy
            </>
          )}
        </Button>
        <Button onClick={() => setRegenOpen((v) => !v)} variant="ghost">
          <RefreshCw className="mr-2 size-4" /> Regenerate
        </Button>
        <Button onClick={remove} variant="link" className="ml-auto text-danger">
          <Trash2 className="mr-2 size-4" /> Delete
        </Button>
        {savingStatus && (
          <span className="text-xs text-text-dim">{savingStatus}</span>
        )}
      </div>

      {regenOpen && (
        <div className="space-y-3 rounded-card border border-border-strong bg-bg-elev p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
            Regenerate with guidance (optional)
          </p>
          <Input
            placeholder="e.g. 'Make it shorter, lead with the latency number.'"
            value={regenGuidance}
            onChange={(e) => setRegenGuidance(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={regenerate} disabled={regenBusy}>
              {regenBusy ? "Regenerating…" : "Regenerate"}
            </Button>
            <Button variant="ghost" onClick={() => setRegenOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Voice feedback */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          Sound like you?
        </p>
        <VoiceFeedbackButtons
          contentId={active.id}
          current={
            isVoiceFeedbackValue(active.voiceFeedback)
              ? active.voiceFeedback
              : undefined
          }
        />
      </section>
    </div>
  );
}

function isVoiceFeedbackValue(
  value: string | null,
): value is VoiceFeedbackValue {
  return (
    value === "sounds_like_me" ||
    value === "doesnt_sound_like_me" ||
    value === "close_but_edited"
  );
}

function labelFor(f: ContentRow["format"]) {
  return f === "linkedin"
    ? "LinkedIn"
    : f === "instagram"
      ? "Instagram"
      : f === "x_thread"
        ? "X thread"
        : "Substack";
}
