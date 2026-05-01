# Phase 2 Pending Changes Audit

Audit date: 2026-05-01

Scope: read-only launch-readiness audit for Phase 2. No product code was changed.

Live URL checked: https://trace-vismay.vercel.app

## Executive verdict

Phase 2 is not launch-ready.

The biggest issue is not that every private route is missing. Many routes exist in the codebase: `/onboarding`, `/strategy`, `/sources`, `/mine`, `/content`, `/calendar`, `/weekly`, `/weekly/plan`, and `/settings`. The failure is that a signed-in user is not given a real app journey. The global authenticated navigation still behaves like marketing navigation, Dashboard is not a first-run command center, OAuth signup can bypass onboarding, Pro purchase intent is not preserved, and several backend/frontend contracts are incomplete.

So the user experience currently feels like:

1. Public marketing site exists.
2. User signs in or signs up.
3. User lands on Dashboard.
4. Dashboard exposes only weak links to Weekly and Settings.
5. The real Phase 2 surfaces are hidden unless the user knows the URLs.

That is why a logged-in user can reasonably say they only see one useful page.

## Five-agent audit summary

Five focused audit agents tested or inspected different parts of the product:

| Agent | Focus | Main finding |
| --- | --- | --- |
| Kierkegaard | Logged-out/public journey | Signup currently renders an application error in the deployed experience because `@/lib/flags` resolves to the wrong module. Public CTAs depend on signup. |
| Averroes | Logged-in Free/Basic journey | Private routes exist, but authenticated navigation exposes only Dashboard. OAuth signup can bypass onboarding and strand users on Dashboard. |
| Chandrasekhar | Pro/billing/entitlement journey | Stripe backend exists for signed-in users, but public Pro CTA does not start checkout and Pro entitlements are mostly not enforced server-side. |
| Herschel | Backend/frontend contracts | Several flows are wired but broken at the edges: onboarding skip, strategy PDF link, calendar duplication, GitHub sync status, weekly plan duplication. |
| Lorentz | Launch readiness and verification | Typecheck and tests currently fail due to the flag module conflict. Segment 48 is still pending; Phase 2 E2E and launch evidence are missing. |

## Current verification results

Local verification:

| Check | Result | Notes |
| --- | --- | --- |
| `npx pnpm typecheck` | Fails | `@/lib/flags` does not export `isFeatureEnabled` / `FeatureFlag` because untracked `lib/flags.ts` shadows `lib/flags/index.ts`. |
| `npx pnpm test -- --run lib/config/__tests__/phase2.test.ts lib/ai/__tests__/routing.test.ts` | Fails | 4 failing tests, same flag-module issue. |
| Agent-run `pnpm lint` | Passes | Lint passed in launch-readiness audit. |
| Agent-run `pnpm test:e2e --list` | Incomplete coverage | Only public marketing tests plus a skipped Phase 1 golden path; Phase 2 critical flows are absent. |

Live logged-out route check:

| Route | Status | Behavior |
| --- | --- | --- |
| `/` | 200 | Public page available. |
| `/story` | 200 | Public page available. |
| `/product` | 200 | Public page available. |
| `/pricing` | 200 | Public page available. |
| `/signup` | 200 with error content | Route responds, but fetched HTML contains application error markers. |
| `/login` | 200 | Public page available. |
| `/dashboard` | 307 | Redirects to `/login?next=%2Fdashboard`. |
| `/onboarding` | 307 | Redirects to `/login?next=%2Fonboarding`. |
| `/strategy` | 307 | Redirects to `/login?next=%2Fstrategy`. |
| `/sources` | 307 | Redirects to `/login?next=%2Fsources`. |
| `/mine` | 307 | Redirects to `/login?next=%2Fmine`. |
| `/content` | 307 | Redirects to `/login?next=%2Fcontent`. |
| `/calendar` | 307 | Redirects to `/login?next=%2Fcalendar`. |
| `/weekly` | 307 | Redirects to `/login?next=%2Fweekly`. |
| `/weekly/plan` | 307 | Redirects to `/login?next=%2Fweekly%2Fplan`. |
| `/settings` | 307 | Redirects to `/login?next=%2Fsettings`. |
| `/_dev/kit` | 404 on production | Local middleware still allowlists `/_dev`; production returned 404 in this deployment. |

