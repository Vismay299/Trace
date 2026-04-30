"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export type UploadRow = {
  id: string;
  filename: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  processingStatus: string;
  processingError: string | null;
  chunkCount: number;
  createdAt: string;
};

export function FileList({ rows }: { rows: UploadRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!rows.length) {
    return (
      <p className="rounded-card border border-border-strong bg-bg-elev p-6 text-center text-text-muted">
        No files yet. Drop in a PDF of an old retro, a DOCX with notes, a
        markdown export — anything that captures real work you've done.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-4 rounded-card border border-border-strong bg-bg-elev px-4 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="size-5 text-text-muted shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm text-text">{r.filename}</p>
              <p className="text-xs text-text-dim">
                {(r.fileSizeBytes ?? 0) > 0
                  ? `${Math.round((r.fileSizeBytes ?? 0) / 1024)} KB · `
                  : ""}
                {r.chunkCount} chunks · {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={r.processingStatus} error={r.processingError} />
            <button
              type="button"
              disabled={deletingId === r.id}
              onClick={async () => {
                if (!confirm(`Delete "${r.filename}" and its chunks?`)) return;
                setDeletingId(r.id);
                await fetch(`/api/uploads/${r.id}`, { method: "DELETE" });
                router.refresh();
              }}
              className="text-text-dim hover:text-danger"
              aria-label={`Delete ${r.filename}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: string;
  error: string | null;
}) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-accent">
        <CheckCircle2 className="size-3.5" aria-hidden /> ready
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-danger"
        title={error ?? undefined}
      >
        <AlertTriangle className="size-3.5" aria-hidden /> failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-dim">
      <Loader2 className="size-3.5 animate-spin" aria-hidden /> processing
    </span>
  );
}
