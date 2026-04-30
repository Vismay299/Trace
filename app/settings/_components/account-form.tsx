"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not save account.");
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm text-text-muted">
        Name
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2"
        />
      </label>
      <label className="block text-sm text-text-muted">
        Email
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2"
        />
      </label>
      {message && <p className="text-sm text-text-muted">{message}</p>}
      <Button onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save profile"}
      </Button>
    </div>
  );
}
