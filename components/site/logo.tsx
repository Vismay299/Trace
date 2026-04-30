import Link from "next/link";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3", className)}
      aria-label="Trace home"
    >
      <span className="flex size-10 items-center justify-center rounded-full border border-border-strong bg-bg-elev text-sm font-medium text-text transition group-hover:border-accent group-hover:text-accent">
        T
      </span>
      <span className="font-mono text-sm uppercase text-text">TRACE</span>
    </Link>
  );
}
