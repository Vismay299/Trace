"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type InputMode = "voice" | "text";

const STORAGE_KEY = "trace.input_mode";

export function useInputMode(defaultMode: InputMode = "voice") {
  const [mode, setMode] = useState<InputMode>(defaultMode);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "voice" || stored === "text") setMode(stored);
  }, []);
  const update = (m: InputMode) => {
    setMode(m);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, m);
  };
  return [mode, update] as const;
}

export function ModeToggle({
  mode,
  onChange,
  voiceSupported,
}: {
  mode: InputMode;
  onChange: (m: InputMode) => void;
  voiceSupported: boolean;
}) {
  return (
    <div className="inline-flex rounded-full border border-border-strong bg-bg-elev p-1 text-xs uppercase tracking-[0.18em]">
      <button
        type="button"
        onClick={() => voiceSupported && onChange("voice")}
        disabled={!voiceSupported}
        className={cn(
          "rounded-full px-4 py-1.5 transition",
          mode === "voice" ? "bg-accent text-black" : "text-text-muted hover:text-text",
          !voiceSupported && "opacity-50 cursor-not-allowed",
        )}
      >
        Voice
      </button>
      <button
        type="button"
        onClick={() => onChange("text")}
        className={cn(
          "rounded-full px-4 py-1.5 transition",
          mode === "text" ? "bg-accent text-black" : "text-text-muted hover:text-text",
        )}
      >
        Text
      </button>
    </div>
  );
}

export function UnsupportedBrowserBanner() {
  return (
    <div className="rounded-2xl border border-border-strong bg-bg-elev px-4 py-3 text-sm text-text-muted">
      Voice input isn't supported in this browser. We'll use text mode here —
      try Chrome or Safari for voice. Spec §F14 fallback.
    </div>
  );
}
