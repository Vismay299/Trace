import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { sourceChunks, uploadedFiles } from "@/lib/db/schema";
import { chunkText } from "@/lib/integrations/chunker";
import { parseFile } from "@/lib/integrations/parser";
import { getObject } from "@/lib/storage/supabase";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const [upload] = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, id))
    .limit(1);
  if (!upload || upload.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (upload.processingStatus === "completed") {
    return NextResponse.json({
      ok: true,
      status: "completed",
      chunks: upload.chunkCount,
    });
  }

  try {
    await db
      .update(uploadedFiles)
      .set({ processingStatus: "processing", processingError: null })
      .where(eq(uploadedFiles.id, upload.id));

    const bytes = await getObject(upload.storageKey);
    const parsed = await parseFile(bytes, upload.filename);
    const chunks = chunkText(parsed.text, upload.filename);
    await db.delete(sourceChunks).where(eq(sourceChunks.uploadedFileId, upload.id));

    if (chunks.length) {
      const now = new Date();
      await db.insert(sourceChunks).values(
        chunks.map((chunk) => ({
          userId,
          uploadedFileId: upload.id,
          sourceType: "manual_upload",
          sourceReference: `file: ${upload.filename}`,
          sourceDate: now,
          title: chunk.title,
          content: chunk.text,
          metadata: {
            filename: upload.filename,
            mime: parsed.mime,
            chunkIndex: chunk.index,
            tokens: chunk.tokens,
          },
        })),
      );
    }

    await db
      .update(uploadedFiles)
      .set({
        processingStatus: chunks.length ? "completed" : "failed",
        processingError: chunks.length ? null : "No extractable text.",
        chunkCount: chunks.length,
      })
      .where(eq(uploadedFiles.id, upload.id));

    return NextResponse.json({
      ok: chunks.length > 0,
      status: chunks.length ? "completed" : "failed",
      chunks: chunks.length,
    });
  } catch (err) {
    await db
      .update(uploadedFiles)
      .set({
        processingStatus: "failed",
        processingError: err instanceof Error ? err.message : "Unknown error",
      })
      .where(eq(uploadedFiles.id, upload.id));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 },
    );
  }
}
