# Trace — Phase 1 Implementation Plan

## Context

Trace is a content distribution engine for builders. It runs a 30-minute onboarding interview to produce a Personal Brand Strategy Document, then mines the user's real work (uploaded files in Phase 1; GitHub/Drive/Notion in Phase 2) and generates publish-ready content in 4 formats (LinkedIn / Instagram carousel / X thread / Substack) that sound like the user — with hardcoded anti-slop refusals and source citations on every output.

The repo currently contains spec documents only — no code, no `package.json`, no framework. This plan takes the repo from greenfield to a deployable Phase 1 build that satisfies the **Phase 1 Success Criteria** in spec §16:

- 20 beta users with the tool generating content
- 80%+ Strategy Doc satisfaction, 60%+ "sounds like me" rate
- 50%+ check-ins use voice, completion <7 min in voice mode
- AI cost per user per week <$0.50; system fits OpenRouter free tier for ≤10 users
- Time to first approved post <45 min from signup

## Source-of-truth references

- `trace_spec.md` is canonical. When this plan and the spec disagree, the spec wins — update the plan, not the build.
- Spec sections most relevant to each segment are cited inline (e.g. §11 = Tech Stack, §12 = DB Schema, §14 = Prompt Engineering, §16 = Build Phases).

## Architecture decisions (locked, do not relitigate)

1. **Stack:** Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui, Drizzle ORM, Supabase (Postgres + Auth + Storage), NextAuth, Resend, OpenRouter, Vercel hosting. (spec §11)
2. **AI routing:** every LLM call goes through `src/lib/ai/client.ts`. Tier 1 / 2 / 3 task classification is enforced — wrong tier is a bug. OpenRouter for Free/Pro (DeepSeek V3 default), Anthropic direct only for Studio (Phase 3). (spec §F15, §14)
3. **Voice-first:** the default mode for every AI interview is voice (browser Web Speech API). Text is fallback. Firefox falls back to text. (spec §F14)
4. **Per-user budget with graceful degradation:** budget exhausted = clear UX message + ability to keep doing non-AI actions. Never silently fail or downgrade the model. (spec §F15)
5. **Anti-slop is non-negotiable:** every generation output is filtered against the banned-pattern list and the post-gen slop detector runs up to 3 regen retries. (spec §6)
6. **Source citation is non-negotiable:** every generated piece displays its origin. (spec §1)
7. **Caching is architecture, not optimization:** Strategy Doc analysis, voice calibration, pillar definitions, product-stage classification, and dedup history are cached per spec §F15. The cache key always includes `user_id + content_hash`.
8. **No embeddings in Phase 1:** ≤10 files per user, pass chunks directly to LLM. pgvector is Phase 2.
9. **No async queue in Phase 1:** synchronous API routes with loading states. BullMQ + Redis arrives in Phase 2 with integrations.
10. **Provider-portable prompts:** no Claude XML tags in shared prompts. Use ROLE / CONTEXT / TASK / RULES headers. Tier 3 prompts ≤2K tokens, Tier 2 ≤4K, Tier 1 ≤8K. (spec §14)

## How to execute this plan

**One segment per session.** Each segment is independently completable — finishing it leaves the codebase in a working, committable state. If a session runs out of tokens mid-segment, restart that segment from scratch; never leave a segment half-done.

**Each segment has:**
- **Goal** — one-line outcome
- **Touches** — files created/modified
- **Depends on** — prior segments that must be complete
- **Build** — concrete tasks
- **Verify** — how to confirm done before moving on
- **Effort** — XS (≤1 hr) / S (1–3 hr) / M (3–6 hr) / L (1–2 days)

**Don't skip Verify.** A segment is not done until its verification passes. If verification reveals a missing piece, finish it inside that segment — don't push it forward.

**Track progress at the bottom of this file** in the Segment Status table — flip each row to ✅ as it completes, with the date and a one-line note.

## Phase 1 segments (28 total)

---

### Segment 0 — Repo bootstrap [XS]

