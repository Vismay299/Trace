import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";
import {
  DraftsWorkbench,
  type DraftListItem,
} from "./_components/drafts-workbench";

export const metadata = { title: "Drafts" };

export default async function ContentListPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/content");

  const rows = await db
    .select()
    .from(generatedContent)
    .where(
      and(
        eq(generatedContent.userId, userId),
        eq(generatedContent.status, "draft"),
      ),
    )
    .orderBy(desc(generatedContent.createdAt));

  const drafts: DraftListItem[] = rows.map((row) => ({
    id: row.id,
    format: row.format as DraftListItem["format"],
    title:
      row.contentMetadata?.title ??
      row.content.split("\n").find(Boolean)?.slice(0, 120) ??
      "Draft",
    origin: row.contentMetadata?.origin ?? null,
    slopReviewNeeded: row.slopReviewNeeded,
  }));

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-text">
          Your drafts
        </h1>
        <p className="mt-2 text-text-muted">
          Sample drafts from your interview and source-backed drafts from the
          Content Mine both appear here.
        </p>
      </header>
      {rows.some((row) => row.contentMetadata?.origin === "ship_to_post") ? (
        <section className="mb-8 rounded-card border border-accent/30 bg-accent-soft p-5">
          <h2 className="text-xl font-medium text-text">Ship-to-Post inbox</h2>
          <p className="mt-2 text-sm text-text-muted">
            Fresh GitHub activity created these draft ideas automatically.
            Review them before scheduling or posting.
          </p>
          <div className="mt-4 grid gap-2">
            {rows
              .filter((row) => row.contentMetadata?.origin === "ship_to_post")
              .slice(0, 5)
              .map((row) => (
                <Link
                  key={row.id}
                  href={`/content/${row.id}`}
                  className="rounded-2xl border border-border-strong bg-bg px-4 py-3 text-sm text-text hover:border-accent"
                >
                  {row.contentMetadata?.title ?? row.content.split("\n")[0]}
                </Link>
              ))}
          </div>
        </section>
      ) : null}
      <DraftsWorkbench initialDrafts={drafts} />
    </section>
  );
}
