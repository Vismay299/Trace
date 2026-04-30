import * as React from "react";
import { cn } from "@/lib/cn";

type EyebrowProps = React.HTMLAttributes<HTMLParagraphElement> & {
  muted?: boolean;
};

export function Eyebrow({
  className,
  muted = false,
  children,
  ...props
}: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-xs uppercase leading-none",
        muted ? "text-text-dim" : "text-accent",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      <span>{children}</span>
    </p>
  );
}
