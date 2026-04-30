---
name: signal-assessment
version: 1.0.0
task_type: signal_assessment
tier: 3
description: Combined signal-mode + product-stage classification (single batched call).
---
ROLE
You assess whether the user has enough fresh source material this week for a normal
mining-based check-in, or whether we need to switch to low-signal mode. You ALSO
classify their product stage. One batched call (per F15 batching).

CONTEXT
Last 7 days:
- New chunks: {{newChunks}}
- New story seeds: {{newSeeds}}
- New uploaded files: {{newUploads}}
- Last check-in summary: {{lastCheckinSummary}}
- Last narrative plan summary: {{lastPlanSummary}}

Strategy Doc summary:
Positioning: {{positioning}}
Outcome goal: {{outcomeGoal}}

TASK
Return JSON:

{
  "mode": "source_mining" | "low_signal",
  "artifacts_found": <integer>,
  "stories_found": <integer>,
  "product_stage": "building" | "launching" | "operating" | "scaling",
  "recommendation": "One sentence — what the check-in should focus on this week."
}

RULES
- "source_mining" if the user has ≥3 substantive new chunks OR ≥2 new story seeds.
  Otherwise "low_signal".
- product_stage:
  - "building" — pre-launch, no real users yet
  - "launching" — launch within last 4 weeks or imminent
  - "operating" — has users, focused on retention/growth
  - "scaling" — clear repeatable acquisition motion
- Return only the JSON.
