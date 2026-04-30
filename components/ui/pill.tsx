import * as React from "react";
import { cn } from "@/lib/cn";

type PillProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "accent" | "mono";
};

export function Pill({ className, variant = "mono", ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs uppercase leading-none",
        variant === "accent"
          ? "border-accent/70 bg-accent-soft text-accent"
          : "border-border-strong bg-transparent text-text-dim",
        className,
      )}
      {...props}
    />
  );
}
