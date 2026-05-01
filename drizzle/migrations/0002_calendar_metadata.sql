ALTER TABLE "content_calendar" ADD COLUMN IF NOT EXISTS "story_seed_id" uuid REFERENCES "story_seeds"("id") ON DELETE SET NULL;
ALTER TABLE "content_calendar" ADD COLUMN IF NOT EXISTS "narrative_plan_id" uuid REFERENCES "narrative_plans"("id") ON DELETE SET NULL;
ALTER TABLE "content_calendar" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "content_calendar" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "content_calendar" ADD COLUMN IF NOT EXISTS "source_origin" varchar(40) DEFAULT 'manual';
ALTER TABLE "content_calendar" ADD COLUMN IF NOT EXISTS "metadata" jsonb;

CREATE INDEX IF NOT EXISTS "idx_content_calendar_generated_content" ON "content_calendar" ("generated_content_id");
CREATE INDEX IF NOT EXISTS "idx_content_calendar_story_seed" ON "content_calendar" ("story_seed_id");
