"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Pencil } from "lucide-react";
import { cn } from "@/lib/cn";

type Feedback = "sounds_like_me" | "doesnt_sound_like_me" | "close_but_edited";

export function VoiceFeedbackButtons({
  contentId,
  current,
  onSaved,
}: {
  contentId: string;
  current?: Feedback | null;
  onSaved?: (f: Feedback) => void;
}) {
  const [active, setActive] = useState<Feedback | null>(current ?? null);
  const [busy, setBusy] = useState<Feedback | null>(null);

  const submit = async (feedback: Feedback) => {
    setBusy(feedback);
    try {
      const res = await fetch("/api/voice/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ generatedContentId: contentId, feedback }),
      });
      if (res.ok) {
        setActive(feedback);
        onSaved?.(feedback);
      }
    } finally {
      setBusy(null);
    }
  };

  const tabs: { f: Feedback; label: string; Icon: typeof ThumbsUp }[] = [
    { f: "sounds_like_me", label: "Sounds like me", Icon: ThumbsUp },
    { f: "close_but_edited", label: "Close — I edited it", Icon: Pencil },
    { f: "doesnt_sound_like_me", label: "Doesn't sound like me", Icon: ThumbsDown },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(({ f, label, Icon }) => (
        <button
          key={f}
          type="button"
          onClick={() => submit(f)}
          disabled={busy === f}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition",
            active === f
              ? "border-accent bg-accent text-black"
              : "border-border-strong text-text-muted hover:border-accent",
            busy === f && "opacity-60",
          )}
        >
          <Icon className="size-3.5" aria-hidden /> {label}
        </button>
      ))}
    </div>
  );
}
