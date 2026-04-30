import * as React from "react";
import { cn } from "@/lib/cn";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-text-muted",
        className,
      )}
      {...props}
    />
  );
});
