import { cn } from "@/lib/cn";

type NumberedProps = {
  value: string;
  className?: string;
};

export function Numbered({ value, className }: NumberedProps) {
  return (
    <span
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border border-border-strong bg-bg font-mono text-sm text-accent",
        className,
      )}
    >
      {value}
    </span>
  );
}
