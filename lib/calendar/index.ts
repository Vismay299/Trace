import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contentCalendar,
  generatedContent,
  storySeeds,
  type RecommendedPost,
} from "@/lib/db/schema";

export type CalendarPlatform =
  | "linkedin"
  | "instagram"
  | "x_thread"
  | "substack";

export async function listCalendarItems({
  userId,
  from,
  to,
  platform,
}: {
  userId: string;
  from?: string;
  to?: string;
  platform?: CalendarPlatform;
}) {
  const conditions = [eq(contentCalendar.userId, userId)];
  if (from) conditions.push(gte(contentCalendar.scheduledDate, from));
  if (to) conditions.push(lte(contentCalendar.scheduledDate, to));
  if (platform) conditions.push(eq(contentCalendar.platform, platform));

  return db
    .select({
      calendar: contentCalendar,
      content: generatedContent,
      seed: storySeeds,
    })
    .from(contentCalendar)
    .leftJoin(
      generatedContent,
      eq(contentCalendar.generatedContentId, generatedContent.id),
    )
    .leftJoin(storySeeds, eq(contentCalendar.storySeedId, storySeeds.id))
    .where(and(...conditions))
    .orderBy(contentCalendar.scheduledDate, desc(contentCalendar.createdAt));
}

export async function listUnscheduledDrafts(userId: string) {
  return db
    .select()
    .from(generatedContent)
    .where(
      and(
        eq(generatedContent.userId, userId),
        eq(generatedContent.status, "draft"),
      ),
    )
    .orderBy(desc(generatedContent.createdAt))
    .limit(30);
}

export async function scheduleGeneratedContent({
  userId,
  generatedContentId,
  scheduledDate,
  platform,
}: {
  userId: string;
  generatedContentId: string;
  scheduledDate: string;
  platform?: CalendarPlatform;
}) {
  const [content] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, generatedContentId))
    .limit(1);
  if (!content || content.userId !== userId)
    throw new Error("Draft not found.");

  const dateOnly = scheduledDate.slice(0, 10);
  const [item] = await db
    .insert(contentCalendar)
    .values({
      userId,
      generatedContentId,
      storySeedId: content.storySeedId,
      title:
        content.contentMetadata?.title ??
        content.content.split("\n").find(Boolean)?.slice(0, 140) ??
        "Draft",
      description: content.sourceCitation,
      scheduledDate: dateOnly,
      platform: platform ?? (content.format as CalendarPlatform),
      sourceOrigin: "generated_content",
      status: "scheduled",
      metadata: { contentStatus: content.status },
    })
    .returning();

  await db
    .update(generatedContent)
    .set({
      scheduledFor: new Date(`${dateOnly}T12:00:00.000Z`),
      updatedAt: new Date(),
    })
    .where(eq(generatedContent.id, content.id));

  return item;
}

export async function updateCalendarItem({
  userId,
  id,
  scheduledDate,
  status,
  platform,
}: {
  userId: string;
  id: string;
  scheduledDate?: string;
  status?: "scheduled" | "done" | "cancelled";
  platform?: CalendarPlatform;
}) {
  const [item] = await db
    .update(contentCalendar)
    .set({
      ...(scheduledDate ? { scheduledDate: scheduledDate.slice(0, 10) } : {}),
      ...(status ? { status } : {}),
      ...(platform ? { platform } : {}),
    })
    .where(and(eq(contentCalendar.id, id), eq(contentCalendar.userId, userId)))
    .returning();
  if (!item) throw new Error("Calendar item not found.");
  return item;
}

export async function deleteCalendarItem(userId: string, id: string) {
  const [item] = await db
    .delete(contentCalendar)
    .where(and(eq(contentCalendar.id, id), eq(contentCalendar.userId, userId)))
    .returning();
  if (!item) throw new Error("Calendar item not found.");
  return item;
}

export async function createPlannedCalendarItem({
  userId,
  narrativePlanId,
  storySeedId,
  post,
  scheduledDate,
}: {
  userId: string;
  narrativePlanId: string;
  storySeedId: string;
  post: RecommendedPost;
  scheduledDate: string;
}) {
  const [item] = await db
    .insert(contentCalendar)
    .values({
      userId,
      storySeedId,
      narrativePlanId,
      title: post.title,
      description: post.summary,
      scheduledDate: scheduledDate.slice(0, 10),
      platform: post.format,
      sourceOrigin: "narrative_plan",
      status: "scheduled",
      metadata: {
        storyType: post.story_type,
        pillarMatch: post.pillar_match,
        sourceNote: post.source_note,
        isAnchor: post.is_anchor ?? false,
      },
    })
    .returning();
  return item;
}