## Why logged-in users cannot see the Phase 2 product

### Authenticated navigation is missing

The shared app layout renders `Header` everywhere. `Header` always renders `NavLinks`, and `NavLinks` comes from `NAV_LINKS`.

Current `NAV_LINKS` are only:

- `/story`
- `/product`
- `/pricing`

For authenticated users, the only app-aware action in the header is a single Dashboard button. There is no persistent signed-in app nav for:

- Sources
- Strategy
- Onboarding / redo onboarding
- Content Mine
- Drafts
- Content Calendar
- Weekly
- Weekly Plan
- Settings

Pending change:

Add an authenticated app shell or signed-in navigation separate from marketing navigation. It should expose at minimum:

- Dashboard
- Strategy
- Sources
- Content Mine
- Drafts
- Calendar
- Weekly
- Settings

Optional but useful:

- Setup checklist
- Plan badge: Free / Pro
- Upgrade/manage billing entry
- Worker/sync status area for source jobs

### Dashboard is not a first-run hub

Dashboard currently shows:

- Generated count
- Approved count
- Published count
- Voice score
- Pillar balance
- AI budget
- Recent activity
- Weekly status
- Links to Weekly and Settings

For a fresh user, “Recent activity” renders only “No activity yet.” There is no obvious path to:

- Start onboarding
- Continue onboarding
- Generate Strategy Doc
- Connect sources
- Upload files
- Mine story seeds
- Open drafts
- Schedule content
- Create weekly plan
- Upgrade to Pro

Pending change:

Dashboard needs a first-run state machine and setup checklist. It should look at actual user state and show the next best action:

| User state | Dashboard should show |
| --- | --- |
| No completed interview | Start/continue onboarding. |
| Interview complete, no Strategy Doc | Generate Strategy Doc. |
| Strategy exists, no sources | Connect GitHub or upload sources. |
| Sources exist, no story seeds | Mine sources for story seeds. |
| Story seeds exist, no drafts | Generate first draft. |
| Drafts exist, nothing scheduled | Schedule drafts on calendar. |
| Calendar has items | Show upcoming schedule. |
| Weekly check-in missing | Start weekly check-in. |
| Pro feature clicked on Free | Explain upgrade and route to checkout. |

### OAuth signup can bypass onboarding

Email/password signup routes to `/onboarding`, but OAuth buttons use `callbackUrl: next`, and `next` defaults to `/dashboard`.

That means a brand-new Google/GitHub user can create an account and land directly on Dashboard, without interview, strategy, or sample posts. Middleware only checks whether a session exists; it does not enforce onboarding state.

Pending change:

Add a post-auth onboarding resolver:

1. If user has no completed interview, send them to `/onboarding`.
2. If interview is complete but no Strategy Doc exists, send them to `/strategy?firstRun=1`.
3. If strategy exists, send them to requested `next` or `/dashboard`.
4. Preserve plan intent such as `plan=pro` separately from onboarding state.

### Private pages exist but are hidden

These pages exist locally:

| Page | Exists? | Current issue |
| --- | --- | --- |
| `/onboarding` | Yes | Hidden after OAuth signup; not discoverable from Dashboard/header. |
| `/strategy` | Yes | Hidden from global nav; generation can fail without a strong recovery flow. |
| `/sources` | Yes | Hidden from global nav; copy still says Phase 1 limit and Phase 2/2.5 language. |
| `/mine` | Yes | Hidden from global nav; requires Strategy Doc and sources. |
| `/content` | Yes | Hidden from global nav; empty state points to Mine but Dashboard does not point here. |
| `/calendar` | Yes | Hidden from global nav; schedule state has duplicate/unscheduled bugs. |
| `/weekly` | Yes | Only Dashboard links it; no global nav. |
| `/weekly/plan` | Yes | Hidden until check-in flow; not globally discoverable. |
| `/settings` | Yes | Dashboard links it, but integrations copy is stale. |

