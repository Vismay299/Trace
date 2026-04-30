"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function StrategySection({
  title,
  children,
  editable,
  initialValue,
  onSave,
  onRegenerate,
}: {
  title: string;
  children: React.ReactNode;
  editable?: boolean;
  initialValue?: string;
  onSave?: (value: string) => Promise<void>;
  onRegenerate?: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <section className="rounded-card border border-border-strong bg-bg-elev p-6">
      <header className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          {title}
        </h3>
        {(editable || onRegenerate) && !editing && (
          <div className="flex gap-3">
            {editable && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-accent hover:underline"
              >
                Edit
              </button>
            )}
            {onRegenerate && (
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="text-xs text-accent hover:underline disabled:opacity-60"
              >
                {regenerating ? "Regenerating..." : "Regenerate"}
              </button>
            )}
          </div>
        )}
      </header>
      {editing ? (
        <div className="space-y-3">
          <Textarea
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setValue(initialValue ?? "");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose prose-invert text-text">{children}</div>
      )}
    </section>
  );
}
