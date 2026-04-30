import { X } from "lucide-react";
import { Card } from "@/components/ui/card";

const banned = [
  "Hot take:",
  "In today's fast-paced world",
  "As someone who",
  "Keep building",
  "I am thrilled to announce",
];

export function AntiSlopList() {
  return (
    <Card className="p-7">
      <p className="font-mono text-xs uppercase text-text-dim">Refusal list</p>
      <div className="mt-6 space-y-4">
        {banned.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-4 py-4"
          >
            <X aria-hidden className="size-5 text-danger" />
            <span className="text-lg text-text-dim line-through decoration-danger decoration-2">
              {item}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