Pending change:

Treat “route exists” as insufficient. A launch-ready product needs discoverability, state-aware empty states, and cross-page recovery paths.

## User journey audit

### 1. Visitor who has not logged in

What works:

- Public home, story, product, pricing, login, legal pages are accessible.
- Protected app routes redirect to login with `next`.
- Pricing presents Free and Pro.

What is missing or broken:

- Signup route currently returns application-error content on the live deployment.
- Pro CTA points to plain `/signup`, so purchase intent is lost.
- Studio CTA is an inert `#` link in public pricing.
- Public copy describes several Phase 2 capabilities that are feature-flagged or not launch-proven.
- Public route `/_dev` is allowlisted locally and should not be public in production.
- Waitlist form can hang under E2E/server-action conditions without a clear timeout/retry recovery.

Expected launch-ready journey:

1. Visitor reads product.
2. Visitor picks Free or Pro.
3. Free signup starts onboarding.
4. Pro signup preserves plan intent, authenticates the user, then starts checkout at the correct point.
5. If beta gate is enabled, signup explains access state clearly.
6. Legal/data-use links work from signup.

Pending changes:

- Fix signup runtime/type issue.
- Preserve `plan=pro` through signup/login.
- Decide whether Pro checkout happens before or after onboarding, then implement that path.
- Replace Studio `#` with a waitlist or disabled state.
- Add public E2E for signup, login, legal links, and pricing CTA intent.
- Remove or environment-gate local dev routes.

### 2. Person who has logged in

What works:

- Session-protected routes exist.
- Dashboard exists.
- Settings exists.
- Some pages link forward once the user has already found the correct route.

What is missing:

- There is no authenticated app navigation.
- Dashboard does not explain the product journey.
- Dashboard does not link to Strategy, Sources, Content Mine, Drafts, Calendar, or Weekly Plan.
- There is no app-wide setup checklist.
- There is no global indication of whether the user has completed onboarding.
- There is no global indication of whether Strategy Doc exists.
- There is no global indication of source sync or worker job status.

Expected launch-ready journey:

1. User logs in.
2. App resolves onboarding state.
3. User lands on the right next page, not always Dashboard.
4. Header/sidebar exposes all app sections.
5. Dashboard summarizes current state and next action.

Pending changes:

- Build authenticated app shell.
- Add state-aware routing after login.
- Add Dashboard first-run setup checklist.
- Add empty states with direct CTAs on all core app pages.
- Add E2E that logs in and verifies these sections are visible from the UI.

### 3. New Free/Basic user

What works:

- Email/password signup creates a free user and routes to onboarding.
- Onboarding can create/resume interview session.
- Completing onboarding routes toward strategy.
- Strategy generation route exists.
- Sample posts can be generated and shown.
- Manual upload, source chunking, story seed extraction, draft generation, and internal scheduling routes exist.

What is missing or broken:

- OAuth signup can bypass onboarding.
- New user Dashboard has no “start interview” CTA.
- No automatic Strategy Doc or posts are created at account creation; they depend on completing onboarding and generation.
- Onboarding “skip follow-up” path expects `currentQuestion` from `/api/interview/progress`, but the API does not return it.
- Strategy generation error handling is too weak for launch.
- Strategy PDF UI points to `/strategy/pdf`, while implemented endpoint is `/api/strategy/pdf`.
- Free/Basic entitlement boundaries are unclear.
- Free users may access Phase 2 convenience features that pricing may intend for Pro.

Expected launch-ready Free journey:

