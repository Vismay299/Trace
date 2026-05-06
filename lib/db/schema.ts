/**
 * Trace — Drizzle schema. Source of truth: trace_spec.md §12.
 *
 * Phase 1 notes:
 * - The pgvector `content_embedding` column on `source_chunks` is omitted
 *   intentionally (Phase 2). The corresponding ivfflat index is also deferred.
 * - All FK cascades match the spec's ON DELETE CASCADE wiring so account
 *   deletion (Segment 27) wipes downstream rows automatically.
 */
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const now = () => sql`now()`;

// --- users ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatarUrl: text("avatar_url"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  tier: varchar("tier", { length: 20 }).default("free").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripeSubscriptionStatus: varchar("stripe_subscription_status", {
    length: 50,
  }),
  planCode: varchar("plan_code", { length: 20 }).default("free").notNull(),
  billingPeriodStart: timestamp("billing_period_start", {
    withTimezone: true,
  }),
  billingPeriodEnd: timestamp("billing_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  lastStripeWebhookAt: timestamp("last_stripe_webhook_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(now())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(now())
    .notNull(),
});

// --- NextAuth tables (Drizzle adapter conventions) ---
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 32 }),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

// --- strategy_docs ---
export const strategyDocs = pgTable("strategy_docs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").default(1).notNull(),
  positioningStatement: text("positioning_statement"),
  pillar1Topic: varchar("pillar_1_topic", { length: 255 }),
  pillar1Description: text("pillar_1_description"),
  pillar2Topic: varchar("pillar_2_topic", { length: 255 }),
  pillar2Description: text("pillar_2_description"),
  pillar3Topic: varchar("pillar_3_topic", { length: 255 }),
  pillar3Description: text("pillar_3_description"),
  contrarianTakes: jsonb("contrarian_takes").$type<string[]>(),
  originStory: jsonb("origin_story").$type<{
    beat1?: string;
    beat2?: string;
    beat3?: string;
    beat4?: string;
    beat5?: string;
  }>(),
  targetAudience: jsonb("target_audience").$type<{
    job_title?: string;
    experience?: string;
    company_type?: string;
    interests?: string[];
    platforms?: string[];
  }>(),
  outcomeGoal: jsonb("outcome_goal").$type<{
    primary?: string;
    secondary?: string;
    ninety_day_metric?: string;
  }>(),
  voiceProfile: jsonb("voice_profile").$type<{
    tone?: string;
    format_pref?: string;
    anti_patterns?: string[];
    role_models?: string[];
  }>(),
  postingCadence: jsonb("posting_cadence").$type<{
    linkedin_per_week?: number;
    ig_per_week?: number;
    x_per_day?: number;
    substack_per_month?: number;
  }>(),
  rawInterviewAnswers: jsonb("raw_interview_answers"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(now())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(now())
    .notNull(),
});

// --- interview_sessions ---
export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currentSection: integer("current_section").default(1).notNull(),
  currentQuestion: integer("current_question").default(1).notNull(),
  answers: jsonb("answers")
    .default(sql`'{}'::jsonb`)
    .$type<
      Record<
        string,
        { answer: string; followups?: string[]; mode?: "text" | "voice" }
      >
    >(),
  isComplete: boolean("is_complete").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(now())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(now())
    .notNull(),
});

// --- source_connections (defined in Phase 1, used Phase 2+) ---
export const sourceConnections = pgTable(
  "source_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceType: varchar("source_type", { length: 50 }).notNull(),
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    providerAccountId: varchar("provider_account_id", { length: 255 }),
    providerInstallationId: varchar("provider_installation_id", {
      length: 255,
    }),
    connectionStatus: varchar("connection_status", { length: 30 })
      .default("not_connected")
      .notNull(),
    sourceMetadata: jsonb("source_metadata"),
    syncCursor: jsonb("sync_cursor"),
    lastSyncStartedAt: timestamp("last_sync_started_at", {
      withTimezone: true,
    }),
    lastSyncSucceededAt: timestamp("last_sync_succeeded_at", {
      withTimezone: true,
    }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastSyncError: text("last_sync_error"),
    lastJobId: varchar("last_job_id", { length: 255 }),
    selectedResources: jsonb("selected_resources"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userTypeIdx: index("idx_source_connections_user_type").on(
      t.userId,
      t.sourceType,
    ),
    statusIdx: index("idx_source_connections_status").on(t.connectionStatus),
  }),
);

