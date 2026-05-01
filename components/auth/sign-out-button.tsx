"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  className?: string;
  size?: "md" | "lg";
};

export function SignOutButton({ className, size = "md" }: SignOutButtonProps) {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={className}
      disabled={busy}
      trailing={<LogOut aria-hidden className="size-4" />}
      onClick={async () => {
        setBusy(true);
        await signOut({ callbackUrl: "/login" });
      }}
    >
      {busy ? "Signing out..." : "Sign out"}
    </Button>
  );
}
