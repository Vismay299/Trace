import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadedFiles } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./_components/upload-zone";
import { FileList } from "./_components/file-list";
import { FILE_LIMIT_PER_USER } from "@/lib/uploads";

export const metadata = { title: "Sources" };

export default async function SourcesPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/sources");

  const rows = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.userId, userId))
    .orderBy(desc(uploadedFiles.createdAt));

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-text">
          Your sources
        </h1>
        <p className="mt-3 text-text-muted">
          Upload real work — retros, READMEs, notes, transcripts. We chunk it,
          mine it for stories, and cite the source on every post we generate.
          Phase 1 limit: {FILE_LIMIT_PER_USER} files. Integrations (GitHub,
          Drive, Notion) ship in Phase 2.
        </p>
      </header>

      <UploadZone />

      <div className="mt-10">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          Files ({rows.length}/{FILE_LIMIT_PER_USER})
        </h2>
        <FileList
          rows={rows.map((r) => ({
            id: r.id,
            filename: r.filename,
            fileType: r.fileType,
            fileSizeBytes: r.fileSizeBytes,
            processingStatus: r.processingStatus,
            processingError: r.processingError,
            chunkCount: r.chunkCount,
            createdAt: r.createdAt.toString(),
          }))}
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button href="/mine">See story seeds →</Button>
        <Button href="/strategy" variant="ghost">
          Back to strategy
        </Button>
      </div>
    </section>
  );
}
