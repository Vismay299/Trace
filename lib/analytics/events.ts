export const ANALYTICS_EVENTS = [
  "subscription_started",
  "source_connected",
  "source_sync_started",
  "source_sync_completed",
  "story_seed_created",
  "content_generated",
  "calendar_item_scheduled",
  "voice_checkin_started",
  "voice_checkin_completed",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;
