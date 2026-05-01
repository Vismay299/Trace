# Trace

Trace is a strategy-first content engine for builders. This Phase 1 build turns
an onboarding interview, uploaded source material, and weekly check-ins into
source-backed content drafts with model routing, budget controls, voice-first
input, anti-slop checks, and narrative planning.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- Drizzle ORM + Postgres
- NextAuth
- Supabase Storage
- OpenRouter
- Resend
- Recharts
- Vitest and Playwright

## Run Locally

```sh
npx pnpm install
npx pnpm dev
```

The dev server runs at `http://localhost:3000`.

Phase 2 local services are flag-gated. For billing, queue, and integration
work, run Postgres/Supabase as before plus Redis:

```sh
redis-server
npx pnpm workers:dev
```

Use Stripe test mode and a GitHub sandbox OAuth/App account for local provider
testing. Stripe requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
`STRIPE_PRO_PRICE_ID` only when `TRACE_FEATURE_BILLING=true`. The optional NIM
routing experiment requires `NVIDIA_NIM_API_KEY` only when
`TRACE_FEATURE_NIM_ROUTING=true`; OpenRouter remains the primary launch route.

## Quality Checks

```sh
npx pnpm typecheck
npx pnpm lint
npx pnpm build
npx pnpm test
npx pnpm test:e2e
```

Playwright starts the dev server automatically for tests. The authenticated
golden-path E2E is present but skipped unless `TRACE_E2E_FULL=true` is set with
a seeded Postgres/OpenRouter test environment.

## Public Launch Controls

Launch access is controlled with `TRACE_FEATURE_BETA_GATE`. When it is `true`,
new email/password signups must match `TRACE_BETA_ALLOWED_EMAILS` or provide a
code from `TRACE_BETA_ACCESS_CODES`; everyone else is directed to the waitlist.

Keep Phase 2 feature gates off until their launch checks pass:

- `TRACE_FEATURE_BILLING`
- `TRACE_FEATURE_GITHUB_SYNC`
- `TRACE_FEATURE_CALENDAR`
- `TRACE_FEATURE_SHIP_TO_POST`
- `TRACE_FEATURE_ADMIN_AI_OPS`
- `TRACE_FEATURE_NIM_ROUTING`

Operational launch docs live in `docs/launch/`:

- `checklist.md`
- `failure-path-qa.md`
- `analytics-funnel.md`
- `runbooks.md`

## Routes

- `/` - Home journey: hero, origin, source proof, pricing, waitlist
- `/story` - Problem, point of view, and founder-note draft
- `/product` - Feature walkthrough with static product visuals
- `/pricing` - Tiers, comparison table, FAQ
- `/waitlist` - Standalone signup page with tier-aware query params
- `/legal/terms` - Terms of Service
- `/legal/privacy` - Privacy Policy
- `/legal/data-use` - Data-use disclosure
- `/onboarding` - Strategy interview with text/voice input
- `/strategy` - Strategy Doc generation, edit, regeneration, and PDF
- `/sources` - Manual source uploads and parsing
- `/mine` - Source-backed story seeds
- `/content` - Generated drafts and feedback
- `/weekly` - Voice-first weekly check-in with low-signal mode
- `/weekly/plan` - Weekly narrative plan and plan-to-story conversion
- `/dashboard` - Production stats, pillar balance, activity, AI budget
- `/settings` - Profile, tier, integrations placeholder, data deletion
- `/_dev/kit` - Unlinked component kitchen sink for QA

## Phase 1 Notes

- Every LLM call goes through `lib/ai/client.ts`.
- Weekly AI budgets are enforced in `lib/ai/budget.ts`.
- Prompt templates live in `prompts/` and are provider-portable.
- Email/password, Google OAuth, and GitHub OAuth are wired through NextAuth.
  Auth supports both `AUTH_*` names and the existing Vercel/NextAuth aliases:
  `NEXTAUTH_SECRET`, `GITHUB_CLIENT_*`, and `GOOGLE_CLIENT_*`.
- Phase 1 intentionally skips embeddings and async queues.
- Billing and source integrations beyond manual uploads are Phase 2 placeholders.
- Phase 2 launch work is tracked in `PHASE_2_IMPLEMENTATION_PLAN.md`. Segments
  29-33 add flags/env validation, observability, Stripe billing, Pro gating,
  Redo Strategy, and Redis/BullMQ worker scaffolding behind feature flags.

## Deploy

The app is ready for Vercel:

```sh
npx pnpm build
```

Required production services are Postgres/Supabase, Supabase Storage, NextAuth
secrets/providers, OpenRouter, and Resend. Set `NEXT_PUBLIC_SITE_URL` in Vercel
when the production domain is known so Open Graph, sitemap, and robots metadata
use the final URL.
