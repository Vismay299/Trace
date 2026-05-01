import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";

export const metadata = { title: "Drafts" };

export default async function ContentListPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/content");

  const rows = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.userId, userId))
    .orderBy(desc(generatedContent.createdAt));

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-text">
          Your drafts
        </h1>
        <p className="mt-2 text-text-muted">
          Every piece of content Trace has generated for you, with its source.
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
      {rows.length === 0 ? (
        <p className="rounded-card border border-border-strong bg-bg-elev p-6 text-center text-text-muted">
          Nothing yet. Head to the{" "}
          <Link href="/mine" className="text-accent hover:underline">
            Content Mine
          </Link>{" "}
          to generate your first post.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-card border border-border-strong bg-bg-elev px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
                  {r.format} · {r.status}
                  {r.contentMetadata?.origin === "ship_to_post"
                    ? " · ship-to-post"
                    : ""}
                  {r.slopReviewNeeded ? " · ⚠ slop review" : ""}
                </p>
                <p className="truncate text-sm text-text">
                  {r.contentMetadata?.title ?? r.content.split("\n")[0]}
                </p>
              </div>
              <Link
                href={`/content/${r.id}`}
                className="text-sm text-accent hover:underline"
              >
                Open →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
