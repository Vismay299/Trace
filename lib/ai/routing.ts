import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiRoutingOverrides } from "@/lib/db/schema";
import {
  MODELS,
  TASK_TIERS,
  TIER_DEFAULTS,
  type TaskType,
  type Tier,
} from "@/lib/ai/models";
import { getAiRouteConfig, type AiProvider } from "@/lib/config/ai-routing";

export type AiRouteDecision = {
  provider: AiProvider;
  modelId: string;
  reason: string;
  source: "explicit_model" | "task_override" | "tier_override" | "default";
};

export async function resolveAiRouteDecision({
  taskType,
  tier,
  requestedModel,
}: {
  taskType: TaskType;
  tier: Tier;
  requestedModel?: string;
}): Promise<AiRouteDecision> {
  if (requestedModel) {
    return {
      provider: "openrouter",
      modelId: requestedModel,
      reason: "explicit_model",
      source: "explicit_model",
    };
  }

  const route = getAiRouteConfig();
  try {
    const [taskOverride] = await db
      .select()
      .from(aiRoutingOverrides)
      .where(
        and(
          eq(aiRoutingOverrides.enabled, true),
          eq(aiRoutingOverrides.scope, "task"),
          eq(aiRoutingOverrides.taskType, taskType),
        ),
      )
      .orderBy(desc(aiRoutingOverrides.updatedAt))
      .limit(1);
    const taskDecision = validateOverride(taskOverride, tier, "task_override");
    if (taskDecision) return taskDecision;

    const [tierOverride] = await db
      .select()
      .from(aiRoutingOverrides)
      .where(
        and(
          eq(aiRoutingOverrides.enabled, true),
          eq(aiRoutingOverrides.scope, "tier"),
          eq(aiRoutingOverrides.costTier, tier),
        ),
      )
      .orderBy(desc(aiRoutingOverrides.updatedAt))
      .limit(1);
    const tierDecision = validateOverride(tierOverride, tier, "tier_override");
    if (tierDecision) return tierDecision;
  } catch {
    return defaultDecision(tier, "override_lookup_failed");
  }

  return {
    ...defaultDecision(tier, "primary"),
    provider: route.primaryProvider,
  };
}

export async function listRoutingOverrides() {
  return db
    .select()
    .from(aiRoutingOverrides)
    .orderBy(desc(aiRoutingOverrides.updatedAt))
    .limit(50);
}

export async function upsertRoutingOverride({
  scope,
  taskType,
  costTier,
  provider,
  modelId,
  enabled,
  reason,
  updatedBy,
}: {
  scope: "task" | "tier";
  taskType?: TaskType | null;
  costTier?: Tier | null;
  provider: AiProvider;
  modelId: string;
  enabled: boolean;
  reason?: string | null;
  updatedBy: string;
}) {
  const model = MODELS[modelId];
  const tier = scope === "task" && taskType ? TASK_TIERS[taskType] : costTier;
  if (!tier) throw new Error("A task or tier is required.");
  if (!model) throw new Error("Unknown model.");
  if (model.tier !== tier) {
    throw new Error(
      `Model ${modelId} is tier ${model.tier}, not tier ${tier}.`,
    );
  }
  if (
    provider === "nvidia_nim" &&
    !getAiRouteConfig().alternateProviders.includes("nvidia_nim")
  ) {
    throw new Error("NVIDIA NIM routing is not enabled or configured.");
  }

  await db
    .update(aiRoutingOverrides)
    .set({ enabled: false, updatedAt: new Date() })
    .where(
      scope === "task" && taskType
        ? and(
            eq(aiRoutingOverrides.scope, "task"),
            eq(aiRoutingOverrides.taskType, taskType),
          )
        : and(
            eq(aiRoutingOverrides.scope, "tier"),
            eq(aiRoutingOverrides.costTier, tier),
          ),
    );

  const [created] = await db
    .insert(aiRoutingOverrides)
    .values({
      scope,
      taskType: scope === "task" ? taskType : null,
      costTier: tier,
      provider,
      modelId,
      enabled,
      reason,
      updatedBy,
    })
    .returning();
  return created;
}

export function getRoutingCatalog() {
  return {
    config: getAiRouteConfig(),
    models: Object.values(MODELS),
    tasks: Object.entries(TASK_TIERS).map(([taskType, tier]) => ({
      taskType,
      tier,
      defaultModel: TIER_DEFAULTS[tier],
    })),
  };
}

function validateOverride(
  override: typeof aiRoutingOverrides.$inferSelect | undefined,
  tier: Tier,
  source: "task_override" | "tier_override",
): AiRouteDecision | null {
  if (!override?.enabled) return null;
  const model = MODELS[override.modelId];
  if (!model || model.tier !== tier) return null;
  const provider =
    override.provider === "nvidia_nim" ? "nvidia_nim" : "openrouter";
  if (
    provider === "nvidia_nim" &&
    !getAiRouteConfig().alternateProviders.includes("nvidia_nim")
  ) {
    return null;
  }
  return {
    provider,
    modelId: override.modelId,
    reason: source,
    source,
  };
}

function defaultDecision(tier: Tier, reason: string): AiRouteDecision {
  return {
    provider: "openrouter",
    modelId: TIER_DEFAULTS[tier],
    reason,
    source: "default",
  };
}
