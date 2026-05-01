/**
 * Upload orchestration: persist file row → store blob → parse → chunk →
 * write source_chunks → mark file completed. Synchronous in Phase 1
 * (per IMPLEMENTATION_PLAN.md decision 9 — no async queue yet).
 */
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sourceChunks, uploadedFiles, users } from "@/lib/db/schema";
import {
  fileTypeOf,
  isAllowedExtension,
  parseFile,
} from "@/lib/integrations/parser";
import { chunkText } from "@/lib/integrations/chunker";
import { normalizeCodingConversation } from "@/lib/integrations/claude-code/normalize";
import { deleteObject, objectKeyFor, putObject } from "@/lib/storage/supabase";

export const FREE_FILE_LIMIT = 5;
export const PRO_FILE_LIMIT = 20;
export const FILE_LIMIT_PER_USER = PRO_FILE_LIMIT;
export const FILE_SIZE_LIMIT_BYTES = 12 * 1024 * 1024; // 12 MB

export class UploadError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function ensureQuota(userId: string): Promise<number> {
  const [[{ count }], user] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId)),
    db
      .select({ tier: users.tier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);
  const limit = uploadLimitForTier(user[0]?.tier ?? "free");
  if (count >= limit) {
    throw new UploadError(
      "QUOTA",
      `You've reached the ${limit}-file limit for your plan. Delete one or upgrade before uploading another.`,
    );
  }
  return count;
}

export function uploadLimitForTier(tier: string) {
  return tier === "pro" ? PRO_FILE_LIMIT : FREE_FILE_LIMIT;
}

export async function ingestUpload(
  userId: string,
  file: {
    name: string;
    size: number;
    type: string;
    bytes: Buffer;
    sourceKind?: "auto" | "manual_upload" | "ai_coding_log";
  },
) {
  if (!isAllowedExtension(file.name)) {
    throw new UploadError(
      "BAD_TYPE",
      "Unsupported file type. Allowed: PDF, DOCX, TXT, MD, CSV, JSON.",
    );
  }
  if (file.size > FILE_SIZE_LIMIT_BYTES) {
    throw new UploadError(
      "TOO_LARGE",
      `File too large. Max ${Math.round(FILE_SIZE_LIMIT_BYTES / 1024 / 1024)} MB.`,
    );
  }
  await ensureQuota(userId);

  const storageKey = objectKeyFor(userId, file.name);

  const [row] = await db
    .insert(uploadedFiles)
    .values({
      userId,
      filename: file.name,
      fileType: fileTypeOf(file.name),
      storageKey,
      fileSizeBytes: file.size,
      processingStatus: "processing",
    })
    .returning();

  try {
    await putObject(
      storageKey,
      file.bytes,
      file.type || "application/octet-stream",
    );
    const parsed = await parseFile(file.bytes, file.name);
    const codingImport = normalizeCodingConversation(parsed.text, file.name);
    const sourceType =
      file.sourceKind === "ai_coding_log" || codingImport.detected
        ? "ai_coding_log"
        : "manual_upload";
    const textToChunk =
      sourceType === "ai_coding_log" ? codingImport.text : parsed.text;
    const chunks = chunkText(textToChunk, file.name);

    if (chunks.length === 0) {
      await db
        .update(uploadedFiles)
        .set({
          processingStatus: "failed",
          processingError: "No extractable text.",
        })
        .where(eq(uploadedFiles.id, row.id));
      return { id: row.id, chunks: 0, status: "failed" as const };
    }

    const now = new Date();
    await db.insert(sourceChunks).values(
      chunks.map((c) => ({
        userId,
        uploadedFileId: row.id,
        sourceType,
        sourceReference:
          sourceType === "ai_coding_log"
            ? `coding conversation: ${file.name}`
            : `file: ${file.name}`,
        sourceDate: now,
        title: c.title,
        content: c.text,
        metadata: {
          filename: file.name,
          mime: parsed.mime,
          importType: sourceType,
          ...(sourceType === "ai_coding_log" ? codingImport.metadata : {}),
          chunkIndex: c.index,
          tokens: c.tokens,
        },
      })),
    );
    await db
      .update(uploadedFiles)
      .set({ processingStatus: "completed", chunkCount: chunks.length })
      .where(eq(uploadedFiles.id, row.id));

    return { id: row.id, chunks: chunks.length, status: "completed" as const };
  } catch (err) {
    await db
      .update(uploadedFiles)
      .set({
        processingStatus: "failed",
        processingError: err instanceof Error ? err.message : "Unknown error",
      })
      .where(eq(uploadedFiles.id, row.id));
    // Best-effort blob cleanup so we don't orphan storage on parse failure.
    deleteObject(storageKey).catch(() => {});
    throw err;
  }
}

export async function deleteUpload(userId: string, uploadId: string) {
  const [row] = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, uploadId))
    .limit(1);
  if (!row || row.userId !== userId) {
    throw new UploadError("NOT_FOUND", "Upload not found.");
  }
  await db
    .delete(sourceChunks)
    .where(eq(sourceChunks.uploadedFileId, uploadId));
  await db.delete(uploadedFiles).where(eq(uploadedFiles.id, uploadId));
  await deleteObject(row.storageKey).catch(() => {});
}
