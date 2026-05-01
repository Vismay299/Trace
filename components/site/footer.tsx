import Link from "next/link";
import { Feather } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { NAV_LINKS } from "@/content/copy";

const legalLinks = [
  { href: "/waitlist", label: "Waitlist" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/data-use", label: "Data use" },
  { href: "mailto:hello@trace.app", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-5 py-14 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-6 text-text-muted">
            Trace turns proof of work into proof people can read.
          </p>
          <Feather aria-hidden className="mt-7 size-7 text-text-dim" />
        </div>

        <div>
          <p className="font-mono text-xs uppercase text-text-dim">Product</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-text"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase text-text-dim">Company</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-text"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-3 border-t border-border pt-6 font-mono text-xs uppercase text-text-dim sm:flex-row">
        <p>Copyright 2026 Trace.</p>
        <p>Built by Vismay Rathod.</p>
      </div>
    </footer>
  );
}
