# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repo is **pre-build**. It contains:

- `trace_spec.md` — the canonical product spec (source of truth).
- `TRACE_SPEC_F14_F15_PATCH.md` — historical patch document for F14 (Voice-First) and F15 (AI Compute Economics); already merged into `trace_spec.md`. Treat it as archival.
- `IMPLEMENTATION_PLAN.md` — the segmented Phase 1 build plan. **Read this first** before starting any code work; it defines 28 atomic, independently-completable segments. The status table at the bottom tracks progress.
- `AGENTS.md` — contributor guide.

When `IMPLEMENTATION_PLAN.md` and `trace_spec.md` disagree, the spec wins — update the plan, not the build.

## Product being designed: Trace

Trace is an AI-native content product for builders, founders, and solopreneurs. It runs a Weekly Check-In, generates a narrative plan, and produces posts ("anchor" + "supporting") in the user's voice. The user is Vismay Rathod (sole founder; the spec lists him as author).

## Architectural decisions encoded in the spec

When extending the spec or eventually implementing it, the following load-bearing decisions are already made — do not relitigate them without explicit user direction:

- **Voice-first interaction (F14).** The default for every AI interview (Weekly Check-In, Strategy Doc onboarding, Low-Signal follow-ups) is voice. Text is the fallback. Phase 1 uses the browser **Web Speech API** (`SpeechRecognition` / `SpeechSynthesis`) — no API key, no backend STT cost. Firefox falls back to text. The transcript is shown live and is **user-editable before submission**; only the corrected transcript is stored. Backend treats voice and text input identically (plain text in the existing `weekly_checkins.answers` JSONB column, plus an `input_mode` column).

- **Three-tier AI cost model (F15).** Every AI call is classified Tier 1 (frontier — final content generation, voice matching), Tier 2 (mid — narrative plans, story extraction), or Tier 3 (small — classification, signal assessment, transcript cleanup). Routing the wrong tier is treated as a bug, not a style choice.

- **OpenRouter is the routing layer** for Phase 1 and 2. Trace is provider-agnostic by construction — prompt templates must work across at least two providers (Claude, OpenAI, Gemini). Do **not** bake in Claude-specific XML tag conventions unless a task is pinned to Claude.

- **Per-user weekly AI budgets with graceful degradation.** When the budget is exhausted, the user sees a clear "credits used, reset Monday" message and can still complete check-ins / upload sources. Never silently fail, silently downgrade the model, or queue without telling the user.

- **Aggressive caching is part of the architecture, not an optimization.** Strategy Doc analysis, voice calibration scoring, and pillar definitions are cached until the underlying inputs change. Story-seed extraction and check-in processing are **batched** into single calls. The bootstrap budget math (~28 requests per user per full weekly cycle, OpenRouter free tier = 50/day) only works if these are honored.

- **Pricing rule:** subscription price ≥ 3× expected AI cost per user. The cost reference table in the spec's Appendix G is approximate (April 2026) — actual costs come from OpenRouter billing, not hardcoded constants.

## New schema introduced by this patch

If/when the database is built, these are the additions called out:

- `weekly_checkins.input_mode VARCHAR(10) DEFAULT 'text'` — `'text'` or `'voice'`.
- `ai_usage_log` — per-call record (user, task_type, cost_tier, model, tokens, estimated_cost_usd, cached, created_at).
- `ai_budgets` — per-user per-billing-period limits and counters for Tier 1/2/3 requests.
- API surface: `GET /api/ai/budget`, `GET /api/ai/usage`, `GET /api/admin/ai/costs`, `POST /api/admin/ai/routing`.

Full DDL lives in section "F15 → Database Changes" of the patch file.

## Working in this repo

- Spec edits go into existing markdown — do not create parallel documents or split the patch unless asked.
- Section numbering in the patch mirrors the parent `TRACE_SPEC.md`. Preserve that mapping when editing so the patch can still be applied cleanly.
- The patch's "Phase 1 / Phase 2 / Phase 3" labels are the canonical roadmap buckets. New features should be slotted into one of those phases, not introduced as a separate timeline.
- When eventually scaffolding code: the deployment target implied by the session context is Vercel (Next.js App Router, AI SDK), but this is **not** committed to in the spec — confirm with the user before assuming a stack.
