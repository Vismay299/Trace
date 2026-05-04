import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { listCalendarItems, listUnscheduledDrafts } from "@/lib/calendar";
import { CalendarBoard } from "./_components/calendar-board";

export const metadata = { title: "Content calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; platform?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/calendar");

  const params = await searchParams;
  const [items, drafts] = await Promise.all([
    listCalendarItems({
      userId,
      from: params.from,
      to: params.to,
      platform: isPlatform(params.platform) ? params.platform : undefined,
    }),
    listUnscheduledDrafts(userId),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-text">
            Content calendar
          </h1>
          <p className="mt-2 text-text-muted">
            Schedule drafts internally, spot cadence gaps, and keep narrative
            plan work moving without publishing anything automatically.
          </p>
        </div>
        <Link href="/content" className="text-sm text-accent hover:underline">
          Open drafts
        </Link>
      </header>

      <CalendarBoard
        initialItems={items.map((row) => ({
          id: row.calendar.id,
          title:
            row.calendar.title ??
            row.content?.contentMetadata?.title ??
            row.seed?.title ??
            "Scheduled item",
          description:
            row.calendar.description ??
            row.content?.sourceCitation ??
            row.seed?.sourceCitation ??
            null,
          scheduledDate: String(row.calendar.scheduledDate).slice(0, 10),
          platform: row.calendar.platform ?? "linkedin",
          status: row.calendar.status ?? "scheduled",
          sourceOrigin: row.calendar.sourceOrigin ?? "manual",
          contentId: row.calendar.generatedContentId ?? null,
        }))}
        initialDrafts={drafts.map((draft) => ({
          id: draft.id,
          title:
            draft.contentMetadata?.title ??
            draft.content.split("\n").find(Boolean)?.slice(0, 120) ??
            "Draft",
          format: draft.format,
          citation: draft.sourceCitation,
        }))}
      />
    </section>
  );
}

function isPlatform(
  value?: string,
): value is "linkedin" | "instagram" | "x_thread" | "substack" {
  return (
    value === "linkedin" ||
    value === "instagram" ||
    value === "x_thread" ||
    value === "substack"
  );
}
