import { redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { sourceChunks, storySeeds, strategyDocs } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { ExtractTrigger } from "./_components/extract-trigger";
import { StoryCard } from "./_components/story-card";
import { StoryFilters } from "./_components/filters";

export const metadata = { title: "Content Mine" };

export default async function MinePage({
  searchParams,
}: {
  searchParams: Promise<{ pillar?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/mine");

  const params = await searchParams;
  const pillar = params.pillar;

  const [doc] = await db
    .select()
    .from(strategyDocs)
    .where(eq(strategyDocs.userId, userId))
    .limit(1);

  if (!doc) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Strategy first.
        </h1>
        <p className="mt-3 text-text-muted">
          We need your Strategy Doc before mining sources for stories.
        </p>
        <div className="mt-6">
          <Button href="/onboarding">Start the interview →</Button>
        </div>
      </section>
    );
  }

  const conditions = [eq(storySeeds.userId, userId)];
  if (pillar) conditions.push(eq(storySeeds.pillarMatch, pillar));

  const seeds = await db
    .select()
    .from(storySeeds)
    .where(and(...conditions))
    .orderBy(desc(storySeeds.relevanceScore), desc(storySeeds.createdAt));

  // Count chunks not yet associated with a seed.
  const [{ pending }] = await db
    .select({
      pending: sql<number>`COUNT(*) FILTER (WHERE ${sourceChunks.id} NOT IN (SELECT COALESCE(${storySeeds.sourceChunkId}, '00000000-0000-0000-0000-000000000000'::uuid) FROM story_seeds WHERE story_seeds.user_id = ${userId}))::int`,
    })
    .from(sourceChunks)
    .where(eq(sourceChunks.userId, userId));

  const pillars = [
    doc.pillar1Topic,
    doc.pillar2Topic,
    doc.pillar3Topic,
    "unmapped",
  ].filter((p): p is string => Boolean(p));

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-text">
            Content Mine
          </h1>
          <p className="mt-2 text-text-muted">
            Source-backed story seeds from uploads and connected accounts. Your
            interview creates Strategy and sample Drafts; this page starts once
            you add real source material.
          </p>
        </div>
        <ExtractTrigger pendingChunks={pending ?? 0} />
      </header>

      <div className="mb-6">
        <StoryFilters pillars={pillars} activePillar={pillar} />
      </div>

      {seeds.length === 0 ? (
        <div className="rounded-card border border-border-strong bg-bg-elev p-6 text-center text-text-muted">
          <p>No source-backed story seeds yet.</p>
          <p className="mt-2">
            Upload files or connect GitHub, then mine new chunks. Interview-only
            sample posts live in{" "}
            <Link href="/content" className="text-accent hover:underline">
              Drafts
            </Link>
            .
          </p>
          <div className="mt-5">
            <Button href="/sources" variant="ghost">
              Add sources
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {seeds.map((s) => (
            <StoryCard
              key={s.id}
              seed={{
                id: s.id,
                title: s.title,
                summary: s.summary,
                pillarMatch: s.pillarMatch,
                storyType: s.storyType,
                relevanceScore: s.relevanceScore,
                sourceCitation: s.sourceCitation,
                status: s.status,
                sourceMode: s.sourceMode,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