// --- source_chunks (no embeddings in Phase 1) ---
export const sourceChunks = pgTable(
  "source_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceConnectionId: uuid("source_connection_id").references(
      () => sourceConnections.id,
      { onDelete: "set null" },
    ),
    uploadedFileId: uuid("uploaded_file_id").references(
      () => uploadedFiles.id,
      {
        onDelete: "cascade",
      },
    ),
    sourceType: varchar("source_type", { length: 50 }).notNull(),
    sourceReference: text("source_reference"),
    sourceDate: timestamp("source_date", { withTimezone: true }),
    title: text("title"),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userIdx: index("idx_source_chunks_user").on(t.userId),
    fileIdx: index("idx_source_chunks_file").on(t.uploadedFileId),
  }),
);

// --- uploaded_files (manual uploads) ---
export const uploadedFiles = pgTable("uploaded_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }),
  storageKey: text("storage_key").notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  processingStatus: varchar("processing_status", { length: 20 })
    .default("pending")
    .notNull(),
  processingError: text("processing_error"),
  chunkCount: integer("chunk_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(now())
    .notNull(),
});

// --- weekly_checkins ---
export const weeklyCheckins = pgTable(
  "weekly_checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStartDate: date("week_start_date").notNull(),
    productStage: varchar("product_stage", { length: 20 }),
    answers: jsonb("answers")
      .notNull()
      .$type<
        Record<
          string,
          { answer: string; followups?: string[]; mode?: "text" | "voice" }
        >
      >(),
    sourceActivitySummary: jsonb("source_activity_summary").$type<{
      commits_count?: number;
      meaningful_commits_count?: number;
      pull_requests_count?: number;
      github_top_repos?: string[];
      docs_count?: number;
      uploads_count?: number;
      stories_found?: number;
    }>(),
    inputMode: varchar("input_mode", { length: 10 }).default("text").notNull(),
    isComplete: boolean("is_complete").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userWeekIdx: index("idx_weekly_checkins_user_week").on(
      t.userId,
      t.weekStartDate,
    ),
  }),
);

// --- narrative_plans ---
export const narrativePlans = pgTable(
  "narrative_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weeklyCheckinId: uuid("weekly_checkin_id").references(
      () => weeklyCheckins.id,
      { onDelete: "set null" },
    ),
    weekStartDate: date("week_start_date").notNull(),
    mainTheme: text("main_theme"),
    productStage: varchar("product_stage", { length: 20 }),
    contentStrategy: text("content_strategy"),
    recommendedPosts: jsonb("recommended_posts").$type<RecommendedPost[]>(),
    anchorStory: jsonb("anchor_story"),
    proofAssets: jsonb("proof_assets"),
    pillarBalance: jsonb("pillar_balance"),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userWeekIdx: index("idx_narrative_plans_user_week").on(
      t.userId,
      t.weekStartDate,
    ),
  }),
);

export type RecommendedPost = {
  format: "linkedin" | "instagram" | "x_thread" | "substack";
  story_type:
    | "origin"
    | "build_decision"
    | "mistake_lesson"
    | "user_insight"
    | "product_pov"
    | "launch_distribution"
    | "proof";
  title: string;
  summary: string;
  pillar_match: string;
  source_note: string;
  source_chunk_id?: string;
  is_anchor?: boolean;
};

// --- story_seeds (with F13 columns merged) ---
export const storySeeds = pgTable(
  "story_seeds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceChunkId: uuid("source_chunk_id").references(() => sourceChunks.id, {
      onDelete: "set null",
    }),
    weeklyCheckinId: uuid("weekly_checkin_id").references(
      () => weeklyCheckins.id,
      { onDelete: "set null" },
    ),
    narrativePlanId: uuid("narrative_plan_id").references(
      () => narrativePlans.id,
      { onDelete: "set null" },
    ),
    sourceMode: varchar("source_mode", { length: 30 })
      .default("source_mining")
      .notNull(),
    storyType: varchar("story_type", { length: 50 }),
    title: text("title").notNull(),
    summary: text("summary"),
    pillarMatch: varchar("pillar_match", { length: 255 }),
    relevanceScore: real("relevance_score"),
    sourceCitation: text("source_citation"),
    status: varchar("status", { length: 20 }).default("new").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userStatusIdx: index("idx_story_seeds_user_status").on(t.userId, t.status),
    sourceModeIdx: index("idx_story_seeds_source_mode").on(
      t.userId,
      t.sourceMode,
    ),
  }),
);

