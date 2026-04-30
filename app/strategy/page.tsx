import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";
import { getStrategy } from "@/lib/strategy/generate";
import { GenerateStrategyTrigger } from "./_components/generate-trigger";
import { StrategyView } from "./_components/strategy-view";

export const metadata = {
  title: "Brand Strategy",
};

export default async function StrategyPage({
  searchParams,
}: {
  searchParams: Promise<{ firstRun?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/strategy");

  const params = await searchParams;
  const firstRun = params.firstRun === "1";

  const doc = await getStrategy(userId);
  if (!doc) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Generating your Strategy…
        </h1>
        <p className="mt-3 text-text-muted">
          We're synthesizing your interview into a one-page brand strategy.
          This takes ~60 seconds. Don't refresh — we'll auto-redirect when it's
          ready.
        </p>
        <GenerateStrategyTrigger />
      </section>
    );
  }

  // Sample posts are persisted as generated_content rows with no story_seed_id.
  const samples = await db
    .select({
      id: generatedContent.id,
      format: generatedContent.format,
      content: generatedContent.content,
      contentMetadata: generatedContent.contentMetadata,
      sourceCitation: generatedContent.sourceCitation,
    })
    .from(generatedContent)
    .where(
      and(
        eq(generatedContent.userId, userId),
        isNull(generatedContent.storySeedId),
      ),
    )
    .limit(5);

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <StrategyView
        initialDoc={doc}
        initialSamples={samples.map((s) => ({
          id: s.id,
          format: s.format as
            | "linkedin"
            | "instagram"
            | "x_thread"
            | "substack",
          content: s.content,
          contentMetadata: s.contentMetadata ?? undefined,
          sourceCitation: s.sourceCitation,
        }))}
        showFirstRunBanner={firstRun}
      />
    </section>
  );
}
