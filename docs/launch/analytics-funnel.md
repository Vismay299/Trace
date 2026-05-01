# Activation Analytics Funnel

Segment 48 success depends on being able to measure launch behavior, not only ship features.

## Funnel Events

| Step | Event | Minimum Properties |
| --- | --- | --- |
| Signup | `signup_completed` | `user_id`, `plan`, `beta_gate_active`, `signup_method` |
| Strategy generated | `strategy_generated` | `user_id`, `task_type`, `tier`, `provider`, `model`, `latency_ms` |
| GitHub connected | `source_connected` | `user_id`, `provider`, `selected_repo_count` |
| Repo synced | `source_sync_completed` | `user_id`, `provider`, `repo_count`, `chunk_count`, `duration_ms` |
| Story seed reviewed | `story_seed_reviewed` | `user_id`, `source_provider`, `decision`, `seed_id` |
| Content approved | `content_approved` | `user_id`, `platform`, `source_provider`, `draft_id` |
| Content scheduled | `calendar_item_scheduled` | `user_id`, `platform`, `scheduled_date`, `origin` |

## Metrics

| Metric | Query Intent |
| --- | --- |
| Signup-to-strategy activation | Percent of signups with a generated Strategy Doc within 24 hours |
| Source connection activation | Percent of Pro users with GitHub connected and at least one selected repo |
| Source-to-seed quality | Percent of synced repos producing at least one reviewed story seed |
| Draft approval rate | Approved drafts divided by generated drafts by platform and source provider |
| Schedule completion | Percent of approved drafts scheduled within 7 days |
| AI cost per approved draft | Total AI cost divided by approved drafts by cohort and provider |
| Support load | Failures, retries, and account deletion requests per active launch user |

## Validation

- Confirm anonymous marketing events and authenticated product events are both present.
- Confirm AI usage metadata can be joined to user cohort, task type, provider, model, and route reason.
- Confirm cache hits are counted separately from model calls so cost reports do not overstate spend.
- Confirm beta-gated signup failures are visible without storing unnecessary attempted-account data.
