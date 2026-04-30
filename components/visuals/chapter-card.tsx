import { Pill } from "@/components/ui/pill";
import { Numbered } from "@/components/ui/numbered";
import { Card } from "@/components/ui/card";

const chapters = [
  { number: "01", label: "A decision" },
  { number: "02", label: "A sharp lesson" },
  { number: "03", label: "A post with proof" },
];

export function ChapterCard() {
  return (
    <Card glow className="relative min-h-[25rem] overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden
        className="absolute left-[-6rem] top-1/2 h-px w-[140%] -rotate-6 bg-gradient-to-r from-transparent via-accent/25 to-transparent"
      />
      <div className="relative z-10 flex items-center justify-between border-b border-border-strong pb-6">
        <p className="font-mono text-sm uppercase text-text-dim">
          TRACE / SOURCE
        </p>
        <Pill>Voice 82%</Pill>
      </div>

      <div className="relative z-10 mt-8 space-y-8">
        {chapters.map((chapter) => (
          <div
            key={chapter.number}
            className="grid grid-cols-[3.25rem_1fr] items-center gap-5"
          >
            <Numbered value={chapter.number} />
            <div>
              <p className="font-mono text-xs uppercase text-text-dim">
                Chapter
              </p>
              <p className="mt-2 text-2xl font-medium leading-tight text-text sm:text-3xl">
                {chapter.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
