"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/site/nav-links";
import { Logo } from "@/components/site/logo";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-full border border-border-strong text-text transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-bg px-5 py-5">
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
            <NavLinks mobile onNavigate={() => setOpen(false)} />
          </div>

          <div className="mt-12 space-y-3">
            <Button href="/signup" size="lg" className="w-full">
              Create account
            </Button>
            <Button href="/login" size="lg" variant="ghost" className="w-full">
              Sign in
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
