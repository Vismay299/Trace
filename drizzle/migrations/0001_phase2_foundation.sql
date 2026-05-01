ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_subscription_status" varchar(50);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_code" varchar(20) DEFAULT 'free' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "billing_period_start" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "billing_period_end" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cancel_at_period_end" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_stripe_webhook_at" timestamp with time zone;

ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "provider_account_id" varchar(255);
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "provider_installation_id" varchar(255);
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "connection_status" varchar(30) DEFAULT 'not_connected' NOT NULL;
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "sync_cursor" jsonb;
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "last_sync_started_at" timestamp with time zone;
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "last_sync_succeeded_at" timestamp with time zone;
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "last_sync_error" text;
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "last_job_id" varchar(255);
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "selected_resources" jsonb;

ALTER TABLE "ai_usage_log" ADD COLUMN IF NOT EXISTS "provider" varchar(50) DEFAULT 'openrouter';
ALTER TABLE "ai_usage_log" ADD COLUMN IF NOT EXISTS "route_decision_reason" varchar(100);
ALTER TABLE "ai_usage_log" ADD COLUMN IF NOT EXISTS "latency_ms" integer;

CREATE INDEX IF NOT EXISTS "idx_source_connections_user_type" ON "source_connections" ("user_id", "source_type");
CREATE INDEX IF NOT EXISTS "idx_source_connections_status" ON "source_connections" ("connection_status");
CREATE INDEX IF NOT EXISTS "idx_users_stripe_customer" ON "users" ("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_users_stripe_subscription" ON "users" ("stripe_subscription_id");
