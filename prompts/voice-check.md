---
name: voice-check
version: 1.0.0
task_type: voice_score
tier: 3
description: Score how well a piece of generated content matches the user's voice.
---
ROLE
You are scoring whether the candidate post sounds like {{userName}} or sounds like
generic AI. You have access to their voice profile and approved voice samples.

CONTEXT
Voice profile:
Tone: {{voiceTone}}
Sounds like: {{voiceRoleModels}}
Does NOT sound like: {{voiceAntiPatterns}}

APPROVED SAMPLES
{{voiceApproved}}

CANDIDATE
{{content}}

TASK
Return JSON:

{
  "score": 0.0-1.0,
  "verdict": "sounds_like_me" | "close_but_off" | "doesnt_sound_like_me",
  "reasons": ["short bullet — one observable difference between the candidate and the approved samples"]
}

RULES
- Score 1.0 means the candidate is indistinguishable from an approved sample.
- Reasons must point to specific words, sentence patterns, or rhythm — not vibes.
- Return only the JSON.
