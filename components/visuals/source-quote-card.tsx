import { GitBranch } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SourceQuoteCard() {
  return (
    <Card glow className="p-7 sm:p-9">
      <div className="flex items-center gap-3">
        <GitBranch aria-hidden className="size-6 text-accent" />
        <p className="font-mono text-sm uppercase text-text-dim">Source</p>
      </div>

      <blockquote className="mt-12 text-4xl font-normal leading-tight text-text sm:text-5xl">
        &quot;I spent 3 hours debugging OAuth. The fix was one trailing
        slash.&quot;
      </blockquote>

      <p className="mt-12 font-mono text-sm leading-6 text-accent">
        Based on commit to auth-service, March 15, 2026
      </p>
    </Card>
  );
}
