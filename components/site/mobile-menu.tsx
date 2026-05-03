"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NavLinks } from "@/components/site/nav-links";
import { Logo } from "@/components/site/logo";

export function MobileMenu({ user }: { user?: { name?: string | null; email?: string | null } | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const authed = Boolean(user);
  const wrapperHidden = authed ? "xl:hidden" : "md:hidden";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawer = open ? (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-bg px-5 py-5 ${wrapperHidden}`}>
      <div className="flex items-center justify-between">
        <Logo />
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
          className="inline-flex size-11 items-center justify-center rounded-full border border-border-strong text-text transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <div className="mt-20">
        <NavLinks
          mobile
          authenticated={authed}
          onNavigate={() => setOpen(false)}
        />
      </div>

      <div className="mt-12 space-y-3">
        {user ? (
          <>
            <Button href="/settings" size="lg" className="w-full">
              {user.name || user.email || "Account"}
            </Button>
            <SignOutButton size="lg" className="w-full" />
          </>
        ) : (
          <>
            <Button href="/signup" size="lg" className="w-full">
              Create account
            </Button>
            <Button href="/login" size="lg" variant="ghost" className="w-full">
              Sign in
            </Button>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={wrapperHidden}>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-full border border-border-strong text-text transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Menu aria-hidden className="size-5" />
      </button>
      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </div>
  );
}
