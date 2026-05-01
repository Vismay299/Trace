# Trace — Phase 2 Implementation Plan

## Context

Phase 1 is already implemented in this repository. `IMPLEMENTATION_PLAN.md` marks segments `0` through `28` complete, and the current codebase contains the working Phase 1 surfaces for auth, uploads, source chunking, story extraction, content generation, weekly check-ins, narrative planning, dashboard, settings, and AI budget enforcement.

This document is the detailed execution plan for **Phase 2: Integrations + Public Launch**. It expands the coarse outline in `IMPLEMENTATION_PLAN.md` into smaller, independently completable execution segments. It should be treated as the active Phase 2 build plan once approved.

This plan takes the app from a completed Phase 1 beta product to a **public-launch-ready Pro product** that satisfies the Phase 2 intent in spec §16, plus the Phase 2 additions in `F3`, `F7`, `F13`, `F14`, and `F15`.

**Scope discipline:** Phase 2 ships the smallest defensible public launch. Drive, Notion, pgvector, and hybrid voice are deferred to **Phase 2.5** (post-launch hardening) so the launch surface area stays supportable by a solo founder. The launch wedge is GitHub + Ship-to-Post for builders, paid via Stripe Pro.

Phase 2 (launch) covers:

- First public launch pricing: `Free + Pro ($39/mo)` only
- `OpenRouter` remains the primary AI provider stack from Phase 1; `NVIDIA NIM` is introduced as an _opt-in routing experiment_, not a primary swap
- Paid subscriptions via Stripe with full webhook reconciliation
- **GitHub** source integration only (Drive and Notion deferred to Phase 2.5)
- Async sync and generation infrastructure (Redis + BullMQ)
- Ship-to-Post auto-drafting from meaningful GitHub activity
- Content calendar scheduling and narrative-plan scheduling flows
- Stronger signal assessment and product-stage detection
- Admin and user-facing AI economics visibility
- Observability, analytics, legal/ToS, and beta gating required for public launch

## Current starting state

The plan below assumes the current repository state, not the earlier greenfield assumptions:

- The app is already a Next.js App Router codebase using TypeScript, Drizzle, Supabase, OpenRouter, Resend, Tailwind, Vitest, and Playwright.
- `source_connections` already exists in the schema and is the correct home for integration tokens and metadata.
- `content_calendar` already exists in the schema but does not yet have a full scheduling UI/API flow.
- `users` already includes `stripe_customer_id` and `stripe_subscription_id`, but billing lifecycle logic is not implemented yet.
- `app/settings/_components/integrations-placeholder.tsx` and `app/sources/page.tsx` already expose the future integration intent in the UI.
- `lib/ai/budget.ts` currently enforces Phase 1-style fixed weekly budgets and will need a Phase 2 differentiation between free and paid usage.
- `lib/ai/client.ts` is currently OpenRouter-centric and should be generalized in Phase 2 into a provider-aware client where `NVIDIA NIM` is the default route and `OpenRouter` is the fallback route.
- `lib/integrations/parser.ts` and `lib/integrations/chunker.ts` should be reused rather than replaced.

## Source-of-truth references

- `trace_spec.md` is canonical. If this document and the spec disagree, the spec wins.
- `IMPLEMENTATION_PLAN.md` is canonical for Phase 1 decisions, conventions, and file-level expectations.
- Most relevant spec sections for this plan:
  - §5 `F3b`, `F3c`, `F3d`, `F7`, `F13`, `F14`, `F15`
  - §9 Data Source Integrations
  - §12 Database Schema
  - §13 API Design
  - §16 Phase 2 milestone and success criteria
  - §19 Phase 2 metrics
  - Appendix D and E for directory and environment expectations

## Phase 2 outcomes

By the end of this plan, Trace should be able to:

- upgrade a user from free to Pro and enforce tier-aware AI limits
- route both `Free` and `Pro` AI traffic through `OpenRouter` reliably, with optional `NVIDIA NIM` routing available behind an admin flag for evaluation
- connect **GitHub** with explicit user-controlled repo selection
- sync GitHub asynchronously and normalize commits/PRs/READMEs into `source_chunks`
- generate story seeds and content from integrated sources without regressing manual uploads
- auto-draft content from meaningful GitHub activity without auto-publishing
- let users schedule generated content on an internal calendar
- convert narrative plan items into scheduled calendar items
- show users their AI usage clearly and let operators monitor system-wide cost and routing
- launch publicly behind a beta gate with monitoring, analytics, legal coverage, QA, and rollback-safe operational controls

## Out of scope for this document

These stay out of the Phase 2 launch unless explicitly re-approved. Items marked **(→ 2.5)** are deferred to a Phase 2.5 hardening pass after launch metrics arrive:

- Studio plan availability at launch; it should appear only as `coming soon` with no purchase path
- autonomous posting to LinkedIn, X, or Instagram
- multi-brand / multi-project support — Pro is single-project; multi-project with shared social accounts is Studio-only (Phase 3+)
- Google Calendar integration
- Slack/email export ingestion
- existing public social-profile ingestion
- Anthropic direct usage for Studio tier
- full mobile voice workflows or push-triggered check-ins
- **Google Drive integration (→ 2.5)**
- **Notion integration (→ 2.5)**
- **pgvector / embeddings / semantic retrieval (→ 2.5)** — direct-context Phase 1 retrieval is sufficient at launch volumes
- **Hybrid conversational voice / cloud TTS upgrade (→ 2.5)** — Phase 1 browser voice path remains the launch experience
- **NVIDIA NIM as primary provider (→ 2.5+)** — kept as an opt-in routing experiment, not a launch swap

