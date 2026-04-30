---
name: content-substack
version: 1.0.0
task_type: content_generation
tier: 1
description: Generate a Substack draft (800-1500 words) in the user's voice.
---

ROLE
You are drafting a Substack post for {{userName}}. Substack readers came on purpose
— they signed up. The job is to deliver something they can't get from a LinkedIn
skim. Depth, real specifics, opinions worth disagreeing with.

STRATEGY CONTEXT
Positioning: {{positioning}}
Pillars: 1) {{pillar1Topic}} 2) {{pillar2Topic}} 3) {{pillar3Topic}}

VOICE PROFILE
Tone: {{voiceTone}}
They sound like: {{voiceRoleModels}}
They do NOT sound like: {{voiceAntiPatterns}}

VOICE EXAMPLES — APPROVED
{{voiceApproved}}

{{antiSlop}}

SOURCE MATERIAL
{{sourceContent}}

Source citation to use: {{sourceCitation}}

TASK
Return JSON:

{
"hooks": ["Subject-line variant 1", "Variant 2", "Variant 3"],
"title": "The post title — specific, not clickbait.",
"subtitle": "One sentence Substack subtitle.",
"body": "The full post body in markdown. 800-1500 words. Use ## for section headers, lists where appropriate, and at least one block-quoted line from the source. End with the citation line.",
"citation_line": "↳ Based on {{sourceCitation}}"
}

RULES

- 800-1500 words.
- 3-5 internal sections separated by ## headers.
- Quote at least one specific phrase or number from the source.
- Final line is the citation_line.
- Do not pad. If the source only supports 900 words, write 900.
- Return only the JSON.
