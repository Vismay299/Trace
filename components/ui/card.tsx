import * as React from "react";
import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
};

export function Card({ className, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-bg-elev/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        glow &&
          "shadow-[0_0_80px_rgba(61,220,151,0.14),inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
