"use client";

import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function MicButton({
  isListening,
  onToggle,
  disabled,
  className,
}: {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={isListening ? "Stop recording" : "Start recording"}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border transition",
        "size-14",
        isListening
          ? "border-accent bg-accent text-black hover:bg-accent/90"
          : "border-border-strong bg-bg-elev text-text hover:border-accent",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {isListening ? (
        <>
          <Loader2
            className="absolute size-14 animate-spin opacity-30"
            aria-hidden
          />
          <MicOff className="size-5" aria-hidden />
        </>
      ) : (
        <Mic className="size-5" aria-hidden />
      )}
    </button>
  );
}
