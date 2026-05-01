import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { getBudgetSnapshot } from "@/lib/ai/budget";
import { db } from "@/lib/db";
import {
  contentCalendar,
  generatedContent,
  interviewSessions,
  narrativePlans,
  sourceChunks,
  sourceConnections,
  storySeeds,
  strategyDocs,
  uploadedFiles,
  voiceSamples,
  weeklyCheckins,
} from "@/lib/db/schema";
import { BudgetIndicator } from "./_components/budget-indicator";
import { PillarBalanceChart } from "./_components/pillar-balance-chart";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/dashboard");
  const params = await searchParams;
  const wantsPro = params.plan === "pro";

  const [[interview], [strategy]] = await Promise.all([
    db
      .select({ isComplete: interviewSessions.isComplete })
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .limit(1),
    db
      .select({ id: strategyDocs.id })
      .from(strategyDocs)
      .where(eq(strategyDocs.userId, userId))
      .limit(1),
  ]);

  if (!interview?.isComplete) {
    redirect(`/onboarding${wantsPro ? "?plan=pro" : ""}`);
  }
  if (!strategy) {
    redirect(`/strategy?firstRun=1${wantsPro ? "&plan=pro" : ""}`);
  }

  const [[content], [voice], [checkins], budget, pillars, activity, setup] =
    await Promise.all([
      db
        .select({
          generated: sql<number>`count(*)::int`,
          approved: sql<number>`count(*) filter (where ${generatedContent.status} = 'approved')::int`,
          published: sql<number>`count(*) filter (where ${generatedContent.publishedAt} is not null)::int`,
        })
        .from(generatedContent)
        .where(eq(generatedContent.userId, userId)),
      db
        .select({
          total: sql<number>`count(*)::int`,
          approved: sql<number>`count(*) filter (where ${voiceSamples.feedback} = 'sounds_like_me')::int`,
        })
        .from(voiceSamples)
        .where(eq(voiceSamples.userId, userId)),
      db
        .select({
          completed: sql<number>`count(*) filter (where ${weeklyCheckins.isComplete} = true)::int`,
          voice: sql<number>`count(*) filter (where ${weeklyCheckins.inputMode} = 'voice')::int`,
        })
        .from(weeklyCheckins)
        .where(eq(weeklyCheckins.userId, userId)),
      getBudgetSnapshot(userId),
      db
        .select({
          name: storySeeds.pillarMatch,
          value: sql<number>`count(*)::int`,
        })
        .from(generatedContent)
        .leftJoin(storySeeds, eq(generatedContent.storySeedId, storySeeds.id))
        .where(eq(generatedContent.userId, userId))
        .groupBy(storySeeds.pillarMatch),
      recentActivity(userId),
      setupSnapshot(userId),
    ]);

  const voiceScore =
    voice?.total && voice.total > 0
      ? `${Math.round(((voice.approved ?? 0) / voice.total) * 100)}%`
      : "n/a";

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-text">
            Dashboard
          </h1>
          <p className="mt-2 text-text-muted">
            Weekly production, voice fit, pillar balance, activity, and AI
            budget.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/weekly" className="text-sm text-accent hover:underline">
            Weekly check-in
          </Link>
          <Link
            href="/settings"
            className="text-sm text-accent hover:underline"
          >
            Settings
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Generated" value={content?.generated ?? 0} />
        <Stat label="Approved" value={content?.approved ?? 0} />
        <Stat label="Published" value={content?.published ?? 0} />
        <Stat label="Voice score" value={voiceScore} />
      </div>

      <section className="mt-6 rounded-card border border-border-strong bg-bg-elev p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-text">Launch checklist</h2>
            <p className="mt-2 text-sm text-text-muted">
              Move from strategy to sources, mined story seeds, drafts, and an
              internal publishing plan.
            </p>
          </div>
          <Link
            href={nextAction(setup).href}
            className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent-soft"
          >
            {nextAction(setup).label}
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <SetupCard
            title="Strategy"
            complete={setup.hasStrategy}
            detail="Positioning and voice are ready."
            href="/strategy"
          />
          <SetupCard
            title="Sources"
            complete={setup.sourceCount > 0}
            detail={`${setup.sourceCount} source${setup.sourceCount === 1 ? "" : "s"} connected or uploaded.`}
            href="/sources"
          />
          <SetupCard
            title="Story seeds"
            complete={setup.seedCount > 0}
            detail={`${setup.seedCount} mined seed${setup.seedCount === 1 ? "" : "s"}.`}
            href="/mine"
          />
          <SetupCard
            title="Schedule"
            complete={setup.scheduledCount > 0}
            detail={`${setup.draftCount} draft${setup.draftCount === 1 ? "" : "s"}, ${setup.scheduledCount} scheduled.`}
            href={setup.draftCount > 0 ? "/calendar" : "/content"}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-card border border-border-strong bg-bg-elev p-6">
          <h2 className="text-xl font-medium text-text">Pillar balance</h2>
          <PillarBalanceChart
            data={pillars.map((p) => ({
              name: p.name ?? "unmapped",
              value: Number(p.value ?? 0),
            }))}
          />
        </section>
        <aside className="rounded-card border border-border-strong bg-bg-elev p-6">
          <h2 className="text-xl font-medium text-text">AI budget</h2>
          <div className="mt-5">
            <BudgetIndicator budget={budget} />
          </div>
        </aside>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-card border border-border-strong bg-bg-elev p-6">
          <h2 className="text-xl font-medium text-text">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {activity.length ? (
              activity.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="block rounded-2xl border border-border-strong p-4 hover:border-accent"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
                    {item.type} · {item.date}
                  </p>
                  <p className="mt-1 text-sm font-medium text-text">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{item.detail}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-text-muted">No activity yet.</p>
            )}
          </div>
        </section>
        <aside className="rounded-card border border-border-strong bg-bg-elev p-6">
          <h2 className="text-xl font-medium text-text">Weekly status</h2>
          <p className="mt-4 text-3xl font-medium text-text">
            {checkins?.completed ?? 0}
          </p>
          <p className="text-sm text-text-muted">completed check-ins</p>
          <p className="mt-4 text-3xl font-medium text-text">
            {checkins?.voice ?? 0}
          </p>
          <p className="text-sm text-text-muted">voice-mode check-ins</p>
        </aside>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card border border-border-strong bg-bg-elev p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
        {label}
      </p>
      <p className="mt-3 text-3xl font-medium text-text">{value}</p>
    </div>
  );
}

