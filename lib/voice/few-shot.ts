/**
 * Few-shot example assembly for content generation prompts.
 * Pulls top-N approved + bottom-M rejected voice samples for a user
 * and serializes them for inclusion in the system prompt.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { voiceSamples } from "@/lib/db/schema";
import { getCached, hashKey } from "@/lib/cache";

export type FewShotBlock = {
  approved: string;
  rejected: string;
  approvedCount: number;
  rejectedCount: number;
};

export async function getFewShotExamples(
  userId: string,
  approvedN = 5,
  rejectedM = 3,
): Promise<FewShotBlock> {
  return getCached({
    userId,
    namespace: "voice_few_shot",
    key: hashKey({ approvedN, rejectedM }),
    ttl: null,
    fn: async () => {
      const approved = await db
        .select()
        .from(voiceSamples)
        .where(
          and(
            eq(voiceSamples.userId, userId),
            eq(voiceSamples.feedback, "sounds_like_me"),
          ),
        )
        .orderBy(desc(voiceSamples.createdAt))
        .limit(approvedN);
      const rejected = await db
        .select()
        .from(voiceSamples)
        .where(
          and(
            eq(voiceSamples.userId, userId),
            eq(voiceSamples.feedback, "doesnt_sound_like_me"),
          ),
        )
        .orderBy(desc(voiceSamples.createdAt))
        .limit(rejectedM);

      const approvedBlock =
        approved
          .map(
            (s, i) =>
              `Example ${i + 1} (approved):\n${(s.editedContent ?? s.originalContent ?? "").trim()}`,
          )
          .join("\n\n---\n\n") || "(none yet — generate, then mark a few as 'sounds like me')";

      const rejectedBlock =
        rejected
          .map(
            (s, i) =>
              `Counter-example ${i + 1} (rejected${s.feedbackNote ? ` — ${s.feedbackNote}` : ""}):\n${(s.originalContent ?? "").trim()}`,
          )
          .join("\n\n---\n\n") || "(none yet)";

      return {
        approved: approvedBlock,
        rejected: rejectedBlock,
        approvedCount: approved.length,
        rejectedCount: rejected.length,
      };
    },
  });
}
