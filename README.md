# Trace

Trace is a strategy-first content engine for builders. This branch contains the
public marketing site: a dark, minimal Next.js App Router site that explains the
product journey from positioning to source-backed content and routes visitors to
the waitlist.

## Frontend Stack

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- Lucide icons
- Playwright smoke tests

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
```

Playwright starts the dev server automatically for tests.

## Routes

- `/` - Home journey: hero, origin, source proof, pricing, waitlist
- `/story` - Problem, point of view, and founder-note draft
- `/product` - Feature walkthrough with static product visuals
- `/pricing` - Tiers, comparison table, FAQ
- `/waitlist` - Standalone signup page with tier-aware query params
- `/_dev/kit` - Unlinked component kitchen sink for QA

## Editing Copy

Marketing copy lives in `content/copy.ts`. Pricing tiers live in
`content/pricing.ts`. Product visuals are static components in
`components/visuals/`; they do not call AI or connect to data sources.

## Waitlist Stub

`/api/waitlist` validates and logs submissions only. Durable persistence,
Resend, Supabase, auth, billing, and AI pipelines belong to the main
implementation plan and are intentionally out of scope for this branch.

## Deploy

The site is ready for Vercel:

```sh
npx pnpm build
```

Set `NEXT_PUBLIC_SITE_URL` in Vercel when the production domain is known so
Open Graph, sitemap, and robots metadata use the final URL.