1. Create Free account.
2. Start onboarding interview immediately.
3. Complete enough answers.
4. Generate Strategy Doc.
5. Show sample posts.
6. Offer manual upload or connect source depending on entitlement.
7. Mine story seeds.
8. Generate draft.
9. Review/edit draft.
10. Optionally schedule internally if allowed for Free, or explain Pro upgrade if not.

Pending changes:

- Fix OAuth first-run routing.
- Fix onboarding skip/progress contract.
- Add robust Strategy generation loading, failure, retry, and budget states.
- Fix Strategy PDF link.
- Decide exact Free capabilities and enforce them server-side.
- Add Free first-run E2E with mocked AI.

### 4. Existing Free/Basic user

What works:

- Can sign in.
- Can visit Dashboard.
- Can manually visit private routes by typing URLs.
- AI budget is tier-aware at the model-call layer.

What is missing:

- No signed-in navigation to major features.
- No way to discover hidden routes from global UI.
- No feature availability map for Free.
- No upgrade prompt at moments where Pro is needed.
- No clear “where are my posts?” explanation if Strategy/sample generation did not happen.

Pending changes:

- Add signed-in navigation.
- Add plan-aware feature cards and upgrade prompts.
- Add Dashboard cards for “Strategy”, “Sources”, “Drafts”, “Calendar”, and “Weekly plan”.
- Add “resume where you left off” state.

### 5. Pro user

What works:

- Stripe checkout route exists for signed-in users.
- Billing portal route exists.
- Stripe webhook can map active/trialing subscription to `users.tier = "pro"`.
- Pro budget limits exist in the AI budget layer.
- GitHub source integration is substantially implemented.
- Internal calendar exists.
- Admin AI ops surface exists.

What is missing or broken:

- Public Pro CTA does not start checkout.
- Signup ignores plan intent.
- Pro entitlements are not consistently enforced server-side.
- GitHub/source/calendar/Ship-to-Post can be reachable by Free users unless guarded elsewhere.
- Feature flags exist but do not consistently guard routes or actions.
- Pro upload quota copy does not match enforcement: pricing promises 20 manual uploads, code enforces 10 for everyone.
- GitHub sync requires Redis/worker runtime, but UI does not poll job completion or surface worker failure clearly.
- Drive and Notion are scaffold-only/deferred, but Settings can still read as if integrations are a Phase 2 placeholder.
- Calendar is internal scheduling only, not external publishing or Google Calendar.

Expected launch-ready Pro journey:

1. Visitor chooses Pro.
2. Signup/login preserves Pro intent.
3. Checkout starts.
4. Webhook upgrades user.
5. User sees Pro state in Settings/Dashboard.
6. User connects GitHub.
7. User selects repos explicitly.
8. Sync runs in worker.
9. UI shows sync progress, success, skipped artifacts, and errors.
10. Story seeds/drafts appear from integrated sources.
11. User schedules content internally.
12. Weekly plan can generate and schedule recommendations.

Pending changes:

- Build logged-out Pro acquisition path.
- Add post-auth checkout redirect.
- Add webhook evidence/testing.
- Add server-side entitlement checks for Pro features.
- Align quotas with pricing.
- Add GitHub sync polling and failure states.
- Verify worker deployment on Vercel/production infrastructure.
- Add Pro E2E/sandbox checklist evidence.

## Page-by-page pending changes

### `/signup`

Current state:

- Live route returns 200 but includes application-error markers.
- Local typecheck confirms imports from `@/lib/flags` fail.
- Email/password signup routes to onboarding.
- OAuth signup routes to `next`, defaulting to Dashboard.

Pending:

- Fix `@/lib/flags` module conflict.
- Preserve `plan=pro`.
- Route new OAuth users through onboarding.
- Keep beta gate behavior deterministic and tested.
- Add legal/data-use link verification.

### `/login`

Current state:

- Publicly accessible.
- Uses `next` destination after credentials login.

Pending:

- Add onboarding-state resolver after auth.
- Preserve Pro plan intent.
- Avoid sending incomplete users directly to Dashboard.

### `/dashboard`