## Architecture decisions (locked, do not relitigate)

1. **Billing source of truth:** Stripe subscription state is authoritative and enters the app through webhook reconciliation, not optimistic client assumptions.
2. **Launch pricing scope:** the first public rollout exposes only `free` and `pro ($39/mo)`. `Studio` may exist as a future internal enum or roadmap concept, but it must not be user-purchasable, activatable, or granted through the Phase 2 UI or webhook flows.
3. **Auth separation:** NextAuth remains the product-auth layer. Source integrations use `source_connections` plus provider-specific OAuth/token lifecycle; they do not piggyback on auth-provider assumptions.
4. **Async by default for integrated work:** all source sync, ingestion, embedding, and auto-draft jobs run through Redis + BullMQ workers. API routes enqueue and report status.
5. **User-controlled scanning:** GitHub repo selection, Google Drive folder/file selection, and Notion page/database selection are explicit. Trace never scans an entire account by default.
6. **Normalization first:** every integrated artifact is normalized to the existing chunk/extract pipeline shape before LLM extraction. New sources extend the pipeline; they do not fork it.
7. **No silent publishing:** Ship-to-Post creates drafts only. Publishing remains manual until Phase 3.
8. **Embeddings are gated:** pgvector is introduced only after async workers are in place and only becomes required when source volume meaningfully exceeds the direct-context Phase 1 model.
9. **Phase 2 voice path:** conversational voice uses browser STT for input and cloud TTS for Trace's spoken questions. Do not build full speech-to-speech realtime in this phase.
10. **Primary/fallback AI routing:** `OpenRouter` remains the primary provider stack at launch (it is the proven Phase 1 path). `NVIDIA NIM` is wired up as an _opt-in alternate route_ behind an admin flag and per-task-type override, so cost/quality data can be gathered post-launch without putting the launch on a provider migration. Promoting NIM to primary is a Phase 2.5+ decision driven by real routing data, not by this plan.
11. **Same provider stack for Free and Pro:** both plans use the same primary provider stack at launch (`OpenRouter`). The difference between `free` and `pro` is feature access, quota, throughput, and routing policy tolerance, not a completely different vendor.
12. **Paid differentiation by AI economics first:** free vs Pro is primarily enforced through quotas, routing quality, throughput, and convenience, not by hiding core surfaces.
13. **Observability is mandatory:** Sentry, PostHog, queue telemetry, and admin AI cost visibility must exist before public launch.
14. **Backward compatibility:** manual uploads, narrative planning, and the current dashboard remain first-class paths. Integrations are additive, not replacements.
15. **All model calls still go through `lib/ai/client.ts`:** routing experimentation, paid-tier upgrades, and admin overrides must still respect the single-gateway architecture.
16. **Single-project model for Free and Pro:** every user has exactly one project, one Strategy Doc, one set of pillars, one voice profile, and one content stream at launch. Multi-project is the Studio differentiator (Phase 3+). However, Pro users can **redo their Strategy Doc** at any time — this overwrites the existing strategy, recalibrates pillars and voice, and resets story-seed relevance scoring against the new positioning. It does not create a second project.
17. **Multi-project posting is a Studio-only problem:** when Studio ships, multiple projects connected to one LinkedIn/X account will require a project-aware publishing queue with conflict resolution and cadence balancing. This complexity is intentionally avoided at launch by enforcing single-project.

## How to execute this plan

**One segment per session.** Follow the same discipline as Phase 1: each segment should land in a committable state with its own verification complete before moving on.

**Each segment includes:**

- **Goal** — the outcome for that session
- **Touches** — the main files or directories expected to change
- **Depends on** — earlier segments that must already be done
- **Build** — concrete implementation tasks
- **Verify** — completion checks before the segment can be marked done
- **Effort** — XS / S / M / L

**Execution rules:**

- Do not start external-provider work until the schema, queue, and observability foundations are ready.
- Do not mark provider segments done without both mocked/local validation and one real sandbox/manual test.
- Do not ship ship-to-post until the GitHub filtering logic proves it can ignore merge, bot, and dependency noise.
- Do not enable paid plans publicly until webhook reconciliation and downgrade/failed-payment paths are verified.
- Update the status table at the bottom of this file as segments are completed.

## Phase 2 segments (20 total — 14 launch, 6 deferred to Phase 2.5)

Launch segments: **29, 30, 31, 32, 33, 34, 35, 36, 37, 42, 43, 44, 47, 48**.
Deferred to Phase 2.5: **38, 39, 40, 41, 45, 46**. Their detail is preserved below for continuity but should not be started before public launch unless re-approved.

---

### Segment 29 — Phase 2 foundation and feature gates [S]

