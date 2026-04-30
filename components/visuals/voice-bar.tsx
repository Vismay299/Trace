import { Mic2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function VoiceBar() {
  return (
    <Card className="p-7">
      <div className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full border border-accent/70 bg-accent-soft text-accent">
          <Mic2 aria-hidden className="size-6" />
        </span>
        <div>
          <p className="font-mono text-xs uppercase text-accent">Listening</p>
          <p className="mt-2 text-xl font-medium text-text">
            What changed in your product this week?
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-bg p-5">
        <p className="text-lg leading-8 text-text">
          We rewrote onboarding after three beta users missed the first action.
          The fix was not shorter copy. It was better sequencing.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span className="size-2 rounded-full bg-accent" />
        <span className="h-1.5 flex-1 rounded-full bg-accent/40" />
        <span className="h-1.5 flex-[0.7] rounded-full bg-text/10" />
        <span className="h-1.5 flex-[0.4] rounded-full bg-text/10" />
      </div>
    </Card>
  );
}