Current state:

- Protected.
- Shows stats, budget, activity, weekly status.
- Links only Weekly and Settings.

Pending:

- Add first-run checklist.
- Add cards/links for Strategy, Sources, Content Mine, Drafts, Calendar, Weekly Plan.
- Show account tier and feature availability.
- Show source sync/job status.
- Show empty-state next actions.

### `/onboarding`

Current state:

- Protected.
- Creates/resumes interview session.
- Completion routes to Strategy.

Pending:

- Fix follow-up skip/progress response mismatch.
- Add clear resume/complete status.
- Add recovery for AI/follow-up failures.
- Ensure OAuth new users land here.

### `/strategy`

Current state:

- Protected.
- Generates strategy if no doc exists.
- Shows Strategy Doc and sample posts when available.
- Links toward Sources.

Pending:

- Fix PDF link.
- Improve generation failure/retry/loading states.
- Ensure sample posts are clearly visible after first-run.
- Add global nav entry.
- Make redo strategy discoverable and safe.

### `/sources`

Current state:

- Protected.
- Manual uploads exist.
- GitHub connection panel exists.
- Drive/Notion deferred.
- Copy still mixes Phase 1/Phase 2 language.

Pending:

- Add global nav entry.
- Clarify Free vs Pro access.
- Enforce source integration entitlement server-side.
- Add GitHub job polling and sync completion/error UI.
- Align copy with actual launch capabilities.
- Remove stale “Phase 1 limit” launch copy.

### `/mine`

Current state:

- Protected.
- Requires Strategy Doc.
- Can mine story seeds from chunks.
- Empty state links to Sources.

Pending:

- Add global nav entry.
- Add better empty states for “no strategy”, “no sources”, “chunks processing”, and “no seeds extracted”.
- Show source sync status if chunks are still pending.
- Handle generation errors visibly in story cards.

### `/content`

Current state:

- Protected.
- Lists generated drafts.
- Shows Ship-to-Post inbox when draft metadata indicates that origin.
- Empty state links to Mine.

Pending:

- Add global nav entry.
- Add status filters and scheduling affordance.
- Show calendar status for scheduled drafts.
- Ensure Ship-to-Post drafts only appear when worker/feature/entitlement conditions are satisfied.

### `/content/[id]`

Current state:

- Protected editor exists.
- Draft scheduling API is used from editor.

Pending:

- Verify save/regenerate/schedule failure states.
- Prevent duplicate scheduling.
- Make calendar status obvious.
- Add E2E for edit, approve, schedule.

### `/calendar`

Current state:

- Protected.
- Internal content calendar exists.
- Can schedule unscheduled drafts.

Pending:

- Add global nav entry.
- Fix scheduled drafts reappearing as unscheduled after refresh.
- Prevent duplicate scheduling.
- Unscheduling should clear or reconcile `generated_content.scheduled_for`.
- Clarify that this is internal planning, not auto-publishing.
- Add empty state that routes users to Drafts/Mine.

### `/weekly`

Current state:

- Protected.
- Weekly check-in exists.
- Can link to Weekly Plan after completion.

Pending:

- Add global nav entry.
- Align UI completion requirement with API minimum-answer requirement.
- Add clearer recovery for incomplete/low-signal check-ins.
- Make plan generation path obvious after check-in.

### `/weekly/plan`

Current state:

- Protected.
- Can create story seeds and schedule plan items.

Pending:

- Add global nav entry or clear Weekly subnav.
- Ensure it loads the correct current-week/current-check-in plan, not just latest global plan.
- Prevent duplicate seed creation and duplicate scheduling.
- Add plan history and status clarity.

### `/settings`

Current state:

- Protected.
- Account form exists.
- Tier card exists.
- Integrations placeholder still says Phase 2-style placeholder language.

Pending:

- Update integrations section to reflect GitHub actual status.
- Link to Sources for GitHub setup.
- Show billing state, checkout, portal, cancel/past-due states clearly.
- Show plan entitlements.
- Show data deletion/source disconnection behavior.

