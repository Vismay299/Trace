"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

export function LiveTranscript({
  transcript,
  interimTranscript,
  isListening,
  onChange,
  placeholder,
  className,
}: {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  onChange: (s: string) => void;
  placeholder?: string;
  className?: string;
}) {
  // We render the editable textarea against the final transcript only —
  // interim text appears as an overlay so the user can still edit cleanly.
  return (
    <div className={cn("relative", className)}>
      <Textarea
        rows={5}
        value={transcript}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          placeholder ?? "Tap the mic and start talking. We'll transcribe live."
        }
        className="min-h-[7rem]"
      />
      {isListening && interimTranscript && (
        <div className="pointer-events-none mt-2 text-sm italic text-text-dim">
          {interimTranscript}
        </div>
      )}
      {isListening && (
        <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent">
          <span
            className="size-2 animate-pulse rounded-full bg-accent"
            aria-hidden
          />
          Listening — pauses for 2.5s auto-stop
        </div>
      )}
    </div>
  );
}
