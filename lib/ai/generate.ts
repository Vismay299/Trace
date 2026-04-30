/**
 * Content generation pipeline. Spec §F5 + §8.
 *
 * Pipeline per format:
 *   load Strategy Doc → load voice few-shots → load source chunk → load
 *   format prompt → Tier 1 call → runAntiSlop → up to 3 retries → persist.
 *
 * On 3rd failure: persist as draft with `slop_review_needed=true`.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  generatedContent,
  sourceChunks,
  storySeeds,
  strategyDocs,
  users,
  type GeneratedContent,
} from "@/lib/db/schema";
import { callAI } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { generateWithSlopRetries } from "@/lib/ai/slop-check";
import { getFewShotExamples } from "@/lib/voice/few-shot";

export type ContentFormat = "linkedin" | "instagram" | "x_thread" | "substack";

const linkedInSchema = z.object({
  hooks: z.array(z.string()).length(3),
  body: z.string(),
  citation_line: z.string(),
});

const instagramSchema = z.object({
  hooks: z.array(z.string()).min(1),
  slides: z
    .array(
      z.object({
        index: z.number(),
        text: z.string(),
        design_note: z.string().optional(),
      }),
    )
    .min(8)
    .max(10),
  caption: z.string().optional(),
  citation_line: z.string(),
});

const xThreadSchema = z.object({
  hooks: z.array(z.string()).length(3),
  tweets: z
    .array(z.object({ index: z.number(), text: z.string().max(280) }))
    .min(6)
    .max(10),
  citation_line: z.string(),
});

const substackSchema = z.object({
  hooks: z.array(z.string()).length(3),
  title: z.string(),
  subtitle: z.string(),
  body: z.string(),
  citation_line: z.string(),
});

type GeneratedRaw = {
  hooks?: string[];
  body?: string;
  citation_line?: string;
  slides?: { index: number; text: string; design_note?: string }[];
  tweets?: { index: number; text: string }[];
  title?: string;
  subtitle?: string;
  caption?: string;
};

export async function generateForStory(
  userId: string,
  storySeedId: string,
  formats: ContentFormat[],
  opts?: { regenerationGuidance?: string; existingContentId?: string },
): Promise<GeneratedContent[]> {
  const [doc] = await db
    .select()
    .from(strategyDocs)
    .where(eq(strategyDocs.userId, userId))
    .limit(1);
  if (!doc) throw new Error("Strategy Doc required.");

  const [seed] = await db
    .select()
    .from(storySeeds)
    .where(eq(storySeeds.id, storySeedId))
    .limit(1);
  if (!seed || seed.userId !== userId) throw new Error("Story seed not found.");

  const sourceContent = await loadSourceContext(seed);
  const fewShot = await getFewShotExamples(userId);

  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const baseVars = {
    userName: user?.name ?? user?.email ?? "the user",
    positioning: doc.positioningStatement ?? "",
    pillar1Topic: doc.pillar1Topic ?? "",
    pillar1Description: doc.pillar1Description ?? "",
    pillar2Topic: doc.pillar2Topic ?? "",
    pillar2Description: doc.pillar2Description ?? "",
    pillar3Topic: doc.pillar3Topic ?? "",
    pillar3Description: doc.pillar3Description ?? "",
    audience: JSON.stringify(doc.targetAudience ?? {}),
    outcomeGoal: JSON.stringify(doc.outcomeGoal ?? {}),
    voiceTone: doc.voiceProfile?.tone ?? "",
    voiceFormat: doc.voiceProfile?.format_pref ?? "",
    voiceRoleModels: (doc.voiceProfile?.role_models ?? []).join(", "),
    voiceAntiPatterns: (doc.voiceProfile?.anti_patterns ?? []).join(", "),
    voiceApproved: fewShot.approved,
    voiceRejected: fewShot.rejected,
    sourceContent,
    sourceCitation: seed.sourceCitation ?? "your work",
  };

  const out: GeneratedContent[] = [];
  for (const format of formats) {
    const row = await generateOneFormat(
      userId,
      seed.id,
      format,
      baseVars,
      opts,
    );
    out.push(row);
  }

  // Mark seed as used.
  await db
    .update(storySeeds)
    .set({ status: "used" })
    .where(eq(storySeeds.id, storySeedId));

  return out;
}

async function generateOneFormat(
  userId: string,
  seedId: string,
  format: ContentFormat,
  baseVars: Record<string, string | number>,
  opts?: { regenerationGuidance?: string; existingContentId?: string },
): Promise<GeneratedContent> {
  const promptName = formatPromptName(format);
  const prompt = loadPrompt(promptName, baseVars);
  const guidance = opts?.regenerationGuidance
    ? `\n\nADDITIONAL GUIDANCE FROM USER\n${opts.regenerationGuidance}`
    : "";

  const result = await generateWithSlopRetries<GeneratedRaw>({
    userId,
    extractText: (raw) => extractCheckableText(format, raw),
    generate: async (attempt, lastViolations) => {
      const retryNote =
        attempt > 1 && lastViolations?.length
          ? `\n\nRETRY NOTE\nYour previous attempt tripped these anti-slop rules: ${lastViolations
              .map((v) => v.label)
              .join("; ")}. Do not repeat any of them.`
          : "";

      const ai = await callAI({
        taskType: "content_generation",
        userId,
        messages: [
          { role: "system", content: prompt.system + guidance + retryNote },
        ],
        json: true,
        promptVersion: prompt.meta.version,
        maxOutputTokens: format === "substack" ? 6000 : 3500,
      });
      const parsed = parseFormat(format, ai.content);
      return { content: ai.content, raw: parsed };
    },
  });

  const persisted = await persistGenerated({
    userId,
    storySeedId: seedId,
    format,
    raw: result.raw,
    promptVersion: prompt.meta.version,
    slopReviewNeeded: !result.passed,
    citation: baseVars.sourceCitation as string,
    existingContentId: opts?.existingContentId,
  });
  return persisted;
}

function formatPromptName(format: ContentFormat): string {
  switch (format) {
    case "linkedin":
      return "content-linkedin";
    case "instagram":
      return "content-instagram";
    case "x_thread":
      return "content-x-thread";
    case "substack":
      return "content-substack";
  }
}

function parseFormat(format: ContentFormat, raw: string): GeneratedRaw {
  const json = JSON.parse(raw);
  switch (format) {
    case "linkedin":
      return linkedInSchema.parse(json);
    case "instagram":
      return instagramSchema.parse(json);
    case "x_thread":
      return xThreadSchema.parse(json);
    case "substack":
      return substackSchema.parse(json);
  }
}

function extractCheckableText(format: ContentFormat, raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const r = raw as Record<string, unknown>;
  if (format === "linkedin") {
    const hooks = (r.hooks as string[]) ?? [];
    return [hooks.join("\n"), r.body].filter(Boolean).join("\n\n");
  }
  if (format === "instagram") {
    const slides = (r.slides as { text: string }[]) ?? [];
    const hooks = (r.hooks as string[]) ?? [];
    return [hooks.join("\n"), slides.map((s) => s.text).join("\n"), r.caption].filter(Boolean).join("\n\n");
  }
  if (format === "x_thread") {
    const tweets = (r.tweets as { text: string }[]) ?? [];
    const hooks = (r.hooks as string[]) ?? [];
    return [hooks.join("\n"), tweets.map((t) => t.text).join("\n")].join("\n\n");
  }
  if (format === "substack") {
    return [r.title, r.subtitle, r.body].filter(Boolean).join("\n\n") as string;
  }
  return "";
}

async function persistGenerated(args: {
  userId: string;
  storySeedId: string;
  format: ContentFormat;
  raw: GeneratedRaw;
  promptVersion: string;
  slopReviewNeeded: boolean;
  citation: string;
  existingContentId?: string;
}): Promise<GeneratedContent> {
  const r = args.raw;
  const hooks: string[] = r.hooks ?? [];
  const fullContent = renderForFormat(args.format, r);

  const values = {
    userId: args.userId,
    storySeedId: args.storySeedId,
    format: args.format,
    hookVariant: 1,
    content: fullContent,
    contentMetadata: {
      hooks,
      slides: r.slides,
      tweets: r.tweets,
      title: r.title,
      subtitle: r.subtitle,
      caption: r.caption,
    },
    sourceCitation: r.citation_line ?? `↳ Based on ${args.citation}`,
    status: args.slopReviewNeeded ? "draft" : "draft",
    slopReviewNeeded: args.slopReviewNeeded,
    generationPromptVersion: args.promptVersion,
    updatedAt: new Date(),
  } as const;

  if (args.existingContentId) {
    const [updated] = await db
      .update(generatedContent)
      .set({ ...values, editedContent: null })
      .where(eq(generatedContent.id, args.existingContentId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(generatedContent)
    .values(values)
    .returning();
  return created;
}

function renderForFormat(format: ContentFormat, r: GeneratedRaw): string {
  if (format === "linkedin") {
    const hook = r.hooks?.[0] ?? "";
    return [hook, r.body, r.citation_line].filter(Boolean).join("\n\n");
  }
  if (format === "x_thread") {
    const tweets = (r.tweets as { index: number; text: string }[]) ?? [];
    const hook = r.hooks?.[0] ?? "";
    const ordered = [...tweets].sort((a, b) => a.index - b.index);
    // Replace [HOOK] placeholder if model used it.
    if (ordered[0]?.text?.includes("[HOOK]")) {
      ordered[0].text = ordered[0].text.replace("[HOOK]", hook);
    } else if (ordered.length && !ordered[0].text.trim().startsWith(hook)) {
      ordered[0] = { index: 1, text: hook };
    }
    return ordered.map((t, i) => `${i + 1}/ ${t.text}`).join("\n\n");
  }
  if (format === "instagram") {
    const slides = (r.slides as { index: number; text: string; design_note?: string }[]) ?? [];
    const ordered = [...slides].sort((a, b) => a.index - b.index);
    const body = ordered
      .map(
        (s) =>
          `Slide ${s.index}: ${s.text}${s.design_note ? `\n[Design: ${s.design_note}]` : ""}`,
      )
      .join("\n\n");
    return [body, r.caption ? `\nCaption: ${r.caption}` : "", r.citation_line]
      .filter(Boolean)
      .join("\n\n");
  }
  if (format === "substack") {
    return [
      `# ${r.title}`,
      r.subtitle ? `*${r.subtitle}*` : "",
      r.body,
      r.citation_line,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

async function loadSourceContext(seed: { sourceChunkId: string | null; summary: string | null; title: string }): Promise<string> {
  if (seed.sourceChunkId) {
    const [chunk] = await db
      .select()
      .from(sourceChunks)
      .where(eq(sourceChunks.id, seed.sourceChunkId))
      .limit(1);
    if (chunk) return chunk.content.slice(0, 4000);
  }
  return [seed.title, seed.summary].filter(Boolean).join("\n\n");
}
