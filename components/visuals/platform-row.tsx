import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";

const platforms = ["LinkedIn", "Instagram", "X thread", "Substack"];

type PlatformRowProps = {
  compact?: boolean;
  className?: string;
};

export function PlatformRows({ compact = false, className }: PlatformRowProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {platforms.map((platform) => (
        <div
          key={platform}
          className={cn(
            "flex items-center justify-between rounded-full border border-border-strong bg-bg-elev px-6 text-text transition duration-200 hover:-translate-y-0.5 hover:border-accent/70",
            compact ? "min-h-16" : "min-h-20 sm:min-h-24",
          )}
        >
          <span
            className={cn(
              "font-medium",
              compact ? "text-xl" : "text-2xl sm:text-3xl",
            )}
          >
            {platform}
          </span>
          <FileText aria-hidden className="size-6 text-text-dim" />
        </div>
      ))}
    </div>
  );
}
