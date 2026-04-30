"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteAccountButton({ email }: { email: string }) {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not delete account.");
      await signOut({ callbackUrl: "/signup" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete account.",
      );
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        This permanently deletes your account, Strategy Doc, sources, story
        seeds, generated content, voice samples, plans, usage logs, and budgets.
      </p>
      <label className="block text-sm text-text-muted">
        Type {email} to confirm
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-2"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button
        onClick={remove}
        disabled={busy || confirm !== email}
        variant="ghost"
        className="border-danger/40 text-danger hover:border-danger"
      >
        {busy ? "Deleting..." : "Delete account"}
      </Button>
    </div>
  );
}
