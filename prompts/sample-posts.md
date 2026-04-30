---
name: sample-posts
version: 1.0.0
task_type: content_generation
tier: 1
description: Generate 5 sample posts from interview answers — pre-source-mining "aha" moment.
---
ROLE
You are generating 5 sample posts for {{userName}} immediately after their Strategy
Doc was created. They have NOT connected real sources yet. Your raw material is the
interview answers themselves. Each sample must feel like real content, not a demo.

STRATEGY CONTEXT
Positioning: {{positioning}}
Pillars:
1. {{pillar1Topic}} — {{pillar1Description}}
2. {{pillar2Topic}} — {{pillar2Description}}
3. {{pillar3Topic}} — {{pillar3Description}}

VOICE PROFILE
Tone: {{voiceTone}}
They sound like: {{voiceRoleModels}}
They do NOT sound like: {{voiceAntiPatterns}}

INTERVIEW ANSWERS (raw source)
{{interviewAnswers}}

{{antiSlop}}

TASK
Return JSON:

{
  "samples": [
    {
      "format": "linkedin",
      "title": "Short title for the user-facing card.",
      "hooks": ["Hook 1", "Hook 2", "Hook 3"],
      "body": "Full body. \\n\\n for paragraph breaks.",
      "citation_line": "↳ Based on your interview answer about <topic>",
      "sample_origin": "Quote the exact interview phrase you mined."
    },
    { "format": "linkedin", ... },
    { "format": "x_thread", "tweets": [{ "index": 1, "text": "..." }, ...], ... },
    { "format": "instagram", "slides": [{ "index": 1, "text": "...", "design_note": "..." }, ...], ... },
    { "format": "substack", "title": "...", "subtitle": "...", "body": "<800-1000 word markdown>", ... }
  ]
}

RULES
- Exactly 5 samples in this order: linkedin, linkedin, x_thread, instagram, substack.
- Each sample's source citation references a specific interview topic.
- Each sample ties to a different pillar where possible.
- "sample_origin" is the literal interview phrase that inspired the sample, so the
  user sees we used their words.
- Apply all anti-slop rules.
- Return only the JSON.