### `/pricing`

Current state:

- Public pricing exists.
- Logged-out Pro CTA goes to signup.
- Signed-in Free users can use billing action in pricing block when rendered with user tier.

Pending:

- Preserve Pro intent through signup/login.
- Make Studio CTA non-broken.
- Align pricing claims with quota enforcement.
- Add tests for logged-out and logged-in pricing paths.

## Backend/frontend contract gaps

### Flag module conflict

Problem:

- Untracked `lib/flags.ts` shadows `lib/flags/index.ts`.
- Imports from `@/lib/flags` expect `isFeatureEnabled` and `FeatureFlag`.
- Typecheck fails.
- Tests fail.
- Signup live HTML contains application error markers.

Pending:

- Consolidate flag exports.
- Remove the ambiguous module shape.
- Rerun typecheck, tests, and signup E2E.

### Feature flags are not launch controls yet

Flags exist for billing, GitHub sync, calendar, Ship-to-Post, admin AI ops, beta gate, and NIM routing.

Gaps:

- Checkout route does not enforce `billing`.
- GitHub connect does not enforce `github_sync`.
- Calendar route does not enforce `calendar`.
- Admin AI routes rely on admin auth but not consistently on `admin_ai_ops`.
- Ship-to-Post can enqueue without respecting `TRACE_FEATURE_SHIP_TO_POST`.

Pending:

- Decide whether flags are real rollout controls.
- If yes, enforce them in routes and UI.
- If no, remove misleading disabled-by-default claims from env/docs.

### Entitlements are not consistently enforced

Problem:

- User tier affects AI budget.
- Many feature surfaces are still available to any signed-in user.

Pending:

- Define Free vs Pro entitlements.
- Enforce them server-side.
- Add UI copy for disabled/upgrade states.
- Test denial paths.

### GitHub sync lacks user-visible completion

Problem:

- Sync route returns a job and marks connection as syncing.
- UI does not poll job status or refresh until completion.
- Worker failure/absence is not obvious.

Pending:

- Poll `/api/jobs/:id` or source status.
- Show sync progress, completed counts, skipped counts, and errors.
- Add retry/disconnect/reconnect affordances.
- Add worker health to ops checklist.

### Calendar scheduling can duplicate

Problem:

- Scheduling inserts calendar rows and sets `scheduled_for`.
- Unscheduled query filters only draft status, ignoring scheduled state.
- Scheduled drafts can reappear after refresh.
- Unschedule deletes calendar item but does not fully reconcile generated content scheduling state.

Pending:

- Exclude scheduled drafts from unscheduled list.
- Make scheduling idempotent.
- Reconcile `generated_content.scheduled_for` on unschedule.
- Add tests for schedule, refresh, unschedule, reschedule.

### Weekly plan can duplicate downstream work

Problem:

- Plan actions insert story seeds/calendar items.
- Re-clicking can duplicate items.
- `/weekly/plan` loads latest plan rather than necessarily current check-in/week.

Pending:

- Add idempotency keys.
- Scope plan loading to current user/week/check-in.
- Show created/scheduled status per recommendation.

### Strategy PDF link is wrong

Problem:

- UI links `/strategy/pdf`.
- Implemented route is `/api/strategy/pdf`.

Pending:

- Change link/action to the API endpoint or add the page route.
- Add E2E for download behavior.

## Launch-readiness gaps

Segment 48 is still pending.

The Phase 2 implementation plan requires public-launch hardening, QA, rollout controls, E2E coverage, failure-path QA, analytics validation, and operational runbooks. Current evidence does not meet that bar.

Missing launch evidence:

