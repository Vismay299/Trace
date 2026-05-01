import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { generatedContent, sourceChunks, storySeeds } from "@/lib/db/schema";
import { generateForStory } from "@/lib/ai/generate";
import type { JobEnvelope } from "@/lib/jobs/types";

export type ShipToPostPayload = {
  sourceChunkExternalId: string;
  preferredFormat?: "x_thread" | "linkedin";
};

export async function processShipToPost(
  envelope: JobEnvelope<ShipToPostPayload>,
) {
  const [chunk] = await db
    .select()
    .from(sourceChunks)
    .where(
      and(
        eq(sourceChunks.userId, envelope.userId),
        eq(sourceChunks.sourceConnectionId, envelope.sourceConnectionId ?? ""),
        eq(sourceChunks.isActive, true),
        sql`${sourceChunks.metadata}->>'externalId' = ${envelope.payload.sourceChunkExternalId}`,
      ),
    )
    .orderBy(sql`(${sourceChunks.metadata}->>'chunkIndex')::int asc`)
    .limit(1);

  if (!chunk) throw new Error("Ship-to-Post source chunk not found.");

  const metadata = (chunk.metadata ?? {}) as Record<string, unknown>;
  const artifactType = String(metadata.artifactType ?? "GitHub activity");
  const repo = String(metadata.repoFullName ?? "GitHub");
  const citation =
    chunk.sourceReference ??
    `Based on ${repo} ${artifactType.replaceAll("_", " ")}`;

  const [existingSeed] = await db
    .select()
    .from(storySeeds)
    .where(
      and(
        eq(storySeeds.userId, envelope.userId),
        eq(storySeeds.sourceChunkId, chunk.id),
        eq(storySeeds.sourceMode, "ship_to_post"),
      ),
    )
    .limit(1);

  const seed =
    existingSeed ??
    (
      await db
        .insert(storySeeds)
        .values({
          userId: envelope.userId,
          sourceChunkId: chunk.id,
          sourceMode: "ship_to_post",
          storyType: "build_decision",
          title: `Ship-to-Post: ${chunk.title ?? repo}`,
          summary: `Auto-draft from meaningful ${artifactType.replaceAll("_", " ")} in ${repo}.`,
          pillarMatch: "unmapped",
          relevanceScore: 0.78,
          sourceCitation: citation,
          status: "new",
        })
        .returning()
    )[0];

  const [existingDraft] = await db
    .select()
    .from(generatedContent)
    .where(
      and(
        eq(generatedContent.userId, envelope.userId),
        eq(generatedContent.storySeedId, seed.id),
        eq(
          generatedContent.format,
          envelope.payload.preferredFormat ?? "x_thread",
        ),
      ),
    )
    .orderBy(desc(generatedContent.createdAt))
    .limit(1);

  if (existingDraft) {
    return { storySeedId: seed.id, contentId: existingDraft.id, skipped: true };
  }

  const [draft] = await generateForStory(envelope.userId, seed.id, [
    envelope.payload.preferredFormat ?? "x_thread",
  ]);
  await db
    .update(generatedContent)
    .set({
      status: "draft",
      contentMetadata: {
        ...(draft.contentMetadata ?? {}),
        origin: "ship_to_post",
        sourceChunkExternalId: envelope.payload.sourceChunkExternalId,
      },
      updatedAt: new Date(),
    })
    .where(eq(generatedContent.id, draft.id));

  return { storySeedId: seed.id, contentId: draft.id, skipped: false };
}