// --- generated_content ---
export const generatedContent = pgTable(
  "generated_content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storySeedId: uuid("story_seed_id").references(() => storySeeds.id, {
      onDelete: "set null",
    }),
    format: varchar("format", { length: 20 }).notNull(),
    hookVariant: integer("hook_variant").default(1).notNull(),
    content: text("content").notNull(),
    contentMetadata: jsonb("content_metadata").$type<{
      hooks?: string[];
      slides?: { index: number; text: string; design_note?: string }[];
      tweets?: { index: number; text: string }[];
      title?: string;
      subtitle?: string;
      sample_origin?: string;
      origin?: string;
      sourceChunkExternalId?: string;
    }>(),
    sourceCitation: text("source_citation"),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    slopReviewNeeded: boolean("slop_review_needed").default(false).notNull(),
    voiceFeedback: varchar("voice_feedback", { length: 20 }),
    voiceFeedbackNote: text("voice_feedback_note"),
    editedContent: text("edited_content"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    generationPromptVersion: varchar("generation_prompt_version", {
      length: 50,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userStatusIdx: index("idx_generated_content_user_status").on(
      t.userId,
      t.status,
    ),
  }),
);

// --- voice_samples ---
export const voiceSamples = pgTable("voice_samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  generatedContentId: uuid("generated_content_id").references(
    () => generatedContent.id,
    { onDelete: "cascade" },
  ),
  originalContent: text("original_content"),
  editedContent: text("edited_content"),
  feedback: varchar("feedback", { length: 20 }),
  feedbackNote: text("feedback_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(now())
    .notNull(),
});

// --- content_calendar ---
export const contentCalendar = pgTable(
  "content_calendar",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generatedContentId: uuid("generated_content_id").references(
      () => generatedContent.id,
      { onDelete: "cascade" },
    ),
    storySeedId: uuid("story_seed_id").references(() => storySeeds.id, {
      onDelete: "set null",
    }),
    narrativePlanId: uuid("narrative_plan_id").references(
      () => narrativePlans.id,
      { onDelete: "set null" },
    ),
    title: text("title"),
    description: text("description"),
    scheduledDate: date("scheduled_date").notNull(),
    platform: varchar("platform", { length: 20 }).notNull(),
    sourceOrigin: varchar("source_origin", { length: 40 }).default("manual"),
    metadata: jsonb("metadata"),
    status: varchar("status", { length: 20 }).default("scheduled").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userDateIdx: index("idx_content_calendar_user_date").on(
      t.userId,
      t.scheduledDate,
    ),
  }),
);

// --- brands (Studio tier scaffold) ---
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  brandName: varchar("brand_name", { length: 255 }).notNull(),
  strategyDocId: uuid("strategy_doc_id").references(() => strategyDocs.id, {
    onDelete: "set null",
  }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(now())
    .notNull(),
});

// --- ai_usage_log ---
export const aiUsageLog = pgTable(
  "ai_usage_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskType: varchar("task_type", { length: 50 }).notNull(),
    costTier: smallint("cost_tier").notNull(),
    modelUsed: varchar("model_used", { length: 100 }),
    provider: varchar("provider", { length: 50 }).default("openrouter"),
    routeDecisionReason: varchar("route_decision_reason", { length: 100 }),
    latencyMs: integer("latency_ms"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    estimatedCostUsd: numeric("estimated_cost_usd", {
      precision: 10,
      scale: 6,
    }),
    cached: boolean("cached").default(false).notNull(),
    success: boolean("success").default(true).notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userDateIdx: index("idx_ai_usage_user_date").on(t.userId, t.createdAt),
  }),
);

// --- ai_budgets ---
export const aiBudgets = pgTable(
  "ai_budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    billingPeriodStart: date("billing_period_start").notNull(),
    billingPeriodEnd: date("billing_period_end").notNull(),
    tier1RequestsLimit: integer("tier1_requests_limit").notNull(),
    tier2RequestsLimit: integer("tier2_requests_limit").notNull(),
    tier3RequestsLimit: integer("tier3_requests_limit").notNull(),
    tier1RequestsUsed: integer("tier1_requests_used").default(0).notNull(),
    tier2RequestsUsed: integer("tier2_requests_used").default(0).notNull(),
    tier3RequestsUsed: integer("tier3_requests_used").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    userPeriodIdx: uniqueIndex("idx_ai_budgets_user_period").on(
      t.userId,
      t.billingPeriodStart,
    ),
  }),
);

// --- ai_routing_overrides (segment 47 admin controls) ---
export const aiRoutingOverrides = pgTable(
  "ai_routing_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: varchar("scope", { length: 20 }).notNull(),
    taskType: varchar("task_type", { length: 50 }),
    costTier: smallint("cost_tier"),
    provider: varchar("provider", { length: 50 })
      .default("openrouter")
      .notNull(),
    modelId: varchar("model_id", { length: 100 }).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    reason: text("reason"),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    taskIdx: index("idx_ai_routing_task").on(t.taskType, t.enabled),
    tierIdx: index("idx_ai_routing_tier").on(t.costTier, t.enabled),
  }),
);

