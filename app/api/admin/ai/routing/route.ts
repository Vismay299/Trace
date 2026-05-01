import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin";
import {
  getRoutingCatalog,
  listRoutingOverrides,
  upsertRoutingOverride,
} from "@/lib/ai/routing";
import { TASK_TIERS } from "@/lib/ai/models";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("task"),
    taskType: z.enum(Object.keys(TASK_TIERS) as [keyof typeof TASK_TIERS]),
    provider: z.enum(["openrouter", "nvidia_nim"]),
    modelId: z.string().min(1),
    enabled: z.boolean().default(true),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    scope: z.literal("tier"),
    costTier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    provider: z.enum(["openrouter", "nvidia_nim"]),
    modelId: z.string().min(1),
    enabled: z.boolean().default(true),
    reason: z.string().max(500).optional(),
  }),
]);

export async function GET() {
  try {
    await requireAdminUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [overrides, catalog] = await Promise.all([
    listRoutingOverrides(),
    Promise.resolve(getRoutingCatalog()),
  ]);
  return NextResponse.json({ ...catalog, overrides });
}

export async function POST(req: Request) {
  let admin: Awaited<ReturnType<typeof requireAdminUser>>;
  try {
    admin = await requireAdminUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const override = await upsertRoutingOverride({
      ...parsed.data,
      taskType: parsed.data.scope === "task" ? parsed.data.taskType : null,
      costTier: parsed.data.scope === "tier" ? parsed.data.costTier : null,
      updatedBy: admin.id,
    });
    return NextResponse.json({ override });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not update routing.",
      },
      { status: 400 },
    );
  }
}