- **Goal:** A blank but runnable Next.js 14 + TypeScript + Tailwind + shadcn/ui project with the directory layout in spec §Appendix D.
- **Touches:** `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc`, `.prettierrc`, `.env.example`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx` (placeholder), `src/components/ui/` (shadcn init), `drizzle.config.ts`, `prompts/` (empty), folder skeletons under `src/lib/{ai,integrations,db,auth,utils}`, `src/hooks/`, `src/types/`, `workers/` (empty), `scripts/` (empty).
- **Depends on:** none
- **Build:**
  1. `pnpm create next-app@latest .` — App Router, TS, Tailwind, ESLint, src dir, no Turbopack-only weirdness, import alias `@/*`.
  2. `pnpm dlx shadcn@latest init` — Slate base color, CSS vars, RSC.
  3. Install: `drizzle-orm`, `drizzle-kit`, `postgres`, `@supabase/supabase-js`, `@supabase/ssr`, `next-auth@beta`, `@auth/drizzle-adapter`, `zod`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`, `zustand`, `resend`.
  4. Dev: `vitest`, `@playwright/test`, `tsx`, `prettier`, `eslint-plugin-tailwindcss`.
  5. `.env.example` from spec §Appendix E (Phase 1 block only).
  6. Initialize git if not already a repo.
- **Verify:** `pnpm dev` boots, `http://localhost:3000` shows the placeholder; `pnpm lint` and `pnpm tsc --noEmit` pass clean; `pnpm vitest run` runs zero tests cleanly.

---

### Segment 1 — Drizzle schema + initial migration [S]

- **Goal:** All Phase 1 tables defined in Drizzle, first migration applied to a Supabase Postgres instance.
- **Touches:** `src/lib/db/schema.ts`, `src/lib/db/index.ts`, `drizzle.config.ts`, `drizzle/migrations/0000_init.sql`.
- **Depends on:** Segment 0
- **Build:** translate spec §12 SQL to Drizzle for: `users`, `strategy_docs`, `interview_sessions`, `source_connections` (defined now, used Phase 2), `source_chunks` (without `content_embedding` column in Phase 1 — add the migration in Phase 2), `story_seeds` (including the F13 alter columns: `source_mode`, `weekly_checkin_id`, `narrative_plan_id`, `story_type`), `generated_content`, `voice_samples`, `content_calendar`, `brands`, `uploaded_files`, `weekly_checkins` (with `input_mode`), `narrative_plans`, `ai_usage_log`, `ai_budgets`. Add all indexes from §12 except the pgvector one. Drizzle relations for FK navigability. `db` client wired to `DATABASE_URL`.
- **Verify:** `pnpm drizzle-kit generate` produces clean SQL with no surprises; `pnpm drizzle-kit migrate` succeeds against a Supabase project; `\dt` in psql shows all tables.

---

### Segment 2 — Auth (NextAuth + Supabase) [M]

- **Goal:** Email/password and GitHub OAuth signup and login work end-to-end. Session is available in Server Components and route handlers.
- **Touches:** `src/lib/auth/options.ts`, `src/lib/auth/index.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/(auth)/layout.tsx`, `src/components/auth/auth-form.tsx`.
- **Depends on:** Segment 1
- **Build:** NextAuth v5 with Drizzle adapter; providers: Credentials (bcrypt-hashed passwords stored on `users.password_hash`) and GitHub. Wire callbacks to populate `users.tier='free'` and `users.avatar_url` on first sign-in. Middleware protects everything except `/`, `/login`, `/signup`, `/api/auth/*`. Auth helper `auth()` for server components.
- **Verify:** sign up via email → redirected to `/dashboard` placeholder; sign up via GitHub → same; logout works; protected routes redirect to `/login` when unauthenticated.

---

### Segment 3 — AI client + tier router + usage logging [M]

- **Goal:** A single `callAI({ taskType, tier, userId, messages, ...opts })` function that routes to the right model, logs to `ai_usage_log`, and is the only path LLM calls take.
- **Touches:** `src/lib/ai/client.ts`, `src/lib/ai/models.ts`, `src/lib/ai/types.ts`, `src/lib/ai/usage.ts`, `src/lib/ai/__tests__/client.test.ts`.
- **Depends on:** Segment 1
- **Build:**
  - `models.ts` — config for DeepSeek V3, Qwen 3, Llama 4 Maverick, Gemini 2.5 Flash on OpenRouter. Each entry has `{ id, tier, contextWindow, inputCostPerMTok, outputCostPerMTok }`.
  - Task type enum mapping each task to its tier (per spec §F15 table): `content_generation` (1), `anchor_story` (1), `strategy_doc` (1), `narrative_plan` (2), `story_extraction` (2), `pillar_mapping` (2), `interview_followup` (3), `checkin_followup` (3), `signal_assessment` (3), `stage_classification` (3), `slop_check` (3), `voice_score` (3), `transcript_cleanup` (3).
  - `client.ts` — fetch against `https://openrouter.ai/api/v1/chat/completions`, OpenAI-compatible. Returns `{ content, inputTokens, outputTokens, modelUsed, costUsd }`.
  - `usage.ts` — inserts a row into `ai_usage_log` after every call (success or failure), including `cached: false`.
  - Unit test stubs the fetch and asserts the right model is selected for each tier.
- **Verify:** the test passes; a manual script `pnpm tsx scripts/ai-smoke.ts` makes one Tier 3 call and one row appears in `ai_usage_log`.

---

### Segment 4 — AI budget enforcement [S]

- **Goal:** Every `callAI` call is gated by a per-user weekly budget. Exhausted budget returns a typed error that the UI knows how to render.
- **Touches:** `src/lib/ai/budget.ts`, `src/lib/ai/client.ts` (wire-in), `src/app/api/ai/budget/route.ts`, `src/app/api/ai/usage/route.ts`, on-signup hook in auth callbacks.
- **Depends on:** Segments 2, 3
- **Build:**
  - On user creation, insert an `ai_budgets` row with the current Mon→Sun period and tier-appropriate limits. Phase 1 free tier: tier1=5, tier2=8, tier3=20 per week (sized for 3 posts/week + 1 plan + 1 check-in + slop checks; aligned with spec §F15 Phase 1 budget).
  - `checkAndDecrement(userId, tier)` — atomic update; returns `{ ok: true }` or throws `BudgetExhaustedError`.
  - `client.ts` calls `checkAndDecrement` before the API call, restores on transport failure (so we don't bill users for our own bugs).
  - Weekly rollover: a `getOrCreateBudget(userId)` lazily creates the next-period row on first call after Sunday. (No cron needed in Phase 1.)
  - `/api/ai/budget` GET returns `{ tier1: {used, limit}, tier2: {...}, tier3: {...}, periodEnd }`.
  - `/api/ai/usage` GET returns the current period's `ai_usage_log` rows.
- **Verify:** vitest test exhausts a fake user's tier3 budget and asserts the next call throws; `/api/ai/budget` returns sane numbers after a few real calls.

---

### Segment 5 — Cache layer (DB-backed) [S]

- **Goal:** A `getCached(key, ttl, fn)` helper that stores results in a `cache_entries` table (created in this segment) keyed by `userId + contentHash`. Used by Strategy Doc analysis, voice score, pillar defs, product-stage classification.
- **Touches:** new migration adding `cache_entries` table (id, user_id, namespace, key_hash, value JSONB, expires_at), `src/lib/cache/index.ts`, `src/lib/cache/__tests__/cache.test.ts`.
- **Depends on:** Segment 1
- **Build:** namespace + sha256(input)→key. `expires_at = now + ttl` or null for "until invalidated." Invalidation API: `invalidateNamespace(userId, namespace)`. Wrap `callAI` callers (not `callAI` itself) so the AI client stays single-purpose.
- **Verify:** test that calls a fake-`fn` once, calls again with same input, and asserts `fn` ran once. Same call across users keys differently. Expired entry re-runs.

---

### Segment 6 — Prompt templates + anti-slop banned patterns [S]

- **Goal:** All Phase 1 prompts live as versioned `.md` files in `prompts/`, plus a typed loader that templates them with placeholders. Anti-slop banned-pattern list in TypeScript so it can be both injected into prompts and used as a programmatic checker.
- **Touches:** `prompts/strategy-generation.md`, `prompts/interview-followup.md`, `prompts/story-extraction.md`, `prompts/content-linkedin.md`, `prompts/content-instagram.md`, `prompts/content-x-thread.md`, `prompts/content-substack.md`, `prompts/slop-detector.md`, `prompts/voice-check.md`, `prompts/weekly-narrative-planner.md`, `prompts/low-signal-followup.md`, `prompts/signal-assessment.md`, `prompts/sample-posts.md`, `src/lib/ai/anti-slop.ts`, `src/lib/ai/prompts.ts`.
- **Depends on:** Segment 0
- **Build:** each prompt has YAML frontmatter `version: 1.0.0` and `task_type:`. Loader: `loadPrompt(name, vars)` parses frontmatter, substitutes `{{var}}` placeholders, returns `{ system, version }`. `anti-slop.ts` exports `BANNED_PATTERNS` (array of `{ category, pattern, regex? }` from spec §6) and a `containsSlop(text): SlopViolation[]` regex check (cheap pre-filter before the LLM slop detector).
- **Verify:** `loadPrompt('content-linkedin', { strategyDoc: '...', voiceProfile: '...', source: '...' })` returns a fully-substituted system prompt; `containsSlop("Hot take: ...")` returns a violation.

---

### Segment 7 — Anti-slop runtime (regex pre-filter + LLM detector + retry loop) [S]

- **Goal:** A `runAntiSlop(content, context)` that returns `{ pass: true, content }` or `{ pass: false, violations, suggestedFix }`. Generation pipeline retries up to 3 times before flagging for human review.
- **Touches:** `src/lib/ai/slop-check.ts`, `src/lib/ai/__tests__/slop-check.test.ts`.
- **Depends on:** Segments 3, 6
- **Build:** Step 1: regex-based `containsSlop` (zero cost). Step 2: if clean, run the slop detector LLM call (Tier 3) with the prompt from Segment 6. Step 3: if FAIL, return violations + suggested rewrite. Caller decides whether to splice the rewrite or full-regen.
- **Verify:** test cases: "Unpopular opinion: …" caught by regex; subtler slop ("I'm thrilled to announce…") caught by LLM; clean text passes; budget is decremented per LLM call.

---

### Segment 8 — Landing page + waitlist [S]

- **Goal:** Public homepage that converts. Email waitlist captures into a `waitlist_signups` table.
- **Touches:** new migration `waitlist_signups (id, email unique, source, created_at)`, `src/app/page.tsx`, `src/components/landing/{hero,anti-slop-demo,waitlist-form,footer}.tsx`, `src/app/api/waitlist/route.ts`.
- **Depends on:** Segment 1
- **Build:** Hero ("You ship code. Trace ships your story."), anti-slop demo section listing banned patterns from `BANNED_PATTERNS`, email form, social proof placeholder. Form validates with Zod, posts to `/api/waitlist`, dedupe on email. Resend a transactional "you're on the list" email.
- **Verify:** submit the form, see the row in `waitlist_signups`, receive the confirmation email.

---

### Segment 9 — Onboarding interview (text mode) [M]

- **Goal:** Authenticated users can complete the 5-section, 19-question interview from spec §4. Answers persist to `interview_sessions`. Save-and-resume works.
- **Touches:** `src/app/onboarding/page.tsx`, `src/app/onboarding/_components/{question-card,section-progress,interview-chat}.tsx`, `src/app/api/interview/route.ts`, `src/app/api/interview/answer/route.ts`, `src/app/api/interview/complete/route.ts`, `src/app/api/interview/progress/route.ts`, `src/lib/interview/questions.ts` (the canonical question list), `src/lib/interview/followup.ts` (Tier 3 follow-up generator).
- **Depends on:** Segments 2, 3, 4, 6
- **Build:**
  - `questions.ts` — array of `{ id, section, prompt, allowFollowUp }` from spec §4 Sections 1–5.
  - Chat-style UI: each turn shows the question, an input, and (after submit) the AI's optional follow-up before moving on. If the answer is short or vague, ask one deeper follow-up; else move on. Use `interview-followup` prompt.
  - `POST /api/interview/answer` writes to `interview_sessions.answers[qid]`, returns the next question or follow-up.
  - `POST /api/interview/complete` marks `is_complete=true`; does NOT generate the Strategy Doc here (Segment 11).
  - Section progress shows "Section 2 of 5 — Expertise & Opinions."
- **Verify:** start interview, answer 3 questions, refresh page → resumes from question 4. Complete it → row marked complete, redirects to a "Generating your Strategy…" placeholder.

---

### Segment 10 — Voice input via Web Speech API (reusable hook + components) [M]

- **Goal:** A `useVoiceInput()` hook + `<MicButton>` + `<LiveTranscript>` components that any chat-style screen can drop in. Firefox falls back to text with the message in spec §F14.
- **Touches:** `src/hooks/use-voice-input.ts`, `src/hooks/use-tts.ts`, `src/components/voice/{mic-button,live-transcript,mode-toggle,unsupported-browser-banner}.tsx`, integrate into the interview screen from Segment 9.
- **Depends on:** Segment 9
- **Build:**
  - `useVoiceInput()` wraps `window.SpeechRecognition` (with `webkit` prefix fallback). Returns `{ start, stop, isListening, transcript, interimTranscript, error, supported }`.
  - Auto-stop on 2.5s silence; manual stop via mic button toggle; transcript editable before submit per spec §F14 UX requirements.
  - `useTTS()` wraps `SpeechSynthesis` for optional read-aloud of AI follow-ups; off by default in Phase 1.
  - Mode toggle persists in `localStorage` (`trace.input_mode`).
  - Voice is the default mode in the interview when supported; the "I'd rather type" link is always visible.
- **Verify:** Chrome → can speak an answer, see real-time transcript, edit it, submit. Firefox → shows fallback banner and goes straight to text input.

---

### Segment 11 — Strategy Doc generation + view + edit [M]

- **Goal:** Completed interview → cached Tier 1 generation → rendered Strategy Doc that the user can edit section by section. PDF download works.
- **Touches:** `src/app/strategy/page.tsx`, `src/app/strategy/_components/{strategy-section,edit-section-dialog,regenerate-button}.tsx`, `src/app/api/strategy/route.ts` (GET/PUT), `src/app/api/strategy/generate/route.ts` (POST, called once after interview), `src/app/api/strategy/regenerate/route.ts`, `src/app/api/strategy/pdf/route.ts`, `src/lib/strategy/generate.ts`, `src/lib/strategy/pdf.ts`.
- **Depends on:** Segments 3, 4, 5, 6, 9
- **Build:**
  - Generation prompt loads `strategy-generation.md` with the full interview answers, anti-slop rules, voice-bans list. Tier 1 call. Result parsed into the structured fields of `strategy_docs` (positioning_statement, pillars 1–3, contrarian_takes, origin_story, target_audience, outcome_goal, voice_profile, posting_cadence). Cached under namespace `strategy_doc_generation`, key=hash(answers); invalidates on user save.
  - Render: 8 sections per spec §4 with inline edit (modal with textarea, save → updates row, bumps `version`).
  - "Regenerate this section" passes `additional_context` to the LLM; only that section is updated.
  - PDF: render the doc to HTML server-side and use `@react-pdf/renderer` or `puppeteer` to produce a PDF. Lightweight choice — `@react-pdf/renderer` (no headless browser).
- **Verify:** finishing the interview triggers Strategy Doc generation; the doc renders cleanly; editing a pillar persists and shows on reload; PDF download produces a readable file.

---

### Segment 12 — File upload (manual, ≤10 files/user) [S]

- **Goal:** Users can upload PDF/DOCX/TXT/MD/CSV/JSON files into Supabase Storage. Quota enforced.
- **Touches:** `src/app/sources/page.tsx`, `src/app/sources/_components/{upload-zone,file-list}.tsx`, `src/app/api/uploads/route.ts` (POST + GET), `src/app/api/uploads/[id]/route.ts` (DELETE + GET), `src/lib/storage/supabase.ts`.
- **Depends on:** Segments 1, 2
- **Build:** drag-drop dropzone, multipart POST, server-side type validation by extension + magic bytes, write to bucket `sources/{userId}/{uuid}.{ext}`, insert `uploaded_files` row with `processing_status='pending'`. Reject if user has ≥10 active rows. Delete cascades chunks (no chunks yet → no-op until Segment 13).
- **Verify:** upload a PDF and a DOCX, see them listed; uploading 11th is rejected with a clear message; delete removes both row and storage object.

---

### Segment 13 — File parsing + chunking [S]

- **Goal:** Each uploaded file is parsed and chunked into `source_chunks` rows. No embeddings (spec §11).
- **Touches:** `src/lib/integrations/parser.ts`, `src/lib/integrations/chunker.ts`, `src/app/api/uploads/[id]/process/route.ts`, called inline from Segment 12's upload handler.
- **Depends on:** Segments 1, 12
- **Build:** PDF via `pdf-parse`; DOCX via `mammoth`; TXT/MD as-is; CSV/JSON pretty-printed. Chunker splits to 500–1000 tokens (use `js-tiktoken` for counting) on paragraph boundaries. Each chunk inserts with `source_type='manual_upload'`, `source_reference='file: {filename}'`, `source_date=upload time`, metadata `{ filename, mime, chunkIndex }`. Update `uploaded_files.processing_status='completed'` and `chunk_count`.
- **Verify:** upload a multi-page PDF, see N chunks in `source_chunks` with sensible titles and content.

---

### Segment 14 — Story seed extraction (Content Mine) [M]

- **Goal:** A user with a Strategy Doc and at least one parsed file gets a ranked list of story seeds at `/mine`.
- **Touches:** `src/lib/ai/extract.ts`, `src/app/api/stories/extract/route.ts`, `src/app/api/stories/route.ts` (list), `src/app/api/stories/[id]/route.ts` (GET, PATCH), `src/app/mine/page.tsx`, `src/app/mine/_components/{story-card,filters}.tsx`.
- **Depends on:** Segments 3, 4, 5, 11, 13
- **Build:** Tier 2 batch call — pass all chunks for the user along with their pillars in a single prompt, return JSON list of `{ title, summary, source_chunk_id, pillar_match, relevance_score, source_citation, story_type }`. Persist to `story_seeds` with `source_mode='source_mining'`. Source citation format: `Based on {source_reference}, {month year}`. Pillar match against the 3 pillars from `strategy_docs`; if none match strongly, flag as `pillar_match='unmapped'`.
- **Verify:** uploading 3 files of substantive content produces ≥5 story seeds with sensible titles, mapped to the right pillars; `/mine` shows them ranked; filter by pillar works.

---

### Segment 15 — Content generation: LinkedIn format (the reference implementation) [M]

- **Goal:** From a story seed, generate a LinkedIn long-form post with 3 hook variants, source citation, and anti-slop validation. This is the reference for the other 3 formats.
- **Touches:** `src/lib/ai/generate.ts`, `src/lib/ai/orchestrate.ts`, `src/app/api/generate/route.ts`, `src/app/api/generate/[jobId]/route.ts`, `src/lib/voice/few-shot.ts`.
- **Depends on:** Segments 3, 4, 5, 6, 7, 11, 14
- **Build:**
  - Pipeline: load Strategy Doc → load voice samples (top 5 approved + 3 rejected from Segment 18; empty in early Phase 1) → load source chunk → load anti-slop → load `content-linkedin` prompt → Tier 1 call → run `runAntiSlop` → if fail, regen up to 3x → on 3rd failure, mark `generated_content.status='draft'` with a `slop_review_needed` flag.
  - 3 hook variants: ask the model for `{ hooks: [3 strings], body: ..., citation: ... }` JSON.
  - Synchronous in Phase 1: `POST /api/generate` returns `{ content_id }` after waiting for the call (loading state shown in UI). Job-id pattern stubbed for Phase 2 swap-in.
- **Verify:** click "Generate" on a story seed, get a LinkedIn post with 3 hooks and a real source citation; deliberately ask for slop ("write me a hot take post") and verify regen kicks in.

---

### Segment 16 — Content generation: Instagram, X thread, Substack [M]

- **Goal:** Same orchestration as Segment 15, three more formats.
- **Touches:** `src/lib/ai/generate.ts` (extend), prompt files already created in Segment 6.
- **Depends on:** Segment 15
- **Build:**
  - Instagram carousel: returns `content` with summary + `content_metadata.slides: [{ index, text, design_note }]` (8–10 slides per spec §8).
  - X thread: returns `content` (full thread for copy-paste) + `content_metadata.tweets: [{ index, text }]` (each ≤280 chars, 6–10 tweets).
  - Substack: long-form, 800–1500 words. Title and subtitle in `content_metadata`.
  - Each format applies anti-slop before persisting.
  - `POST /api/generate` body accepts `formats: string[]`; returns one `generated_content` row per format.
- **Verify:** for one story seed, generate all 4 formats; X thread tweets are all ≤280 chars; carousel has 8–10 slides; Substack draft is in the word range.

---

### Segment 17 — Content editor UI (multi-format, hook variants, edit, copy) [M]

- **Goal:** `/content/[id]` shows a single piece with format tabs, hook variants, inline editing, status changes, and copy-to-clipboard.
- **Touches:** `src/app/content/page.tsx` (list), `src/app/content/[id]/page.tsx`, `src/app/content/[id]/_components/{format-tabs,hook-picker,inline-editor,carousel-preview,thread-preview,citation-line,actions-bar}.tsx`, `src/app/api/content/route.ts` (list + filter), `src/app/api/content/[id]/route.ts` (GET, PUT, DELETE), `src/app/api/content/[id]/regenerate/route.ts`.
- **Depends on:** Segments 15, 16
- **Build:**
  - Tabs across the 4 formats; switching tabs swaps the visible row.
  - Hook variant picker: 3 buttons; selecting one updates `generated_content.hook_variant`.
  - Inline edit via Tiptap for LinkedIn/Substack; the carousel and thread editors are slide-by-slide / tweet-by-tweet textareas. Edits go to `generated_content.edited_content`; original text is kept.
  - Action bar: Approve / Reject / Regenerate (with optional guidance prompt) / Copy. Approve sets `status='approved'`; copy reads `edited_content || content`.
  - Source citation line is always rendered, never editable.
- **Verify:** flow from `/mine` → click seed → generate all 4 → switch formats → edit → pick hook 2 → approve → copy gives the edited text; regeneration with guidance produces a different output.

---

### Segment 18 — Voice calibration loop [S]

- **Goal:** Users mark each piece as "sounds like me" / "doesn't" / "close but edited." Feedback feeds the few-shot examples in Segment 15's prompt assembly.
- **Touches:** `src/components/voice/feedback-buttons.tsx`, `src/app/api/voice/feedback/route.ts`, `src/app/api/voice/score/route.ts`, `src/app/api/voice/samples/route.ts`, `src/lib/voice/score.ts`, `src/lib/voice/few-shot.ts` (already stubbed in Segment 15 — fill in here).
- **Depends on:** Segment 17
- **Build:** Feedback buttons on every content card. POST writes `voice_samples` row + updates `generated_content.voice_feedback`. If status is `close_but_edited`, capture the diff between `content` and `edited_content`. Voice score = approved / total. `getFewShotExamples(userId, n)` returns top N approved + bottom M rejected for prompt injection. Cached under `voice_few_shot` namespace; invalidated on new feedback.
- **Verify:** mark 5 pieces, voice score updates; subsequent generation prompt (visible via debug log) includes the few-shot block.

---

### Segment 19 — Sample posts for free tier (the "Aha" moment) [S]

- **Goal:** Right after Strategy Doc generation, produce 5 sample posts derived from interview answers — no source data required. Drives free→paid conversion.
- **Touches:** `src/app/api/generate/sample/route.ts`, `src/app/strategy/_components/sample-reveal.tsx`, post-Strategy redirect logic.
- **Depends on:** Segments 11, 15, 16
- **Build:** Generate 5 posts (mix of formats: 2 LinkedIn, 1 X thread, 1 Instagram, 1 Substack short) using interview answers as the "source." Source citation: "Based on your interview answer about {topic}." Stored as regular `generated_content` rows with `story_seed_id=null` and a marker in metadata. After Strategy Doc reveal, samples appear under "What your content could look like."
- **Verify:** complete onboarding → see Strategy Doc → see 5 sample posts that genuinely vary in topic and reference real things from the interview.

---

### Segment 20 — Weekly Check-In (text mode end-to-end) [M]

- **Goal:** `/weekly` route lets the user start a weekly check-in, answer the 7 default questions with adaptive follow-ups, and submit.
- **Touches:** `src/app/weekly/page.tsx`, `src/app/weekly/_components/{checkin-chat,question-card,signal-banner,session-summary}.tsx`, `src/app/api/checkins/current/route.ts`, `src/app/api/checkins/answer/route.ts`, `src/app/api/checkins/complete/route.ts`, `src/app/api/checkins/history/route.ts`, `src/app/api/checkins/[id]/route.ts`, `src/lib/checkin/questions.ts`, `src/lib/checkin/followup.ts`.
- **Depends on:** Segments 3, 4, 6, 9
- **Build:**
  - Default questions = the 7 from spec §F13.
  - Adaptive follow-ups: Tier 3 batched call — after each answer, ask the LLM (`checkin-followup` prompt) whether to follow up; max 3–4 follow-ups per check-in. Per spec §F15 batching: store all answers, run one batched follow-up generation pass at most.
  - `weekly_checkins.input_mode='text'` here; voice mode added in Segment 21.
  - Session summary screen at the end with "Edit any answer" before "Generate my weekly plan."
- **Verify:** answer 7 questions, get appropriate follow-ups on the vague ones, submit, row stored.

---

### Segment 21 — Voice mode for weekly check-in [S]

- **Goal:** Drop in the voice components from Segment 10 onto the check-in. Voice is default. No question numbering, no progress bar, per spec §F14 anti-friction rules.
- **Touches:** `src/app/weekly/_components/checkin-chat.tsx` (extend), `src/app/api/checkins/answer/route.ts` (accept `input_mode`).
- **Depends on:** Segments 10, 20
- **Build:** Reuse `<MicButton>`, `<LiveTranscript>`, `<ModeToggle>`. Mark `input_mode='voice'` on the parent row when any answer was submitted in voice mode (the spec stores it per check-in, not per answer). Read-aloud toggle for follow-ups (off by default).
- **Verify:** complete a check-in entirely by voice in Chrome; `weekly_checkins.input_mode='voice'`; switching mid-session works; Firefox falls back.

---

### Segment 22 — Signal assessment + product stage classification (one combined Tier 3 call) [S]

- **Goal:** Decide whether the user is in `source_mining` or `low_signal` mode and classify their `product_stage` (building/launching/operating/scaling). Cached for 1 week. Per spec §F15 batching: combine into one call.
- **Touches:** `src/lib/ai/signal.ts`, `src/app/api/signal/status/route.ts`.
- **Depends on:** Segments 3, 5, 13, 14
- **Build:** Inputs: count of new chunks in last 7 days, count of new story seeds, last check-in summary, last narrative plan summary. Tier 3 prompt returns JSON `{ mode, artifacts_found, stories_found, product_stage, recommendation }`. Cache namespace `signal_status`, TTL 7 days, invalidates on new check-in or new chunks.
- **Verify:** with 0 new chunks → `low_signal` + appropriate message; with ≥3 fresh chunks → `source_mining`. `product_stage` classification reasonable on a user fixture.

---

### Segment 23 — Weekly Narrative Planner [M]

- **Goal:** Given Strategy Doc + check-in answers + signal status + recent content history, produce a `narrative_plans` row with main theme, anchor story, supporting posts, proof assets, pillar balance, source notes.
- **Touches:** `src/lib/ai/narrative.ts`, `src/app/api/narrative/current/route.ts`, `src/app/api/narrative/generate/route.ts`, `src/app/api/narrative/[id]/route.ts`, `src/app/api/narrative/[id]/approve/route.ts`, `src/app/api/narrative/history/route.ts`, `src/app/weekly/_components/narrative-plan.tsx`.
- **Depends on:** Segments 11, 14, 18, 20, 22
- **Build:** Single Tier 2 call using `weekly-narrative-planner.md` prompt. Inputs assembled per spec §14 prompt template. JSON-schema'd output (zod) for the narrative plan structure. Persist to `narrative_plans`. UI shows the plan with edit-each-section affordance + "Approve" + "Convert recommended posts to story seeds" button (Segment 24).
- **Verify:** completed check-in → `Generate plan` → coherent plan grounded in the check-in answers; every recommended post has a `source_note` referencing a check-in answer or a recent artifact.

---

### Segment 24 — Plan-to-stories conversion + content gen wiring [S]

- **Goal:** Approving a narrative plan creates `story_seeds` rows (with `source_mode='narrative_plan'`, `narrative_plan_id` set, `weekly_checkin_id` set, appropriate `story_type`) so the existing content-generation pipeline (Segments 15–17) can produce posts from them.
- **Touches:** `src/app/api/narrative/[id]/create-stories/route.ts`, `src/app/weekly/_components/narrative-plan.tsx` (extend with selection UI).
- **Depends on:** Segments 14, 23
- **Build:** UI lets the user pick which recommended posts to promote; each becomes a story seed with title, summary, pillar match, source_citation = "Based on your weekly founder check-in, Week of {date}" or the underlying chunk reference if the plan tied it to one.
- **Verify:** approve plan → check `story_seeds` table → click through to `/mine` → generate content from one → flow completes end-to-end from check-in to LinkedIn post.

---

### Segment 25 — Low-Signal Mode (focused 3–5 follow-ups tied to small artifacts) [S]

- **Goal:** When `signal.mode === 'low_signal'`, the check-in opens with a banner referencing the actual small signals ("You had 1 meaningful commit this week: 'fix onboarding copy'") and asks 3–5 specifically derived questions instead of the 7 generic ones.
- **Touches:** `src/app/weekly/_components/signal-banner.tsx`, `src/app/weekly/_components/checkin-chat.tsx` (branch behavior), `src/lib/checkin/low-signal-questions.ts`, `src/lib/ai/low-signal.ts`.
- **Depends on:** Segments 20, 22
- **Build:** When signal is low, generate 3–5 focused questions using the `low-signal-followup.md` prompt (Tier 3) referencing the actual small artifacts. Show banner with the spec §F13 example UI copy. Falls back gracefully if there are zero artifacts (asks the 7 default questions).
- **Verify:** with 1 commit and 0 docs in the last 7 days, the check-in opens with the contextual banner and 3 questions clearly tied to the commit.

---

### Segment 26 — Dashboard + AI budget indicator [S]

- **Goal:** `/dashboard` shows weekly status: posts generated/approved/published, voice score, pillar balance, recent activity, AI budget usage.
- **Touches:** `src/app/dashboard/page.tsx`, `src/app/dashboard/_components/{stats-grid,pillar-balance-chart,activity-feed,budget-indicator}.tsx`, `src/app/api/dashboard/stats/route.ts`, `src/app/api/dashboard/pillars/route.ts`, `src/app/api/dashboard/activity/route.ts`.
- **Depends on:** Segments 4, 11, 14, 17, 18
- **Build:** stats from `generated_content` + `voice_samples` aggregates. Pie chart with a small lightweight charting lib (`recharts`). Activity feed = last 20 events across `generated_content`, `weekly_checkins`, `narrative_plans`. Budget indicator: simple "Tier 1: 3/5 used this week" rows; warn at 80%; show "Resets {date}." Per spec §18 — non-intrusive sidebar placement.
- **Verify:** after generating 3 posts and one approved, dashboard reflects the right numbers; budget shows correct usage.

---

### Segment 27 — Settings, data deletion, billing placeholder [S]

- **Goal:** `/settings` lets users update profile, see/delete data, and view tier (billing UI is placeholder until Phase 2 Stripe).
- **Touches:** `src/app/settings/page.tsx`, `src/app/settings/_components/{account-form,delete-account-button,integrations-placeholder,tier-card}.tsx`, `src/app/api/account/route.ts`, `src/app/api/account/delete/route.ts`.
- **Depends on:** Segment 2
- **Build:** Profile edit (name, email). Hard-delete user with cascading FKs (verified by `ON DELETE CASCADE` in schema). Confirmation dialog requiring typed email. Integration cards present but disabled with "Phase 2." Tier card shows "Free" and a "Get Pro" placeholder button.
- **Verify:** edit name persists; delete account wipes the user and all dependent rows; can re-sign-up with the same email after.

---

### Segment 28 — Phase 1 polish, tests, deploy [M]

- **Goal:** Phase 1 is shippable. Golden-path E2E test passes. App is deployed to Vercel + Supabase production.
- **Touches:** `playwright.config.ts`, `e2e/golden-path.spec.ts`, additional vitest tests for AI router / budget / slop / signal / extract, `vercel.json` if needed, README with run commands.
- **Depends on:** all prior segments
- **Build:**
  - **Golden path E2E:** signup → onboarding → strategy doc → upload 3 files → see story seeds → generate LinkedIn post → mark "sounds like me" → start weekly check-in (text — voice is hard to E2E) → generate narrative plan → approve plan → generate post from plan → copy to clipboard.
  - Unit tests for: tier router model selection, budget exhaustion, anti-slop regex catches, narrative plan zod parse, signal mode decision boundaries.
  - Vercel deploy with all Phase 1 env vars; Supabase production project configured; Resend production API key.
  - Verify Phase 1 success criteria from spec §16: AI cost <$0.50/user/week (check `ai_usage_log` aggregates after dogfooding); voice mode works in Chrome and Safari; check-in completion <7 min.
- **Verify:** E2E green; production URL serves a working signup flow; Vismay can complete the full flow as the first beta user.

---

## Phase 2 outline (~Weeks 7–12, segments 29–37) — to be re-planned in detail when Phase 1 ships

Detailed Phase 2 execution now lives in `PHASE_2_IMPLEMENTATION_PLAN.md`.
Phase 2 segments should be implemented and verified against that document.

29. **Stripe + Pro tier** — paywall after Strategy Doc, $39/mo, webhook reconciliation.
30. **GitHub integration** — App OAuth, scan commits/PRs/READMEs/issues, auto-sync, filter bot/merge/dependency commits.
31. **Google Drive integration** — OAuth, folder selector, doc/sheet/slides text extraction.
32. **Notion integration** — OAuth, page selector, content extraction.
33. **Ship-to-Post pipeline** — webhook on new meaningful commit → auto-draft X thread → notify user.
34. **Content calendar** — week/month view, schedule by date+platform, pillar-balance hints.
35. **Async job queue** — Redis + BullMQ for source syncing and bulk generation; replace synchronous generation paths.
36. **pgvector + embeddings** — gate by `source_chunks` count >50 per user; semantic search for dedup against published content.
37. **Hybrid voice (browser STT + cloud TTS)** — OpenAI TTS or ElevenLabs for natural-sounding AI voice; voice quality upgrade.

## Phase 3 outline (~Weeks 13–20, segments 38–44)

38. **Studio tier + Anthropic API** — Claude Sonnet for generation, Haiku for slop check, multi-brand support up to 5.
39. **Multi-brand support** — separate Strategy Doc / voice / sources / calendar per brand, brand switcher.
40. **LinkedIn API publishing** — official API only, no scraping/cookies.
41. **X API publishing** — schedule + auto-publish.
42. **Instagram publishing** — Meta Business Suite API, carousel image generation TBD in Phase 4.
43. **Launch Content Package** — single click → PH listing + X thread + LinkedIn + IG carousel + Reddit + newsletter.
44. **Calendar / Slack / Email / LinkedIn–X scrape integrations** — round out the Phase 3 source list.

## Verification strategy across phases

- **Per segment:** explicit Verify step (already specified above).
- **End of Phase 1:** golden-path E2E + Phase 1 success criteria check (spec §16).
- **Cost guardrail:** every PR that adds an LLM call site must cite the tier and confirm it routes through `callAI`. A grep against `openrouter.ai` outside `src/lib/ai/client.ts` should return zero results.
- **Anti-slop guardrail:** every content-producing endpoint must run `runAntiSlop` before persisting `status` other than `draft`.

## Critical files to know

- `src/lib/ai/client.ts` — single LLM gateway, all calls funnel through here.
- `src/lib/ai/anti-slop.ts` + `prompts/slop-detector.md` — the differentiator.
- `src/lib/db/schema.ts` — Drizzle source of truth; spec §12 is the contract.
- `prompts/*.md` — versioned prompt templates; changes need a changelog entry.
- `src/lib/cache/index.ts` — caching is architecture, used by Strategy Doc, signal, voice score, narrative.
- `src/lib/ai/budget.ts` — budget gate; bypassing it is a bug.

## Open questions (defer until they bite)

1. Strategy Doc PDF library — `@react-pdf/renderer` (no headless browser) vs `puppeteer`. Default to `@react-pdf/renderer` unless layout demands fail.
2. Content editor for carousel/thread — full Tiptap or per-slide textareas. Default to per-slide textareas in Phase 1; revisit if users want richer formatting.
3. Resend free tier (100 emails/day) is sized for transactional only; revisit when waitlist exceeds ~100 confirmations/day.
4. OpenRouter free tier 50/day cap math (spec §F15): 28 reqs/full weekly cycle × 10 users = 280/week, vs 350/week budget. Tight but feasible if cycles spread across the week. Add an admin alert when daily usage >40 to give early warning.

---

## Segment status

Update this table as each segment is completed. Format: ✅ done · 🔄 in progress · ⬜ not started.

| #  | Segment                                                                  | Status | Date completed | Notes |
| -- | ------------------------------------------------------------------------ | ------ | -------------- | ----- |
| 0  | Repo bootstrap                                                           | ✅     | 2026-04-30     | App scaffold, scripts, config, and build-safe local setup verified. |
| 1  | Drizzle schema + initial migration                                       | ✅     | 2026-04-30     | Phase 1 schema/migration present, including upload chunk FK. |
| 2  | Auth (NextAuth + Supabase)                                               | ✅     | 2026-04-30     | Credentials/GitHub auth, signup, middleware, and budget provisioning wired. |
| 3  | AI client + tier router + usage logging                                  | ✅     | 2026-04-30     | Single OpenRouter gateway, tier tests, and usage logging verified. |
| 4  | AI budget enforcement                                                    | ✅     | 2026-04-30     | Budget gate, refunds, budget/usage APIs, and tests verified. |
| 5  | Cache layer (DB-backed)                                                  | ✅     | 2026-04-30     | Cache helper, invalidation, schema, and focused tests verified. |
| 6  | Prompt templates + anti-slop banned patterns                             | ✅     | 2026-04-30     | Prompt files, loader, and anti-slop patterns verified by tests. |
| 7  | Anti-slop runtime                                                        | ✅     | 2026-04-30     | Regex + LLM detector retry loop fixed and tests pass. |
| 8  | Landing page + waitlist                                                  | ✅     | 2026-04-30     | Waitlist table/API/email flow and marketing surface wired. |
| 9  | Onboarding interview (text mode)                                         | ✅     | 2026-04-30     | Interview questions, persistence, follow-ups, progress, and completion routes wired. |
| 10 | Voice input via Web Speech API                                           | ✅     | 2026-04-30     | Voice hook/components integrated with browser fallback. |
| 11 | Strategy Doc generation + view + edit                                    | ✅     | 2026-04-30     | Generation, editable sections, section regen API, samples, and PDF output wired. |
| 12 | File upload                                                              | ✅     | 2026-04-30     | Upload quota, storage, delete, extension + magic-byte checks wired. |
| 13 | File parsing + chunking                                                  | ✅     | 2026-04-30     | Parser/chunker, inline processing, and process route wired. |
| 14 | Story seed extraction (Content Mine)                                     | ✅     | 2026-04-30     | Tier 2 extraction, persistence, ranking UI, and story APIs wired. |
| 15 | Content generation: LinkedIn                                             | ✅     | 2026-04-30     | LinkedIn generation, anti-slop retry, citation, and job-status stub wired. |
| 16 | Content generation: Instagram, X thread, Substack                        | ✅     | 2026-04-30     | All remaining formats wired with structured metadata and validation. |
| 17 | Content editor UI                                                        | ✅     | 2026-04-30     | Multi-format tabs, hooks, edit/save, approve/reject/regenerate/copy wired. |
| 18 | Voice calibration loop                                                   | ✅     | 2026-04-30     | Feedback, score, samples API, few-shot invalidation, and edit summary wired. |
| 19 | Sample posts for free tier ("Aha" moment)                                | ✅     | 2026-04-30     | Strategy-triggered and standalone sample generation route wired. |
| 20 | Weekly Check-In (text mode)                                              | ✅     | 2026-04-30     | Weekly check-in, adaptive follow-ups, completion, history/detail APIs wired. |
| 21 | Voice mode for weekly check-in                                           | ✅     | 2026-04-30     | Voice default polished, input_mode persists across answers/follow-ups, fallback/read-aloud wired. |
| 22 | Signal assessment + product stage classification                         | ✅     | 2026-04-30     | Combined Tier 3 signal/status service, cached API, deterministic fallback, and boundary tests. |
| 23 | Weekly Narrative Planner                                                 | ✅     | 2026-04-30     | Tier 2 narrative planner, zod parser, APIs, editable plan UI, and tests wired. |
| 24 | Plan-to-stories conversion                                               | ✅     | 2026-04-30     | Approved plans can promote selected recommendations into narrative_plan story seeds. |
| 25 | Low-Signal Mode                                                          | ✅     | 2026-04-30     | Low-signal artifact-aware question generation, contextual banner, and zero-artifact fallback. |
| 26 | Dashboard + AI budget indicator                                          | ✅     | 2026-04-30     | Dashboard stats, pillar chart, activity feed, and budget warning indicator wired. |
| 27 | Settings, data deletion, billing placeholder                             | ✅     | 2026-04-30     | Profile edit, data counts, storage-aware hard delete, tier card, and Phase 2 integration placeholders. |
| 28 | Phase 1 polish, tests, deploy                                            | ✅     | 2026-04-30     | Unit tests, skipped full-env golden path scaffold, README updates, lint/typecheck/build verified locally; production deploy remains environment-owned. |