- **Goal:** Establish the scaffolding Phase 2 needs: environment variables, feature flags, migration placeholders, and docs so the rest of the work lands behind safe gates.
- **Touches:** `.env.example`, `README.md`, `lib/env.ts` or `lib/config/phase2.ts`, `lib/flags.ts`, `drizzle/migrations/*_phase2_foundation.sql`, `IMPLEMENTATION_PLAN.md` note linking to this file.
- **Depends on:** Phase 1 complete
- **Build:**
  1. Add Phase 2 env validation for Stripe, GitHub OAuth/App, Redis, Sentry, PostHog, `OPENROUTER_API_KEY`, and an optional `NVIDIA_NIM_API_KEY` (only required when the NIM routing flag is enabled). Reserve env keys for Drive/Notion (Phase 2.5) but do not require them at launch.
  2. Introduce explicit feature flags for `billing`, `github_sync`, `calendar`, `ship_to_post`, `admin_ai_ops`, `beta_gate`, and `nim_routing` (admin-only). Reserve flag names for `drive_sync`, `notion_sync`, and `phase2_voice` (off, Phase 2.5).
  3. Add provider config scaffolding so AI routing can declare a primary provider, alternate provider routes, per-tier timeout thresholds, and explicit fallback reasons without hardcoding those decisions across call sites. Default config: `OpenRouter` primary, `NIM` available as an opt-in alternate route.
  4. Add any missing Phase 2-ready schema columns that are low-risk and cross-cutting, such as sync status, sync cursors, provider identifiers, job correlation IDs, and source-selection metadata on `source_connections`.
  5. Document the Phase 2 local boot sequence in `README.md`, including worker startup, required sandbox accounts (GitHub + Stripe test mode), and how to enable the NIM routing experiment locally.
  6. Add guard helpers so incomplete Phase 2 surfaces can stay hidden from non-admin users until rollout, and a beta-gate helper that allow-lists users by email/flag for the public launch period.
