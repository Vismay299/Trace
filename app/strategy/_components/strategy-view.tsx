"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StrategySection } from "./strategy-section";
import type { StrategyDoc } from "@/lib/db/schema";

type SamplePost = {
  id: string;
  format: "linkedin" | "instagram" | "x_thread" | "substack";
  content: string;
  contentMetadata?: { title?: string; sample_origin?: string };
  sourceCitation: string | null;
};

export function StrategyView({
  initialDoc,
  initialSamples,
  showFirstRunBanner,
}: {
  initialDoc: StrategyDoc;
  initialSamples: SamplePost[];
  showFirstRunBanner: boolean;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<StrategyDoc>(initialDoc);
  const [samples] = useState<SamplePost[]>(initialSamples);

  const updatePatch = async (patch: Record<string, unknown>) => {
    const res = await fetch("/api/strategy", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setDoc(data.strategy);
    }
  };
  const updateField = async (field: keyof StrategyDoc, value: unknown) => {
    await updatePatch({ [field]: value });
  };
  const regenerateSection = async (section: string) => {
    const res = await fetch("/api/strategy/regenerate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ section }),
    });
    if (res.ok) {
      const data = await res.json();
      setDoc(data.strategy);
    }
  };

  return (
    <div className="space-y-8">
      {showFirstRunBanner && (
        <div className="rounded-card border border-accent/30 bg-accent-soft px-6 py-4 text-sm text-text">
          Here's your Personal Brand Strategy. Read it. Edit anything that
          doesn't sound like you. Then scroll down to see the first 5 sample
          posts we wrote in your voice — no source data required.
        </div>
      )}

      <header className="space-y-3">
        <h1 className="text-4xl font-medium tracking-tight text-text">
          Your Brand Strategy
        </h1>
        <p className="text-text-muted">
          Generated from your interview answers. Updated{" "}
          {new Date(doc.updatedAt).toLocaleDateString()}. Version {doc.version}.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/strategy/pdf" variant="ghost">
            Download as PDF
          </Button>
          <Button href="/sources">Connect a source →</Button>
        </div>
      </header>

      <StrategySection
        title="Positioning Statement"
        editable
        initialValue={doc.positioningStatement ?? ""}
        onSave={(v) => updateField("positioningStatement", v)}
        onRegenerate={() => regenerateSection("positioningStatement")}
      >
        <p className="text-lg">{doc.positioningStatement}</p>
      </StrategySection>

      <StrategySection
        title="Content Pillars"
        editable
        initialValue={stringifyJson({
          pillar1Topic: doc.pillar1Topic,
          pillar1Description: doc.pillar1Description,
          pillar2Topic: doc.pillar2Topic,
          pillar2Description: doc.pillar2Description,
          pillar3Topic: doc.pillar3Topic,
          pillar3Description: doc.pillar3Description,
        })}
        onSave={(v) => updatePatch(parseObject(v))}
      >
        <ul className="space-y-4">
          {[1, 2, 3].map((i) => {
            const topic = doc[`pillar${i}Topic` as keyof StrategyDoc] as
              | string
              | null;
            const desc = doc[`pillar${i}Description` as keyof StrategyDoc] as
              | string
              | null;
            return (
              <li key={i}>
                <p className="font-medium text-text">
                  {i}. {topic}
                </p>
                <p className="text-text-muted">{desc}</p>
              </li>
            );
          })}
        </ul>
      </StrategySection>

      <StrategySection
        title="Contrarian Takes"
        editable
        initialValue={stringifyJson(doc.contrarianTakes ?? [])}
        onSave={(v) => updateField("contrarianTakes", parseJson(v))}
        onRegenerate={() => regenerateSection("contrarianTakes")}
      >
        <ul className="list-disc space-y-2 pl-5">
          {(doc.contrarianTakes ?? []).map((t, i) => (
            <li key={i} className="text-text">
              {t}
            </li>
          ))}
        </ul>
      </StrategySection>

      <StrategySection
        title="Origin Story"
        editable
        initialValue={stringifyJson(doc.originStory ?? {})}
        onSave={(v) => updateField("originStory", parseObject(v))}
        onRegenerate={() => regenerateSection("originStory")}
      >
        <ol className="space-y-2">
          {([1, 2, 3, 4, 5] as const).map((i) => {
            const beat = doc.originStory?.[`beat${i}` as `beat1`];
            return beat ? (
              <li key={i} className="text-text">
                <span className="text-text-dim">Beat {i}:</span> {beat}
              </li>
            ) : null;
          })}
        </ol>
      </StrategySection>

      <StrategySection
        title="Target Audience"
        editable
        initialValue={stringifyJson(doc.targetAudience ?? {})}
        onSave={(v) => updateField("targetAudience", parseObject(v))}
        onRegenerate={() => regenerateSection("targetAudience")}
      >
        <dl className="grid gap-2 text-text">
          {Object.entries(doc.targetAudience ?? {}).map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3">
              <dt className="text-text-dim capitalize">
                {k.replaceAll("_", " ")}
              </dt>
              <dd className="col-span-2">
                {Array.isArray(v) ? v.join(", ") : String(v ?? "")}
              </dd>
            </div>
          ))}
        </dl>
      </StrategySection>

      <StrategySection
        title="Outcome Goal"
        editable
        initialValue={stringifyJson(doc.outcomeGoal ?? {})}
        onSave={(v) => updateField("outcomeGoal", parseObject(v))}
        onRegenerate={() => regenerateSection("outcomeGoal")}
      >
        <dl className="grid gap-2 text-text">
          {Object.entries(doc.outcomeGoal ?? {}).map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3">
              <dt className="text-text-dim capitalize">
                {k.replaceAll("_", " ")}
              </dt>
              <dd className="col-span-2">{String(v ?? "")}</dd>
            </div>
          ))}
        </dl>
      </StrategySection>

      <StrategySection
        title="Voice Profile"
        editable
        initialValue={stringifyJson(doc.voiceProfile ?? {})}
        onSave={(v) => updateField("voiceProfile", parseObject(v))}
        onRegenerate={() => regenerateSection("voiceProfile")}
      >
        <dl className="grid gap-2 text-text">
          {Object.entries(doc.voiceProfile ?? {}).map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3">
              <dt className="text-text-dim capitalize">
                {k.replaceAll("_", " ")}
              </dt>
              <dd className="col-span-2">
                {Array.isArray(v) ? v.join(", ") : String(v ?? "")}
              </dd>
            </div>
          ))}
        </dl>
      </StrategySection>

      <StrategySection
        title="Posting Cadence"
        editable
        initialValue={stringifyJson(doc.postingCadence ?? {})}
        onSave={(v) => updateField("postingCadence", parseObject(v))}
        onRegenerate={() => regenerateSection("postingCadence")}
      >
        <ul className="space-y-1 text-text">
          {Object.entries(doc.postingCadence ?? {}).map(([k, v]) => (
            <li key={k}>
              <span className="text-text-dim">{k.replaceAll("_", " ")}:</span>{" "}
              {String(v ?? "—")}
            </li>
          ))}
        </ul>
      </StrategySection>

      {samples.length > 0 && (
        <section className="space-y-4">
          <header>
            <h2 className="text-2xl font-medium tracking-tight text-text">
              What your content could look like
            </h2>
            <p className="text-text-muted">
              5 sample posts derived from your interview answers — no source
              data yet. When you connect GitHub or upload files, every post will
              cite a real artifact.
            </p>
          </header>
          <div className="grid gap-4 lg:grid-cols-2">
            {samples.map((s) => (
              <article
                key={s.id}
                className="rounded-card border border-border-strong bg-bg-elev p-5"
              >
                <header className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-text-dim">
                  <span>{formatLabel(s.format)}</span>
                  <span>{s.contentMetadata?.title ?? ""}</span>
                </header>
                <pre className="whitespace-pre-wrap font-sans text-sm text-text">
                  {s.content}
                </pre>
                {s.sourceCitation && (
                  <p className="mt-4 text-xs text-text-dim italic">
                    {s.sourceCitation}
                  </p>
                )}
                <div className="mt-4">
                  <Button
                    variant="link"
                    onClick={() => router.push(`/content/${s.id}`)}
                  >
                    Open in editor
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseJson(value: string): unknown {
  return JSON.parse(value);
}

function parseObject(value: string): Record<string, unknown> {
  const parsed = parseJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function formatLabel(f: string) {
  switch (f) {
    case "linkedin":
      return "LinkedIn";
    case "instagram":
      return "Instagram carousel";
    case "x_thread":
      return "X thread";
    case "substack":
      return "Substack";
    default:
      return f;
  }
}
