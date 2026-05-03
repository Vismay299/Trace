"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_LINKS, NAV_LINKS } from "@/content/copy";
import { cn } from "@/lib/cn";

type NavLinksProps = {
  mobile?: boolean;
  authenticated?: boolean;
  onNavigate?: () => void;
};

export function NavLinks({
  mobile = false,
  authenticated = false,
  onNavigate,
}: NavLinksProps) {
  const pathname = usePathname();
  const links = authenticated ? APP_NAV_LINKS : NAV_LINKS;

  return (
    <nav
      aria-label={authenticated ? "App" : "Primary"}
      className={cn(
        mobile
          ? "flex flex-col gap-5 text-3xl"
          : authenticated
            ? "hidden items-center gap-5 text-xs xl:flex"
            : "hidden items-center gap-10 md:flex",
        "font-mono uppercase text-text-dim",
      )}
    >
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));

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