function SetupCard({
  title,
  complete,
  detail,
  href,
}: {
  title: string;
  complete: boolean;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-card border border-border-strong bg-bg p-4 hover:border-accent"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
        {complete ? "Done" : "Next"} · {title}
      </p>
      <p className="mt-2 text-sm text-text-muted">{detail}</p>
    </Link>
  );
}

type SetupSnapshot = Awaited<ReturnType<typeof setupSnapshot>>;

function nextAction(setup: SetupSnapshot) {
  if (!setup.hasStrategy) return { href: "/strategy", label: "Generate strategy" };
  if (setup.sourceCount === 0) return { href: "/sources", label: "Add sources" };
  if (setup.seedCount === 0) return { href: "/mine", label: "Mine story seeds" };
  if (setup.draftCount === 0) return { href: "/mine", label: "Create first draft" };
  if (setup.scheduledCount === 0) return { href: "/calendar", label: "Schedule drafts" };
  return { href: "/weekly", label: "Start weekly check-in" };
}

async function recentActivity(userId: string) {
  const [content, checkins, plans] = await Promise.all([
    db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.userId, userId))
      .orderBy(desc(generatedContent.createdAt))
      .limit(8),
    db
      .select()
      .from(weeklyCheckins)
      .where(eq(weeklyCheckins.userId, userId))
      .orderBy(desc(weeklyCheckins.updatedAt))
      .limit(4),
    db
      .select()
      .from(narrativePlans)
      .where(eq(narrativePlans.userId, userId))
      .orderBy(desc(narrativePlans.updatedAt))
      .limit(4),
  ]);

  return [
    ...content.map((c) => ({
      id: c.id,
      type: "content",
      title: `${c.format} draft ${c.status}`,
      detail: c.sourceCitation ?? c.content.slice(0, 100),
      at: c.createdAt,
      href: `/content/${c.id}`,
    })),
    ...checkins.map((c) => ({
      id: c.id,
      type: "check-in",
      title: c.isComplete
        ? "Submitted weekly check-in"
        : "Started weekly check-in",
      detail: `Week of ${c.weekStartDate} in ${c.inputMode} mode`,
      at: c.updatedAt,
      href: "/weekly",
    })),
    ...plans.map((p) => ({
      id: p.id,
      type: "plan",
      title: `Narrative plan ${p.status}`,
      detail: p.mainTheme ?? `Week of ${p.weekStartDate}`,
      at: p.updatedAt,
      href: "/weekly/plan",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 20)
    .map((item) => ({ ...item, date: item.at.toISOString().slice(0, 10) }));
}

async function setupSnapshot(userId: string) {
  const [
    [strategy],
    [uploads],
    [connections],
    [chunks],
    [seeds],
    [drafts],
    [scheduled],
  ] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(strategyDocs)
      .where(eq(strategyDocs.userId, userId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(sourceConnections)
      .where(eq(sourceConnections.userId, userId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(sourceChunks)
      .where(eq(sourceChunks.userId, userId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(storySeeds)
      .where(eq(storySeeds.userId, userId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(generatedContent)
      .where(eq(generatedContent.userId, userId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(contentCalendar)
      .where(eq(contentCalendar.userId, userId)),
  ]);

  return {
    hasStrategy: Number(strategy?.total ?? 0) > 0,
    sourceCount: Number(uploads?.total ?? 0) + Number(connections?.total ?? 0),
    chunkCount: Number(chunks?.total ?? 0),
    seedCount: Number(seeds?.total ?? 0),
    draftCount: Number(drafts?.total ?? 0),
    scheduledCount: Number(scheduled?.total ?? 0),
  };
}
