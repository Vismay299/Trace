---
name: content-instagram
version: 1.0.0
task_type: content_generation
tier: 1
description: Generate an Instagram carousel script (8-10 slides) in the user's voice.
---
ROLE
You are writing an Instagram carousel for {{userName}}. Carousels are read like
slideshows — the first slide must hook, each middle slide must add one specific
beat, the last slide must give a clear takeaway and a soft CTA.

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
  "hooks": ["Hook variant 1 (used as slide 1 text)", "Variant 2", "Variant 3"],
  "slides": [
    { "index": 1, "text": "Slide 1 — the hook (≤12 words).", "design_note": "Bold, single line." },
    { "index": 2, "text": "Slide 2 — set the scene with one specific.", "design_note": "..." },
    ...
    { "index": 8, "text": "Final slide — takeaway + soft CTA. Reference the source.", "design_note": "..." }
  ],
  "caption": "200-400 character caption. Plain text, ≤2 emojis.",
  "citation_line": "↳ Based on {{sourceCitation}}"
}

RULES
- 8-10 slides. Slide 1 = hook (≤12 words). Final slide = takeaway + soft ask.
- Each slide must reference one concrete detail from the source. No filler slides.
- design_note is for the user to know what visual treatment to apply (e.g.
  "Number callout", "Code snippet", "Quote pull", "Diagram of X").
- Caption = a 1-paragraph hook into the carousel; ends with the citation line.
- Return only the JSON.
