ALTER TABLE "ai_usage_log" ADD COLUMN IF NOT EXISTS "provider" varchar(50) DEFAULT 'openrouter';
ALTER TABLE "ai_usage_log" ADD COLUMN IF NOT EXISTS "route_decision_reason" varchar(100);
ALTER TABLE "ai_usage_log" ADD COLUMN IF NOT EXISTS "latency_ms" integer;

CREATE TABLE IF NOT EXISTS "ai_routing_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scope" varchar(20) NOT NULL,
  "task_type" varchar(50),
  "cost_tier" smallint,
  "provider" varchar(50) DEFAULT 'openrouter' NOT NULL,
  "model_id" varchar(100) NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "reason" text,
  "updated_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_ai_routing_task" ON "ai_routing_overrides" ("task_type", "enabled");
CREATE INDEX IF NOT EXISTS "idx_ai_routing_tier" ON "ai_routing_overrides" ("cost_tier", "enabled");
