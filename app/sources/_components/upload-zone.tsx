"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { cn } from "@/lib/cn";

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceKind, setSourceKind] = useState<"auto" | "ai_coding_log">(
    "auto",
  );

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("sourceKind", sourceKind);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Upload failed.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSourceKind("auto")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em]",
            sourceKind === "auto"
              ? "border-accent bg-accent text-black"
              : "border-border-strong text-text-muted",
          )}
        >
          Auto-detect
        </button>
        <button
          type="button"
          onClick={() => setSourceKind("ai_coding_log")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em]",
            sourceKind === "ai_coding_log"
              ? "border-accent bg-accent text-black"
              : "border-border-strong text-text-muted",
          )}
        >
          Coding transcript
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.csv,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await upload(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) await upload(f);
        }}
        disabled={busy}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-12 transition",
          dragOver
            ? "border-accent bg-accent-soft"
            : "border-border-strong hover:border-accent",
          busy && "opacity-60 cursor-not-allowed",
        )}
      >
        <Upload className="size-8 text-text-muted" aria-hidden />
        <p className="font-medium text-text">
          {busy ? "Uploading & parsing…" : "Drop a file or click to upload"}
        </p>
        <p className="text-xs text-text-dim">
          PDF, DOCX, TXT, MD, CSV, JSON · up to 12 MB · max 10 files per user
        </p>
      </button>
      {error && (
        <p className="mt-3 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
