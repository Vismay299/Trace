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

## Routes

- `/` - Home journey: hero, origin, source proof, pricing, waitlist
- `/story` - Problem, point of view, and founder-note draft
- `/product` - Feature walkthrough with static product visuals
- `/pricing` - Tiers, comparison table, FAQ
- `/waitlist` - Standalone signup page with tier-aware query params
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
- Phase 1 intentionally skips embeddings and async queues.
- Billing and source integrations beyond manual uploads are Phase 2 placeholders.

## Deploy

The app is ready for Vercel:

```sh
npx pnpm build
```

Required production services are Postgres/Supabase, Supabase Storage, NextAuth
secrets/providers, OpenRouter, and Resend. Set `NEXT_PUBLIC_SITE_URL` in Vercel
when the production domain is known so Open Graph, sitemap, and robots metadata
use the final URL.
