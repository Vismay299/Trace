import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent, voiceSamples } from "@/lib/db/schema";
import { invalidateNamespace } from "@/lib/cache";

export const runtime = "nodejs";

const schema = z.object({
  generatedContentId: z.string().uuid(),
  feedback: z.enum([
    "sounds_like_me",
    "doesnt_sound_like_me",
    "close_but_edited",
  ]),
  feedbackNote: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const [content] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, parsed.data.generatedContentId))
    .limit(1);
  if (!content || content.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const feedbackNote =
    parsed.data.feedbackNote ??
    (parsed.data.feedback === "close_but_edited" && content.editedContent
      ? summarizeEdit(content.content, content.editedContent)
      : null);

  await db.insert(voiceSamples).values({
    userId,
    generatedContentId: content.id,
    originalContent: content.content,
    editedContent: content.editedContent,
    feedback: parsed.data.feedback,
    feedbackNote,
  });

  await db
    .update(generatedContent)
    .set({
      voiceFeedback: parsed.data.feedback,
      voiceFeedbackNote: feedbackNote,
      updatedAt: new Date(),
    })
    .where(eq(generatedContent.id, content.id));

  // Voice few-shot examples must rebuild from this user's new feedback.
  await invalidateNamespace(userId, "voice_few_shot");
  await invalidateNamespace(userId, "voice_score");

  return NextResponse.json({ ok: true });
}

function summarizeEdit(original: string, edited: string) {
  const delta = edited.length - original.length;
  return [
    "User marked this close but edited.",
    `Length delta: ${delta >= 0 ? "+" : ""}${delta} characters.`,
    `Edited excerpt: ${edited.slice(0, 500)}`,
  ].join(" ");
}
