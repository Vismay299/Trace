import { redirect, notFound } from "next/navigation";
import { and, eq, isNotNull } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";
import { ContentEditor, type ContentRow } from "./_components/content-editor";

export const metadata = { title: "Content draft" };

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/content");
  const { id } = await params;

  const [row] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, id))
    .limit(1);
  if (!row || row.userId !== userId) notFound();

  // Sibling rows for the same story seed (so the user can switch formats).
  const siblings = row.storySeedId
    ? await db
        .select()
        .from(generatedContent)
        .where(
          and(
            eq(generatedContent.userId, userId),
            eq(generatedContent.storySeedId, row.storySeedId),
            isNotNull(generatedContent.storySeedId),
          ),
        )
    : [];

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          {row.contentMetadata?.title ?? "Draft"}
        </h1>
        <p className="mt-2 text-text-muted">
          {row.format === "linkedin"
            ? "LinkedIn long-form post"
            : row.format === "instagram"
              ? "Instagram carousel"
              : row.format === "x_thread"
                ? "X thread"
                : "Substack draft"}
        </p>
      </header>

      <ContentEditor
        initial={toView(row)}
        siblings={siblings.filter((r) => r.id !== row.id).map(toView)}
      />
    </section>
  );
}

function toView(r: typeof generatedContent.$inferSelect): ContentRow {
  return {
    id: r.id,
    format: r.format as ContentRow["format"],
    hookVariant: r.hookVariant,
    content: r.content,
    editedContent: r.editedContent,
    contentMetadata: r.contentMetadata as ContentRow["contentMetadata"],
    sourceCitation: r.sourceCitation,
    status: r.status,
    slopReviewNeeded: r.slopReviewNeeded,
    voiceFeedback: r.voiceFeedback,
    storySeedId: r.storySeedId,
  };
}
