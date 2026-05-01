"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BillingActionButton({
  action,
  children,
  className,
}: {
  action: "checkout" | "portal";
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const res = await fetch(
      action === "checkout" ? "/api/stripe/checkout" : "/api/stripe/portal",
      { method: "POST" },
    );
    if (res.status === 401) {
      router.push("/signup?plan=pro");
      return;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) {
      setError(data?.error ?? "Billing is unavailable right now.");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className={className}>
      <Button onClick={run} disabled={loading} className="w-full">
        {loading ? "Opening..." : children}
      </Button>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