// --- cache_entries (DB-backed cache layer, segment 5) ---
export const cacheEntries = pgTable(
  "cache_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    namespace: varchar("namespace", { length: 64 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    value: jsonb("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(now())
      .notNull(),
  },
  (t) => ({
    keyIdx: uniqueIndex("idx_cache_user_namespace_key").on(
      t.userId,
      t.namespace,
      t.keyHash,
    ),
  }),
);

// --- waitlist_signups (segment 8) ---
export const waitlistSignups = pgTable("waitlist_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  source: varchar("source", { length: 64 }),
  tier: varchar("tier", { length: 32 }),
  project: text("project"),
  platform: varchar("platform", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(now())
    .notNull(),
});

// --- relations ---
export const usersRelations = relations(users, ({ many, one }) => ({
  strategyDoc: one(strategyDocs),
  interviewSession: one(interviewSessions),
  uploadedFiles: many(uploadedFiles),
  storySeeds: many(storySeeds),
  generatedContent: many(generatedContent),
  voiceSamples: many(voiceSamples),
  weeklyCheckins: many(weeklyCheckins),
  narrativePlans: many(narrativePlans),
  budgets: many(aiBudgets),
}));

export const strategyDocsRelations = relations(strategyDocs, ({ one }) => ({
  user: one(users, {
    fields: [strategyDocs.userId],
    references: [users.id],
  }),
}));

export const sourceChunksRelations = relations(sourceChunks, ({ one }) => ({
  user: one(users, {
    fields: [sourceChunks.userId],
    references: [users.id],
  }),
  uploadedFile: one(uploadedFiles, {
    fields: [sourceChunks.uploadedFileId],
    references: [uploadedFiles.id],
  }),
}));

export const uploadedFilesRelations = relations(uploadedFiles, ({ many }) => ({
  chunks: many(sourceChunks),
}));

export const storySeedsRelations = relations(storySeeds, ({ one, many }) => ({
  user: one(users, { fields: [storySeeds.userId], references: [users.id] }),
  sourceChunk: one(sourceChunks, {
    fields: [storySeeds.sourceChunkId],
    references: [sourceChunks.id],
  }),
  weeklyCheckin: one(weeklyCheckins, {
    fields: [storySeeds.weeklyCheckinId],
    references: [weeklyCheckins.id],
  }),
  narrativePlan: one(narrativePlans, {
    fields: [storySeeds.narrativePlanId],
    references: [narrativePlans.id],
  }),
  generated: many(generatedContent),
}));

export const generatedContentRelations = relations(
  generatedContent,
  ({ one, many }) => ({
    user: one(users, {
      fields: [generatedContent.userId],
      references: [users.id],
    }),
    storySeed: one(storySeeds, {
      fields: [generatedContent.storySeedId],
      references: [storySeeds.id],
    }),
    voiceSamples: many(voiceSamples),
  }),
);

export const weeklyCheckinsRelations = relations(
  weeklyCheckins,
  ({ one, many }) => ({
    user: one(users, {
      fields: [weeklyCheckins.userId],
      references: [users.id],
    }),
    narrativePlans: many(narrativePlans),
  }),
);

export const narrativePlansRelations = relations(
  narrativePlans,
  ({ one, many }) => ({
    user: one(users, {
      fields: [narrativePlans.userId],
      references: [users.id],
    }),
    checkin: one(weeklyCheckins, {
      fields: [narrativePlans.weeklyCheckinId],
      references: [weeklyCheckins.id],
    }),
    storySeeds: many(storySeeds),
  }),
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type StrategyDoc = typeof strategyDocs.$inferSelect;
export type NewStrategyDoc = typeof strategyDocs.$inferInsert;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type StorySeed = typeof storySeeds.$inferSelect;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type NewGeneratedContent = typeof generatedContent.$inferInsert;
export type WeeklyCheckin = typeof weeklyCheckins.$inferSelect;
export type NarrativePlan = typeof narrativePlans.$inferSelect;
export type AiUsageLog = typeof aiUsageLog.$inferSelect;
export type AiBudget = typeof aiBudgets.$inferSelect;
export type AiRoutingOverride = typeof aiRoutingOverrides.$inferSelect;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type SourceChunk = typeof sourceChunks.$inferSelect;
export type VoiceSample = typeof voiceSamples.$inferSelect;
