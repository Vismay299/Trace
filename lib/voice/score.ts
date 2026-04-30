/**
 * Voice score = approved / total. Cached briefly per user.
 */
import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { voiceSamples } from "@/lib/db/schema";
import { getCached } from "@/lib/cache";

export type VoiceScore = {
  total: number;
  approved: number;
  rejected: number;
  closeButEdited: number;
  score: number; // 0..1
};

export async function getVoiceScore(userId: string): Promise<VoiceScore> {
  return getCached({
    userId,
    namespace: "voice_score",
    key: "summary",
    ttl: 60 * 5,
    fn: async () => {
      const [{ total }] = await db
        .select({ total: count() })
        .from(voiceSamples)
        .where(eq(voiceSamples.userId, userId));

      const [{ approved }] = await db
        .select({ approved: count() })
        .from(voiceSamples)
        .where(
          and(
            eq(voiceSamples.userId, userId),
            eq(voiceSamples.feedback, "sounds_like_me"),
          ),
        );

      const [{ rejected }] = await db
        .select({ rejected: count() })
        .from(voiceSamples)
        .where(
          and(
            eq(voiceSamples.userId, userId),
            eq(voiceSamples.feedback, "doesnt_sound_like_me"),
          ),
        );

      const [{ closeButEdited }] = await db
        .select({ closeButEdited: count() })
        .from(voiceSamples)
        .where(
          and(
            eq(voiceSamples.userId, userId),
            eq(voiceSamples.feedback, "close_but_edited"),
          ),
        );

      const totalNum = Number(total);
      const approvedNum = Number(approved);
      return {
        total: totalNum,
        approved: approvedNum,
        rejected: Number(rejected),
        closeButEdited: Number(closeButEdited),
        score: totalNum === 0 ? 0 : approvedNum / totalNum,
      };
    },
  });
}
