"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/content/copy";
import { cn } from "@/lib/cn";

type NavLinksProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function NavLinks({ mobile = false, onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        mobile
          ? "flex flex-col gap-6 text-3xl"
          : "hidden items-center gap-10 md:flex",
        "font-mono uppercase text-text-dim",
      )}
    >
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative transition hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
              active && "text-text",
            )}
          >
            {link.label}
            <span
              aria-hidden
              className={cn(
                "absolute left-1/2 top-[calc(100%+0.45rem)] size-1 -translate-x-1/2 rounded-full bg-accent transition",
                active ? "opacity-100" : "opacity-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