- **Verify:** app boots with Phase 2 flags off; `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass; missing Phase 2 env vars fail validation only when the relevant flag is enabled.

---

### Segment 30 — Observability and analytics baseline [S]

- **Goal:** Public-launch-grade error reporting and product analytics are wired before higher-risk Phase 2 features land.
- **Touches:** `sentry.*.config.*`, `app/layout.tsx`, `middleware.ts`, `lib/observability/*`, `lib/analytics/*`, `app/api/health/route.ts`, relevant UI event call sites.
- **Depends on:** Segment 29
- **Build:**
  1. Add Sentry SDK for Next.js server, edge, and client capture, with release/environment tags and user identity when authenticated.
  2. Add PostHog client/server helpers and define a Phase 2 event taxonomy: `subscription_started`, `source_connected`, `source_sync_started`, `source_sync_completed`, `story_seed_created`, `calendar_item_scheduled`, `voice_checkin_started`, `voice_checkin_completed`.
  3. Instrument critical Phase 1 and Phase 2 flows, especially auth entry, checkout, source connection, source sync, narrative plan approval, and content generation.
  4. Add a lightweight health endpoint that checks database availability and queue connectivity separately.
  5. Ensure sensitive payloads like tokens, source content, and transcript text are redacted from logs and errors.
- **Verify:** a manual test error appears in Sentry with source maps; PostHog receives at least one authenticated and one anonymous event; health endpoint reports degraded status correctly if Redis is unavailable.

---

### Segment 31 — Billing schema and Stripe domain model [S]

- **Goal:** The database and backend domain model can represent subscriptions, billing periods, plan transitions, and webhook-driven state reconciliation.
- **Touches:** `lib/db/schema.ts`, `drizzle/migrations/*_stripe_billing.sql`, `lib/billing/types.ts`, `lib/billing/stripe.ts`, `lib/billing/subscriptions.ts`, tests under `lib/billing/__tests__/`.
- **Depends on:** Segment 29
- **Build:**
  1. Add any missing billing fields beyond current `users` columns, such as subscription status, plan code, billing period boundaries, cancellation-at-period-end, and last webhook timestamp.
  2. Define canonical launch plan handling for `free` and `pro`, and keep any future `studio` references internal-only and non-routable in public launch code paths.
  3. Build Stripe helper modules for customer lookup/creation, checkout session creation, billing portal access, and webhook signature verification.
  4. Add mapping logic from Stripe subscription state to Trace tier and weekly AI budget policy.
  5. Add unit tests for plan-state mapping and idempotent webhook application.
- **Verify:** local tests prove repeated webhook delivery is safe; a seeded user can be mapped from free to pro and back without ambiguous state.

---

### Segment 32 — Pricing, checkout, webhook lifecycle, and Pro gating [M]

- **Goal:** Users can upgrade to Pro, the app reflects subscription state reliably, and Pro-specific budget behavior is enforced end-to-end.
- **Touches:** `app/pricing/page.tsx`, `app/settings/page.tsx`, `app/settings/_components/tier-card.tsx`, `app/api/stripe/checkout/route.ts`, `app/api/stripe/portal/route.ts`, `app/api/stripe/webhook/route.ts`, `lib/ai/budget.ts`, `lib/auth/*`, `app/api/account/route.ts`.
- **Depends on:** Segments 30, 31
- **Build:**
  1. Replace placeholder upgrade CTAs with real Pro checkout and billing-portal actions, and show `Studio` only as `coming soon` with no checkout path.
  2. Implement webhook handling for `checkout.session.completed`, `customer.subscription.created`, `updated`, `deleted`, `invoice.payment_failed`, and `invoice.paid`.
  3. Update the user's tier and budget policy only from webhook-confirmed state, not just from the checkout return URL.
  4. Extend `lib/ai/budget.ts` so free and Pro users receive distinct weekly budgets and routing allowances aligned with spec `F15`, while still using the same underlying provider stack.
  5. Add UI affordances for trial/past_due/cancel_at_period_end states so billing problems are visible and actionable.
  6. Ensure no public UI, API, or webhook path can activate Studio during the first rollout; Studio stays roadmap-only / coming soon.
  7. Gate any Pro-only Phase 2 convenience features cleanly while keeping the core experience intact.
  8. Add a **Redo Strategy** flow accessible from settings or the Strategy Doc page. This re-runs the onboarding interview, overwrites the existing Strategy Doc, recalibrates pillars and voice profile, and marks existing story seeds for re-scoring against the new positioning. It does not create a second project — it replaces the current one in place. Available to both Free and Pro users (Free users may want to redo after upgrading).
- **Verify:** Stripe test mode upgrade changes the user to Pro, updates the budget snapshot, and surfaces in settings/dashboard; cancelling or failing payment downgrades behavior correctly after webhook reconciliation. Redo Strategy produces a new Strategy Doc and the old one is no longer active.

---

### Segment 33 — Async job runtime with Redis + BullMQ [M]

- **Goal:** Build the worker foundation that every Phase 2 sync, embedding, and auto-draft task will run on.
- **Touches:** `package.json`, `lib/jobs/*`, `workers/*`, `app/api/jobs/*`, `README.md`, tests under `lib/jobs/__tests__/`.
- **Depends on:** Segments 29, 30
- **Build:**
  1. Add Redis and BullMQ dependencies and a shared queue module for `source-sync`, `source-parse`, `story-extract`, `embed-chunks`, `ship-to-post`, and `calendar-reminders` if needed.
  2. Create worker entrypoints and a local `pnpm` script for starting workers independently from `next dev`.
  3. Define a consistent job envelope with `jobId`, `userId`, `sourceConnectionId`, retry metadata, trace IDs, and structured error serialization.
  4. Add dead-letter and retry rules by job type; sync jobs should retry transient provider failures, but not invalid scopes or revoked access.
  5. Add queue status helpers usable by API routes and UI polling.
- **Verify:** a test job enqueues, processes, retries once, and reports final state; workers can run locally against Redis without blocking the web app.

---

### Segment 34 — Source integration framework and sync status APIs [S]

- **Goal:** Create the shared provider abstraction so GitHub, Drive, and Notion plug into the same connection, selection, sync, and status model.
- **Touches:** `app/api/sources/route.ts`, `app/api/sources/connect/[type]/route.ts`, `app/api/sources/[id]/route.ts`, `app/api/sources/[id]/sync/route.ts`, `app/api/sources/[id]/status/route.ts`, `lib/integrations/shared/*`, `app/sources/_components/*`.
- **Depends on:** Segment 33
- **Build:**
  1. Implement `GET /api/sources` to list manual uploads plus connected integrations in a unified shape.
  2. Define shared connection states such as `not_connected`, `connected`, `needs_selection`, `ready`, `syncing`, `error`, and `revoked`.
  3. Add source-card UI to `app/sources/page.tsx` for connect, disconnect, sync-now, and view-last-status actions.
  4. Add status persistence for last sync time, last success time, last error, sync item counts, and provider cursor metadata.
  5. Keep manual upload UI unchanged and clearly separate it from connected sources.
- **Verify:** a mocked provider connection can be listed, triggered, and show status changes end-to-end without any provider-specific code leaking into the shared UI.

---

### Segment 35 — GitHub connection flow and repo selection [L]

- **Goal:** Users can connect GitHub, authorize access, choose repositories explicitly, and persist that selection safely.
- **Touches:** `lib/integrations/github/auth.ts`, `lib/integrations/github/client.ts`, `app/api/sources/connect/github/route.ts`, `app/api/sources/github/callback/route.ts`, `app/sources/_components/github-connect-card.tsx`, `app/sources/_components/repo-selector.tsx`, `lib/db/schema.ts` if selection metadata needs structure.
- **Depends on:** Segments 33, 34
- **Build:**
  1. Implement the GitHub provider flow using a GitHub App or OAuth pattern consistent with the spec's user-controlled repo access goal.
  2. Store encrypted access tokens and refresh/installation metadata in `source_connections`.
  3. Build a **repo-selector UI** with the following UX requirements:
     - Searchable and filterable list of the user's repos (users may have 100+).
     - Sort/surface starred, recently-pushed, and pinned repos at the top by default.
     - Show per-repo context: name, visibility (public/private), primary language, last commit date, and a lightweight "content potential" indicator (e.g., has README, has recent PRs, has authored issues).
     - Explicit multi-select via checkboxes — never default to "scan everything."
     - Persist the selection as an allow-list in `source_connections.source_metadata`.
  4. Build a **modify selection** flow accessible from the Sources settings panel so users can add or remove repos at any time without disconnecting and reconnecting GitHub. Adding a repo triggers an initial sync for that repo only; removing a repo marks its chunks as inactive but does not delete them immediately.
  5. Capture metadata needed downstream: GitHub username, selected repos, installation/account IDs, sync cursors, webhook eligibility.
  6. Support disconnect and reconnect paths, including the revoked-token case and installation permission changes.
  7. Default sync scope per repo to all meaningful artifact types (commits, PRs, READMEs, issues) using the noise filters from Segment 36. Do not add per-repo scope toggles at launch — keep it simple; if the filters from Segment 36 are good, users don't need to micro-manage this.
- **Verify:** a real GitHub sandbox account can connect, select repos, refresh the page and see the selection persisted; can return to the selector and add/remove repos without re-authenticating; repos with recent activity sort above stale repos.

---

### Segment 36 — GitHub ingestion, normalization, and meaningful-activity filters [M]

- **Goal:** Selected GitHub data syncs into normalized `source_chunks` while aggressively filtering noise.
- **Touches:** `lib/integrations/github/sync.ts`, `lib/integrations/github/normalize.ts`, `lib/integrations/github/filter.ts`, `workers/github-sync-worker.ts`, tests under `lib/integrations/github/__tests__/`.
- **Depends on:** Segment 35
- **Build:**
  1. Pull commits, PR titles/descriptions/comments, READMEs, and authored issues from selected repos.
  2. Normalize every artifact into the existing ingestion shape: `{ sourceType, sourceReference, sourceDate, title, content, metadata }`.
  3. Implement high-signal filtering for bot commits, merge commits, dependency bump churn, and low-information one-liners.
  4. Store provider-specific identifiers in metadata so re-syncs are idempotent and updates do not duplicate chunks.
  5. Reuse the existing parser/chunker logic where content needs splitting and preserve repo/path/PR metadata in chunk metadata.
  6. Record sync stats: artifacts scanned, artifacts kept, chunks created, artifacts skipped by rule.
- **Verify:** syncing a selected repo produces chunks from meaningful commits/PRs/README material, while merge/bot/dependency noise is excluded by automated tests.

---

### Segment 37 — GitHub auto-sync, source-aware weekly context, and Ship-to-Post triggers [M]

- **Goal:** GitHub becomes a living source, not a one-time import, and meaningful development activity can feed both weekly context and auto-draft workflows.
- **Touches:** `workers/github-sync-worker.ts`, `lib/integrations/github/webhooks.ts` or polling scheduler, `lib/ai/signal.ts`, `lib/checkin/*`, `app/api/generate/ship-to-post/route.ts` or equivalent enqueue route, `app/dashboard/*`.
- **Depends on:** Segment 36
- **Build:**
  1. Implement manual sync plus scheduled re-sync for GitHub connections.
  2. Add optional webhook intake or polling cursor logic so fresh activity is discovered incrementally rather than via full rescans.
  3. Feed GitHub-derived source activity into weekly check-in and signal assessment summaries so the app can say things like "you merged 4 meaningful PRs this week."
  4. Define the Ship-to-Post trigger threshold for a meaningful commit or PR, based on changed files, message quality, and diff metadata if available.
  5. Enqueue an auto-draft X thread or LinkedIn draft when a qualifying event lands, but keep it in `draft` status and notify the user in-app only.
- **Verify:** a new meaningful GitHub event after initial sync updates weekly signal inputs and can enqueue exactly one draft without duplicate firing on repeated sync runs.

---

### Segment 38 — Shared Google OAuth flow and Drive selector [L] — **Deferred to Phase 2.5**

- **Goal:** The app can connect a Google account, request the correct scopes, and let the user explicitly choose Drive folders/files to include.
- **Touches:** `lib/integrations/google/auth.ts`, `lib/integrations/google/client.ts`, `app/api/sources/connect/google-drive/route.ts`, `app/api/sources/google-drive/callback/route.ts`, `app/sources/_components/drive-connect-card.tsx`, `app/sources/_components/drive-selector.tsx`.
- **Depends on:** Segments 33, 34
- **Build:**
  1. Implement Google OAuth with only the scopes needed for Drive content access in Phase 2.
  2. Store encrypted tokens and refresh expiry metadata in `source_connections`.
  3. Build a selector UI for folders/files, with clear language that Trace never scans everything without permission.
  4. Persist selected folder/file IDs and selection timestamps in connection metadata.
  5. Design the Google token layer to be reusable for future Calendar integration in Phase 3 without over-scoping now.
- **Verify:** a real Google sandbox account connects, selection persists, and re-opening the selector shows the previously chosen scope and targets.

---

### Segment 39 — Google Drive sync, extraction, and chunk creation [M] — **Deferred to Phase 2.5**

- **Goal:** Selected Google Docs, Sheets, and Slides can be synced, converted to text, chunked, and made available to story extraction.
- **Touches:** `lib/integrations/google-drive/sync.ts`, `lib/integrations/google-drive/extract.ts`, `workers/google-drive-sync-worker.ts`, tests under `lib/integrations/google-drive/__tests__/`.
- **Depends on:** Segment 38
- **Build:**
  1. Pull only user-selected Docs, Sheets, and Slides.
  2. Extract text content plus useful metadata such as title, URL, modified time, document type, and file hierarchy.
  3. Normalize the extracted content into `source_chunks` using the same chunking rules as manual uploads, with provider-specific `sourceType` values.
  4. Keep sync idempotent by tracking external file IDs and last modified timestamps.
  5. Surface sync errors clearly when a document is inaccessible or unsupported.
  6. Feed synced Drive chunks into the existing story extraction flow without new special-case generation logic.
- **Verify:** a selected Doc, Sheet, and Slide each produce sensible chunks with correct citations and source metadata; re-sync does not duplicate unchanged content.

---

### Segment 40 — Notion connection flow and page/database selection [L] — **Deferred to Phase 2.5**

- **Goal:** Users can connect Notion, browse authorized content, and select pages/databases explicitly for Trace to ingest.
- **Touches:** `lib/integrations/notion/auth.ts`, `lib/integrations/notion/client.ts`, `app/api/sources/connect/notion/route.ts`, `app/api/sources/notion/callback/route.ts`, `app/sources/_components/notion-connect-card.tsx`, `app/sources/_components/notion-selector.tsx`.
- **Depends on:** Segments 33, 34
- **Build:**
  1. Implement Notion OAuth and encrypted token storage.
  2. Build a selector for pages and databases exposed by the authorized workspace.
  3. Persist selection metadata and workspace identity in `source_connections`.
  4. Support reconnect, workspace revocation, and selection updates without forcing a full disconnect.
  5. Reuse the same shared source-card and status patterns as GitHub and Drive so the UI does not fragment by provider.
- **Verify:** a real Notion sandbox can connect, select pages/databases, and show the chosen scope consistently on reload.

---

### Segment 41 — Notion sync, content flattening, and chunk creation [M] — **Deferred to Phase 2.5**

- **Goal:** Selected Notion pages and databases sync into `source_chunks` in a form that works for extraction and citation.
- **Touches:** `lib/integrations/notion/sync.ts`, `lib/integrations/notion/extract.ts`, `workers/notion-sync-worker.ts`, tests under `lib/integrations/notion/__tests__/`.
- **Depends on:** Segment 40
- **Build:**
  1. Flatten rich Notion block content into readable markdown/text while preserving headings, bullet hierarchy, toggles, and links where useful.
  2. Extract database rows into a text shape that still retains key property metadata.
  3. Normalize titles, URLs, updated dates, tags, and workspace metadata for chunk citations.
  4. Preserve stable external IDs so re-sync updates changed content without duplicating unchanged content.
  5. Route the final text through the same chunking and story-extraction flow as other sources.
- **Verify:** selected pages and database rows produce clean chunk text, useful citations, and no duplicate rows on second sync.

---

### Segment 42 — Claude Code / AI coding conversation import (Phase 1.5 carried into Phase 2) [S]

- **Goal:** Support structured import of coding-conversation artifacts so builder workflows are not limited to repos and docs.
- **Touches:** `app/sources/_components/upload-zone.tsx`, `lib/integrations/parser.ts`, `lib/integrations/claude-code/*`, `workers/source-import-worker.ts`, `trace_spec.md` alignment comments only if needed later.
- **Depends on:** Segments 33, 34
- **Build:**
  1. Define accepted import formats for AI coding logs, exported markdown transcripts, or cleaned text logs.
  2. Add parser/normalizer logic that strips obvious noise while retaining prompts, implementation notes, debugging turns, accepted changes, and reasoning summaries.
  3. Store imported transcripts as a first-class source type with strong metadata about tool, project, and date range.
  4. Ensure the story-extraction prompt can distinguish implementation insight from casual chat.
  5. Keep this as upload/import based, not live connector based, in Phase 2.
- **Verify:** importing a representative coding conversation produces chunks and story seeds that feel materially different from ordinary uploaded docs and do not swamp the story mine with low-value chatter.

---

### Segment 43 — Content calendar foundations [M]

- **Goal:** Trace can schedule generated content internally on a week/month calendar and treat scheduling as a first-class workflow.
- **Touches:** `app/calendar/page.tsx`, `app/calendar/_components/*`, `app/api/calendar/route.ts`, `app/api/calendar/[id]/route.ts`, `lib/calendar/*`, `app/content/[id]/_components/content-editor.tsx`, `app/dashboard/*`.
- **Depends on:** Segments 29, 32
- **Build:**
  1. Implement calendar read APIs for date ranges and scheduling create/update/delete operations on `content_calendar`.
  2. Build calendar UI with week and month views, scheduled-item cards, unscheduled drafts panel, and platform/date filters.
  3. Allow scheduling directly from generated content detail/editor pages.
  4. Surface pillar-balance hints and cadence gaps by comparing scheduled items to the user's strategy and narrative plan.
  5. Keep scheduled content as internal planning only; no external publish API is introduced here.
- **Verify:** a user can schedule, reschedule, and unschedule generated content; calendar view stays consistent after page refresh and across week/month filters.

---

### Segment 44 — Narrative-plan scheduling and Ship-to-Post draft UX [M]

- **Goal:** Narrative planning and integrated-source activity feed directly into execution workflows instead of stopping at recommendation screens.
- **Touches:** `app/weekly/plan/page.tsx`, `app/weekly/_components/narrative-plan.tsx`, `app/api/narrative/[id]/schedule/route.ts` or equivalent, `app/mine/*`, `app/content/*`, `app/notifications/*` if introduced.
- **Depends on:** Segments 37, 43
- **Build:**
  1. Let approved narrative-plan items be scheduled directly into the content calendar without requiring manual seed promotion first when the user chooses a fast path.
  2. Preserve the existing story-seed creation path for users who want tighter editorial control.
  3. Add an inbox or activity surface for auto-drafted Ship-to-Post content so users can review it in context rather than hunting for it.
  4. Ensure auto-draft content carries a strong source citation back to the GitHub event that triggered it.
  5. Track whether scheduled items originated from source mining, narrative planning, or ship-to-post so performance analysis later can compare paths.
- **Verify:** an approved narrative plan recommendation can be scheduled in one action; a ship-to-post draft appears in a user-visible review surface with correct source traceability.

---

### Segment 45 — pgvector, embeddings, semantic retrieval, and dedup [L] — **Deferred to Phase 2.5**

- **Goal:** Phase 2 scales beyond small source sets by adding embeddings only where they materially improve retrieval and duplicate detection.
- **Touches:** `lib/db/schema.ts`, `drizzle/migrations/*_pgvector.sql`, `lib/embeddings/*`, `workers/embed-chunks-worker.ts`, `lib/ai/extract.ts`, `lib/ai/generate.ts`, `lib/ai/similarity.ts`, tests under `lib/embeddings/__tests__/`.
- **Depends on:** Segments 33, 36, 39, 41
- **Build:**
  1. Add the nullable vector column and index for `source_chunks`.
  2. Introduce an embedding provider abstraction and pick the lowest-cost viable model for semantic retrieval, routed through the same ops discipline as other AI infrastructure.
  3. Gate embedding generation so it only runs for users over a defined chunk threshold or when a feature explicitly needs it.
  4. Backfill embeddings asynchronously and track progress/status per source or user cohort.
  5. Add semantic retrieval for generation context assembly and near-duplicate detection against previously generated or already published content.
  6. Keep a clean fallback path to the Phase 1 direct-chunk approach when embeddings are unavailable or unnecessary.
- **Verify:** an eligible user can backfill embeddings, retrieve semantically relevant chunks, and get duplicate warnings that would not be caught by title matching alone.

---

### Segment 46 — Phase 2 hybrid conversational voice [M] — **Deferred to Phase 2.5**

- **Goal:** Weekly check-ins feel more conversational by speaking Trace's questions aloud while preserving low-cost browser speech input.
- **Touches:** `hooks/use-tts.ts`, new `hooks/use-conversational-voice.ts`, `components/voice/*`, `app/weekly/_components/checkin-chat.tsx`, `app/onboarding/_components/interview-chat.tsx` if shared, `lib/voice/*`, `app/api/voice/tts/route.ts` if server-side generation is used.
- **Depends on:** Segments 29, 30
- **Build:**
  1. Add cloud TTS support for Trace's prompts and follow-up questions, with 2-3 selectable voice presets.
  2. Keep browser SpeechRecognition for user input so Phase 2 cost remains primarily on TTS, not STT.
  3. Build a conversational mode where the next AI question can auto-play after a short pause and listening can resume with minimal user clicks.
  4. Preserve transcript review/edit before final submission and store full transcript history as today.
  5. Add graceful fallbacks to the existing Phase 1 voice/text mode when TTS is unavailable, blocked, or rate-limited.
  6. Track voice completion rate, transcript edit rate, and average duration so the product hypothesis can be evaluated.
- **Verify:** a real weekly check-in can be completed with spoken Trace prompts plus browser STT responses; turning off the flag reverts to the stable Phase 1 experience.

---

### Segment 47 — AI economics operations: user credits, admin cost dashboard, and routing controls [M]

- **Goal:** Both users and operators can understand AI usage, and the routing layer can be tuned safely as real cost data arrives.
- **Touches:** `app/api/ai/budget/route.ts`, `app/api/ai/usage/route.ts`, `app/api/admin/ai/costs/route.ts`, `app/api/admin/ai/routing/route.ts`, `app/dashboard/*`, `app/admin/ai/page.tsx`, `lib/ai/models.ts`, `lib/ai/client.ts`, `lib/ai/usage.ts`.
- **Depends on:** Segment 32
- **Build:**
  1. Expand the user-facing budget UI from simple counters into a clearer credits/usage explanation with tier-specific expectations and reset timing.
  2. Build an admin cost dashboard showing usage by provider, model, task type, tier, user cohort, alternate-route hit rate, and cache-hit rate.
  3. Generalize `lib/ai/client.ts` so `OpenRouter` remains the default route and `NVIDIA NIM` is wired as an opt-in alternate route per task tier, with per-tier timeout thresholds and explicit routing-decision logging. Promotion of NIM to primary is out of scope for launch and gated behind admin flag + collected data.
  4. Add safe configuration for routing defaults and experiment flags, without allowing arbitrary bypass of task-tier discipline.
  5. Capture richer AI usage metadata such as route chosen, request latency, route-decision reason, cache involvement, and whether the call came from sync, check-in, generation, or voice.
  6. Add at least one cost-per-quality review report path so future provider and model-routing decisions can be evidence-based rather than guesswork.
- **Verify:** users can see updated weekly usage clearly; admins can identify the most expensive task types, see NIM-vs-OpenRouter cost/latency comparisons when the experiment flag is on, and change approved routing defaults without touching unrelated app logic.

---

### Segment 48 — Public launch hardening, QA, and rollout [M]

- **Goal:** Phase 2 is operationally ready for public launch, not just feature-complete.
- **Touches:** `tests/e2e/*`, `README.md`, deployment docs, runbooks under `docs/` if added, launch checklists, alert configuration, any bugfixes discovered during hardening.
- **Depends on:** all prior segments
- **Build:**
  1. Add or extend E2E coverage for the critical public-launch flows: signup, upgrade to Pro, connect GitHub, sync a repo, generate from integrated sources, schedule content, and review ship-to-post drafts.
  2. Add failure-path QA for revoked provider tokens, failed syncs, Stripe webhook delays, Redis outages, and exhausted budgets.
  3. Ship updated Terms of Service, Privacy Policy, and a clear data-use disclosure covering Stripe, GitHub OAuth scopes, AI provider data handling, and chunk storage. Surface them at signup and in settings.
  4. Wire the `beta_gate` flag for the launch period so the public funnel is allow-list / waitlist controlled, with a clean upgrade path to fully open access once support load is understood.
  5. Create launch runbooks for onboarding support, webhook replay, queue backlog recovery, provider outage response, GitHub token revocation handling, and safe feature-flag rollback.
  6. Validate analytics funnels for activation: signup → strategy generated → GitHub connected → story seed reviewed → content approved → content scheduled.
  7. Confirm the Phase 2 success metrics can actually be measured from the data emitted by the product.
- **Verify:** the public-launch checklist is green, E2E coverage passes in CI, critical alerts are configured, and the founder can perform the complete Pro flow from signup to scheduled content using integrated sources.

## Verification strategy across Phase 2

- **Per segment:** the explicit Verify step above is mandatory.
- **Before enabling any provider publicly:** confirm connect, sync, re-sync, revoke, and disconnect flows manually with sandbox accounts.
- **Billing guardrail:** any change that affects tier, quota, or subscription state must include a webhook-path test; client-only billing state is never trusted.
- **Queue guardrail:** any new async job type must define retry behavior, idempotency keys, and error classification before shipping.
- **Source-quality guardrail:** any integration that increases low-signal noise must improve or at least preserve story-seed quality versus Phase 1 manual uploads.
- **AI-cost guardrail:** every new LLM or embedding call site must declare its tier/intent and appear in admin usage reporting.
- **Launch guardrail:** no Phase 2 feature is "done" if it cannot be observed, supported, and rolled back safely.

## Critical files to know

- `lib/db/schema.ts` — existing schema baseline; Phase 2 extends rather than rewrites it.
- `lib/ai/client.ts` — all model calls and routing still funnel through here; Phase 2 should evolve it into a provider-aware client with `NVIDIA NIM` primary and `OpenRouter` fallback.
- `lib/ai/budget.ts` — Phase 2 free vs Pro economics will live here.
- `lib/integrations/parser.ts` and `lib/integrations/chunker.ts` — reuse these for new sources.
- `app/sources/page.tsx` — the central UI surface where Phase 2 integration entry points should converge.
- `app/settings/page.tsx` and `app/settings/_components/tier-card.tsx` — the natural home for billing and integration management.
- `app/weekly/*` and `lib/ai/signal.ts` — key surfaces for the Phase 2 signal/stage/voice improvements.
- `app/dashboard/*` — where user-facing usage clarity and scheduling visibility should appear.

## Open questions to resolve during implementation, not before it

1. GitHub App vs standard OAuth for repo selection and future webhook ergonomics. Default to the approach that best supports explicit repo allow-lists and incremental sync.
2. The exact TTS provider for conversational voice. Default to the lowest-friction provider with acceptable latency and predictable pricing.
3. Whether semantic dedup should compare against generated drafts only or also against user-edited/published variants first. Default to both if performance is acceptable.
4. Whether ship-to-post should draft only X threads first or both X + LinkedIn. Default to X thread first if signal quality is uncertain.
5. Whether Pro gets richer follow-up models in weekly check-ins immediately or only after admin routing data proves the quality gain is worth the cost.
6. The exact timeout and failure thresholds that should trigger `OpenRouter` fallback from `NVIDIA NIM` for Tier 1, Tier 2, and Tier 3 calls.

## Segment status

Update this table as each segment is completed. Format: `✅ done` · `🔄 in progress` · `⬜ not started`.

| #   | Segment                                                                           | Status  | Date completed | Notes                                                                                                      |
| --- | --------------------------------------------------------------------------------- | ------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| 29  | Phase 2 foundation and feature gates                                              | ⬜      |                |                                                                                                            |
| 30  | Observability and analytics baseline                                              | ⬜      |                |                                                                                                            |
| 31  | Billing schema and Stripe domain model                                            | ⬜      |                |                                                                                                            |
| 32  | Pricing, checkout, webhook lifecycle, and Pro gating                              | ⬜      |                |                                                                                                            |
| 33  | Async job runtime with Redis + BullMQ                                             | ⬜      |                |                                                                                                            |
| 34  | Source integration framework and sync status APIs                                 | ⬜      |                |                                                                                                            |
| 35  | GitHub connection flow and repo selection                                         | ⬜      |                |                                                                                                            |
| 36  | GitHub ingestion, normalization, and meaningful-activity filters                  | ⬜      |                |                                                                                                            |
| 37  | GitHub auto-sync, source-aware weekly context, and Ship-to-Post triggers          | ⬜      |                |                                                                                                            |
| 38  | Shared Google OAuth flow and Drive selector                                       | ⬜ 2.5  |                | Deferred                                                                                                   |
| 39  | Google Drive sync, extraction, and chunk creation                                 | ⬜ 2.5  |                | Deferred                                                                                                   |
| 40  | Notion connection flow and page/database selection                                | ⬜ 2.5  |                | Deferred                                                                                                   |
| 41  | Notion sync, content flattening, and chunk creation                               | ⬜ 2.5  |                | Deferred                                                                                                   |
| 42  | Claude Code / AI coding conversation import                                       | ⬜      |                |                                                                                                            |
| 43  | Content calendar foundations                                                      | ⬜      |                |                                                                                                            |
| 44  | Narrative-plan scheduling and Ship-to-Post draft UX                               | ⬜      |                |                                                                                                            |
| 45  | pgvector, embeddings, semantic retrieval, and dedup                               | ⬜ 2.5  |                | Deferred                                                                                                   |
| 46  | Phase 2 hybrid conversational voice                                               | ⬜ 2.5  |                | Deferred                                                                                                   |
| 47  | AI economics operations: user credits, admin cost dashboard, and routing controls | ✅ done | 2026-05-01     | User credit summaries, admin AI cost dashboard/API, tier-safe routing overrides, provider/model telemetry. |
| 48  | Public launch hardening, QA, and rollout                                          | ⬜      |                |                                                                                                            |
