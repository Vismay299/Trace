import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { Numbered } from "@/components/ui/numbered";
import { Pill } from "@/components/ui/pill";

export default function KitPage() {
  return (
    <div className="px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        <div>
          <Eyebrow>Dev kit</Eyebrow>
          <h1 className="mt-6 text-5xl font-bold text-text">
            Trace component kit
          </h1>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-medium text-text">Buttons</h2>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button trailing={<ArrowRight aria-hidden className="size-4" />}>
              Primary
            </Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link button</Button>
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-medium text-text">Small primitives</h2>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Pill>Voice 82%</Pill>
            <Pill variant="accent">Best fit</Pill>
            <Numbered value="01" />
            <IconButton label="Document">
              <FileText aria-hidden className="size-5" />
            </IconButton>
          </div>
        </Card>

        <Card glow className="p-8">
          <Eyebrow>Card</Eyebrow>
          <h2 className="mt-5 text-3xl font-medium text-text">Glow card</h2>
          <p className="mt-4 max-w-xl leading-7">
            This page is intentionally unlinked and exists to check primitives
            during QA.
          </p>
        </Card>
      </div>
    </div>
  );
}