- Full signup to onboarding to strategy to sample posts flow.
- Full Free first-run flow with mocked AI.
- Full Pro checkout flow in Stripe test mode.
- Webhook upgrade/downgrade/past-due evidence.
- GitHub OAuth connect with sandbox account.
- Repo selection persistence.
- Worker-backed repo sync.
- Ship-to-Post draft review.
- Integrated-source story seed generation.
- Content scheduling.
- Calendar refresh/duplicate behavior.
- Weekly plan scheduling.
- Revoked GitHub token behavior.
- Redis outage behavior.
- AI provider outage behavior.
- Exhausted budget behavior.
- Stripe webhook delay behavior.

Missing analytics/observability:

- `signup_completed`
- `strategy_generated`
- `source_connected`
- `source_sync_started`
- `source_sync_completed`
- `story_seed_reviewed`
- `content_approved`
- `calendar_item_scheduled`
- Alert evidence for API 5xx.
- Alert evidence for queue backlog age.
- Alert evidence for Stripe webhook delay.
- Alert evidence for source sync failures.
- Alert evidence for provider failure and budget spikes.

## Pending changes for Phase 2

### P0 launch blockers

1. Fix the `@/lib/flags` module conflict causing typecheck/test failures and signup runtime error.
2. Add authenticated app navigation or app shell.
3. Add Dashboard first-run checklist and state-aware next actions.
4. Fix OAuth signup/login so new users cannot bypass onboarding.
5. Preserve Pro purchase intent through signup/login.
6. Add real Pro checkout path from public pricing.
7. Define and enforce Free vs Pro entitlements server-side.
8. Fix onboarding follow-up skip/progress API mismatch.
9. Fix Strategy PDF link.
10. Fix calendar duplicate scheduling/unscheduled-drafts behavior.
11. Add GitHub sync polling and visible failure/completion states.
12. Complete Segment 48 verification with real launch evidence.

### P1 high-priority launch readiness

1. Add route-level feature flag enforcement for billing, GitHub sync, calendar, Ship-to-Post, and admin AI ops.
2. Align pricing promises with actual quota enforcement.
3. Update Sources and Settings copy to match actual Phase 2 capabilities.
4. Add app-wide empty states for no strategy, no sources, no seeds, no drafts, no scheduled content.
5. Add plan-aware upgrade prompts at Pro-only actions.
6. Add source worker deployment and health checks.
7. Make weekly plan actions idempotent.
8. Add analytics events required by launch funnel docs.
9. Add failure-path QA for Stripe, GitHub, Redis, AI provider, and budget exhaustion.
10. Remove or production-gate local dev surfaces.

### P2 polish and support

1. Add plan badge and current usage summary to app shell.
2. Add sync history/details pages or modals for source connections.
3. Add content filters for drafts, scheduled, approved, and Ship-to-Post.
4. Add plan history and current-week scoping in Weekly Plan.
5. Add support/runbook links for webhook replay, source reconnect, and queue recovery.
6. Update README from Phase 1 language to actual Phase 2 launch status.
7. Add screenshots or evidence links to launch checklist.

## What Phase 2 should feel like when fixed

### Logged out

Visitor can understand the product, choose Free or Pro, create an account, and know exactly what happens next. Pro intent is preserved. Signup does not error.

### Logged in but not onboarded

User is sent to onboarding or sees a large, obvious “Start interview” action. They are not stranded on a metrics dashboard with no data.

### Logged in on Free/Basic

User can complete onboarding, generate strategy, see sample posts, upload limited sources, mine story seeds, generate drafts within budget, and understand what Pro unlocks. Every major section is visible in navigation.

### Logged in on Pro

User can upgrade, see Pro status, connect GitHub, select repos, sync, see progress, generate from integrated sources, review Ship-to-Post drafts, schedule content internally, and run weekly planning. Entitlements and quotas match pricing.

## Bottom line

The Phase 2 codebase has many important pieces, but the launch product is not wired together yet. The missing work is primarily:

- app navigation
- first-run journey
- onboarding-state routing
- Pro acquisition and entitlements
- backend/frontend contract fixes
- launch verification evidence

Until those are done, Phase 2 should stay marked as pending, even if individual implementation segments look mostly complete.
