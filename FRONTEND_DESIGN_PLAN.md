# Trace — Frontend (Marketing Site) Design Plan

> Companion to `IMPLEMENTATION_PLAN.md`. This plan covers ONLY the public-facing
> marketing site on the `frontend-design` branch. It does not cover the
> authenticated app, onboarding interview, or any AI pipelines — those live in
> the main implementation plan.
>
> **Branch:** `frontend-design` (cut from `main`)
> **Status:** Not started — segments below are atomic and independently completable.
> **Source of truth for product copy:** `trace_spec.md`. When in doubt, the spec wins.

---

## 1. What we are building

A small, fast, dark-mode marketing site for **Trace** — the content engine
that turns a builder's real work (commits, decisions, lessons) into
publish-ready posts. The site has one job: convince a builder, founder, or
solopreneur in under 30 seconds that Trace is *not* another generic AI content
tool, and get them onto the waitlist.

The site is **not** the product. There is no auth, no dashboard, no real
content generation here. Anything that looks "live" (chapter card, source
citation card, voice bar) is a static visual prop that illustrates the
product idea.

### Audience

Same as the spec (Section 3): vibecoders, solopreneurs, career switchers,
consultants. They are technical or technical-adjacent, allergic to corporate
SaaS sites, and they will close the tab the moment they see a stock-photo
team or a purple gradient.

### Voice

Direct, confident, slightly dry. The product line is *"Content from proof,
not prompts."* Every page should feel like it was written by the same person
who shipped the product — not by a marketing department.

---

## 2. Design language

**Mood:** Linear / Raycast / Vercel — dark, restrained, code-adjacent. No
illustration, no gradient soup, no glassy buttons, no animated blobs.

**Inspiration set:** the four reference screens supplied by the user
(hero with chapter card, "private origin" feature grid, source-quote +
platform list, three-tier pricing). The implementation should match those
screens in spirit and proportion, not pixel-for-pixel.

### Tokens

| Token | Value | Notes |
|---|---|---|
| `bg` | `#070808` | App background — near-black, very slightly warm |
| `bg-elev` | `#0E1010` | Card surface |
| `border` | `rgba(255,255,255,0.06)` | Default hairline |
| `border-strong` | `rgba(255,255,255,0.12)` | Hover / focused card |
| `text` | `#EDE6D6` | Primary cream — the headline color |
| `text-muted` | `rgba(237,230,214,0.62)` | Body copy |
| `text-dim` | `rgba(237,230,214,0.42)` | Captions, meta |
| `accent` | `#3DDC97` | Mint/emerald — eyebrows, dots, glow |
| `accent-soft` | `rgba(61,220,151,0.14)` | Glow / pill background |
| `danger` | `#F47174` | Reserved, used sparingly |

A single radial glow (accent at ~10% alpha, ~900px) sits behind hero and
pricing sections. That is the entire "gradient" budget for the whole site.

### Typography

- **Display + body:** one geometric sans (Geist Sans is the default; Inter is
  the fallback). Weights 400/500/700.
- **Eyebrow + meta + numbers:** monospace (Geist Mono or JetBrains Mono).
  Always uppercase, tracked +0.08em.
- **Display sizing scale:** 80 / 64 / 48 / 32 / 24 / 18. Body is 16. Mono
  eyebrow is 12.
- **Line height:** 1.05 on display, 1.5 on body, 1.4 on UI.

### Components-as-language

- **Pill buttons** (fully rounded). Primary = cream fill on dark; secondary =
  hairline border, no fill.
- **Cards** = 24px radius, 1px border, subtle inner shadow, optional accent
  glow on featured tiles only.
- **Numbered chips** = 24px circle, mono `01`, hairline border.
- **Eyebrow** = small mono uppercase accent label that introduces every
  section. This is the connective tissue of the whole site.

### What we never do

- Purple→pink gradients, mesh backgrounds, animated grids
- Stock photos, abstract people illustrations, 3D blobs
- Emoji as decoration
- More than one accent color
- Drop shadows on text
- "Glassmorphism" with heavy blur

---

## 3. Page inventory & routing

App Router under `app/`. All pages are server components; only interactive
islands (mobile menu, waitlist form, FAQ accordion) are client components.

| Route | Purpose | Sourced from |
|---|---|---|
| `/` | Home — hero → origin → source/trust → pricing → waitlist CTA | Spec §1, §4, §6, §10 |
| `/story` | Why Trace exists. Problem statement, founder note, manifesto | Spec §2, §3 |
| `/product` | Deeper feature walkthrough: Strategy Doc, Source Mining, Voice, Anti-Slop, Voice-First | Spec §4, §5, §6, F14 |
| `/pricing` | Full pricing + comparison + FAQ | Spec §10 |
| `/waitlist` | Standalone signup page (also reachable as a strip from `/`) | n/a |
| `404` | Not-found, on-brand | n/a |

Nav: `Story`, `Product`, `Pricing`, with `Join Waitlist` as the right-side
CTA. Logo lockup links to `/`.

---

## 4. Tech stack (pinned for this plan)

Aligned with `trace_spec.md` §11 — but scoped down to what the marketing
site needs.

- **Framework:** Next.js 15 App Router, React 19, TypeScript strict
- **Package manager:** pnpm
- **Styling:** Tailwind CSS v4 + a small set of CSS variables for tokens
- **UI primitives:** hand-rolled (no shadcn install for the marketing site —
  it would import dialogs/sheets we don't need). Borrow the *patterns* from
  shadcn but write the components flat.
- **Fonts:** `next/font` with Geist Sans + Geist Mono
- **Icons:** `lucide-react` (used sparingly, never decoratively)
- **Forms:** native `<form>` + a server action for the waitlist; no React
  Hook Form / Zod required at this scope
- **Animation:** CSS only. Optional `framer-motion` is allowed for *one*
  thing (entrance fade on hero) — anything more is over-budget.
- **Deploy target:** Vercel
- **Lint/format:** ESLint (Next config) + Prettier
- **Testing:** none for the marketing site. Visual review is the bar.

The waitlist endpoint is stubbed in S9/S13 — it accepts the email and
returns success. Wiring it to Resend or Supabase is explicitly **out of
scope** for this branch and belongs to the main implementation plan.

---

## 5. File layout (target)

```
app/
  layout.tsx                  # root layout, fonts, metadata, ambient bg
  page.tsx                    # home
  story/page.tsx
  product/page.tsx
  pricing/page.tsx
  waitlist/page.tsx
  not-found.tsx
  globals.css                 # tokens, base reset, Tailwind directives
  api/waitlist/route.ts       # stub POST endpoint (S13)
components/
  ui/
    button.tsx
    pill.tsx
    eyebrow.tsx
    card.tsx
    numbered.tsx
    icon-button.tsx
  site/
    header.tsx
    footer.tsx
    mobile-menu.tsx           # client
    ambient-glow.tsx
  sections/
    hero.tsx
    origin.tsx
    source-trust.tsx
    pricing-block.tsx
    waitlist-strip.tsx
  visuals/
    chapter-card.tsx          # the "TRACE / SOURCE" prop in the hero
    source-quote-card.tsx
    platform-row.tsx
content/
  copy.ts                     # all marketing strings, in one file
  pricing.ts                  # the three tiers, structured
lib/
  cn.ts                       # tiny clsx helper
public/
  og.png                      # generated in S14
```

The `content/` directory is intentional: it lets a future writer (or AI) edit
copy without touching JSX.

---

## 6. Segments

15 atomic segments. Each one is sized to be completable in one focused
session by any competent agent without needing the others to be finished
first (within the dependency arrows shown). Each segment lists its goal,
deliverables, and a clear acceptance bar so a different AI can pick up
mid-stream.

> **Operating rules for whoever picks up a segment:**
> 1. Do not move the goalposts. Build only what the segment asks for.
> 2. Do not introduce new dependencies. The pinned stack is the stack.
> 3. After finishing, tick the row in the status table at the bottom and
>    commit. One segment per commit unless trivial.
> 4. If the spec and this plan disagree, the **spec wins** — fix this plan
>    in the same commit.

---

### S1 — Scaffold & tooling

**Depends on:** nothing
**Goal:** A clean Next.js 15 App Router project that builds, lints, and
serves a blank white page.

**Deliverables:**
- `package.json` with pnpm scripts (`dev`, `build`, `start`, `lint`,
  `typecheck`, `format`)
- `next.config.ts`, `tsconfig.json` (strict), `.eslintrc`, `.prettierrc`
- `app/layout.tsx` with bare `<html><body>{children}</body></html>` and a
  placeholder title
- `app/page.tsx` returning the string "Trace"
- `app/globals.css` with only Tailwind directives
- `tailwind.config.ts` with default content paths
- Updated `.gitignore` (Next, node_modules, .env)
- `lib/cn.ts`

**Acceptance:** `pnpm install && pnpm dev` boots on `localhost:3000` and
shows "Trace" in default browser styles. `pnpm build` succeeds.
`pnpm lint` and `pnpm typecheck` pass.

---

### S2 — Design system foundation

**Depends on:** S1
**Goal:** Tokens, typography, ambient background, and the visual base that
every page inherits.

**Deliverables:**
- Tailwind config extended with the token palette from §2 (colors, radius,
  font families, spacing).
- `app/globals.css` adds CSS variables for all tokens, base reset, scrollbar
  styling, selection color (accent at low alpha).
- Geist Sans + Geist Mono wired through `next/font` in `app/layout.tsx`,
  exposed as `--font-sans` and `--font-mono`.
- Default `body` background is `bg`, default text is `text-muted`.
- `components/site/ambient-glow.tsx` — a fixed, behind-everything radial
  glow component that the root layout mounts once. Renders nothing on
  prefers-reduced-motion if we ever animate it (we don't, but the hook is
  there).
- `app/layout.tsx` sets metadata: title `"Trace — Content from proof, not
  prompts."`, description from spec, icons (placeholder favicon).

**Acceptance:** Open `/`, the page is dark, body text is cream-muted, fonts
load without a flash of fallback, and a single subtle green glow is visible
top-right. Lighthouse contrast for body text ≥ 4.5:1.

---

### S3 — UI primitives

**Depends on:** S2
**Goal:** The five components that make the rest of the site composable.

**Deliverables (all in `components/ui/`):**
- `button.tsx` — variants: `primary` (cream pill), `ghost` (hairline pill),
  `link` (text-only with arrow). Sizes: `md`, `lg`. Optional `trailing`
  slot for an arrow icon. Forwards refs.
- `pill.tsx` — small rounded badge for things like `BEST FIT` and
  `VOICE 82%`. Variants: `accent`, `mono`.
- `eyebrow.tsx` — uppercase mono label with a leading dot. Color defaults
  to accent. This is the most-reused component on the site.
- `card.tsx` — base surface: 24px radius, hairline border, `bg-elev`
  background. Props: `glow?: boolean` adds an accent shadow on the
  bottom-right.
- `numbered.tsx` — circular mono number chip (`01`, `02`, …) used in
  feature cards and the chapter visual.
- `icon-button.tsx` — square icon button used in the platform-row visual
  (the document icon next to LinkedIn / Instagram / etc).

Add a hidden, dev-only kitchen sink at `app/_dev/kit/page.tsx` that mounts
every primitive in every variant. Not linked in nav. Not in production
nav. Useful for QA in S15.

**Acceptance:** `/_dev/kit` renders every component in every variant
without console warnings. Buttons have visible focus rings (accent at low
alpha, 2px). Keyboard tab order is correct.

---

### S4 — Site chrome (header + footer)

**Depends on:** S3
**Goal:** Header and footer that appear on every page.

**Deliverables:**
- `components/site/header.tsx` — server component. Sticky, `bg/80` with
  backdrop blur, hairline bottom border that only appears on scroll (use
  CSS `container` query or a tiny client wrapper if needed; if scroll
  behavior is non-trivial, ship without it — the fixed border is
  acceptable). Logo lockup on the left (the `T` mark + `TRACE`
  wordmark — both implemented inline in SVG, no image asset). Three nav
  links centered. `Join Waitlist` ghost-pill on the right.
- `components/site/mobile-menu.tsx` — client. Hamburger that opens a
  full-screen overlay with the same nav links stacked. Closes on route
  change. ESC closes.
- `components/site/footer.tsx` — server. Three columns: brand + tagline,
  product links, company/legal links. Tiny feather glyph from the pricing
  reference. Bottom strip: copyright + "Built by Vismay Rathod".
- Mount header and footer in `app/layout.tsx`.

**Acceptance:** Every existing page now has a working nav and footer. The
mobile menu opens and closes cleanly at <768px. Active nav link is
indicated (accent dot under the label).

---

### S5 — Home: Hero

**Depends on:** S3, S4
**Goal:** The first screenful. Matches reference image #1 in spirit.

**Deliverables:**
- `components/sections/hero.tsx` — two-column on desktop, stacked on
  mobile. Left: eyebrow `YOU SHIP CODE. TRACE SHIPS YOUR STORY.`, big
  display headline `Content from proof, not prompts.`, subcopy paragraph
  pulled from `content/copy.ts`, two pill buttons (`Start with strategy →`
  primary, `Read the story` ghost). Right: the chapter-card visual.
- `components/visuals/chapter-card.tsx` — the dark glass card showing
  `TRACE / SOURCE` header with `VOICE 82%` pill in the corner, then three
  rows of `CHAPTER 01/02/03` with titles `A decision`, `A sharp lesson`,
  `A post with proof`. Pure CSS — no real interactivity. Includes the
  diagonal beam line that crosses the card from upper-left to
  lower-right (a single rotated 1px element with accent gradient at low
  alpha).
- Mount hero on `app/page.tsx`.

**Acceptance:** Hero looks like the reference image at 1440 width, scales
without breaking down to 360 width, and the CTAs work (primary →
`/waitlist`, ghost → `/story`).

---

### S6 — Home: Origin section

**Depends on:** S3
**Goal:** "Every public idea has a private origin." — matches reference
image #2.

**Deliverables:**
- `components/sections/origin.tsx` — left column: eyebrow `THE WEBSITE
  SHOULD TELL THE SAME STORY` (kept verbatim from the reference; it is
  intentionally meta), big display heading `Every public idea has a
  private origin.`. Right column: 2×2 grid of `Card` components. Each
  card has a small mono index (`01`–`04`) and a heading + 2-line
  description.
- Card content (from spec):
  - 01 — `Strategy before generation` — points at the Strategy Doc moat (§4 L1)
  - 02 — `Source citations on every post` — points at F5 source-attribution
  - 03 — `Anti-slop rules baked in` — points at §6 Anti-Slop Engine
  - 04 — `Voice calibration loop` — points at F9
- Description copy lives in `content/copy.ts`, written by hand — do not
  paste boilerplate from the reference image.

**Acceptance:** Section renders below hero on `/`, grid becomes a single
column under 768px, all four cards have real spec-grounded descriptions.

---

### S7 — Home: Source & trust section

**Depends on:** S3
**Goal:** Quote card + platform list + bottom 3-column trust strip.
Matches reference image #3.

**Deliverables:**
- `components/visuals/source-quote-card.tsx` — left tile. `SOURCE` eyebrow
  with a small branch glyph, then a pulled-quote (`"I spent 3 hours
  debugging OAuth. The fix was one trailing slash."`), then a mono
  citation line (`↳ Based on commit to auth-service, March 15, 2026`).
- `components/visuals/platform-row.tsx` — right tile. Four stacked rows:
  LinkedIn, Instagram, X thread, Substack. Each row is a thin pill with
  the platform name on the left and a document icon on the right. No
  logos — typography only. Hover state lifts the row by 1px.
- `components/sections/source-trust.tsx` — composes the two visuals
  side-by-side, then below them a 3-column grid of trust statements with
  small lucide icons:
  - Shield → `Encrypted, deletable, and never used to train models.`
  - Sparkle → `Rejects generic hooks, fake vulnerability, and
    LinkedIn-bro slop.`
  - Quote → `Every draft ends with the proof of where the story came
    from.`

**Acceptance:** Section renders below origin on `/`, columns collapse
gracefully, the citation line uses the mono font and accent color.

---

### S8 — Home: Pricing block

**Depends on:** S3
**Goal:** Three-tier pricing as a section on `/`. Reusable on
`/pricing`. Matches reference image #4.

**Deliverables:**
- `content/pricing.ts` — exports a `PRICING_TIERS` array with three
  entries (Strategy Only, Pro, Studio). Each entry: `name`, `price`,
  `cadence`, `tagline`, `features: string[]`, `cta: { label, href }`,
  `featured: boolean`.
- `components/sections/pricing-block.tsx` — header eyebrow `PRICING`,
  display heading `Start with positioning. Pay when Trace becomes your
  engine.`, then a 3-column grid of pricing cards. The featured card
  (`Pro`) gets the accent border, accent glow, and a `BEST FIT` pill in
  the top-right. Each card: name, big price, cadence (`/ month`),
  tagline, checklist of features (lucide `check` in accent), CTA pill
  (primary on featured, ghost on others).
- All copy comes from spec §10. Do not invent features.

**Acceptance:** Section renders on `/`, columns stack on mobile, the
featured card visibly stands out, and clicking any CTA goes to
`/waitlist?tier=<slug>`.

---

### S9 — Home: Waitlist strip + stub endpoint

**Depends on:** S3
**Goal:** The closing section of `/` and the API stub the form posts to.

**Deliverables:**
- `components/sections/waitlist-strip.tsx` — short headline (`The waitlist
  is open.`), one-line subcopy, an inline `<form>` with email input and a
  primary pill submit button. Server action `joinWaitlist` validates the
  email shape and POSTs to `/api/waitlist`. On success, swap to a thank-you
  state (`You're in. Watch your inbox for the strategy preview.`). On
  error, inline message under the field.
- `app/api/waitlist/route.ts` — stub `POST` handler. Validates email with
  a small regex, logs the email to the server console, returns
  `{ ok: true }`. **No external service call.** A `TODO(spec):` comment
  notes that the real wiring (Resend/Supabase) belongs to the main
  implementation plan.
- Form is progressive-enhancement friendly: submitting without JS still
  hits the route handler.

**Acceptance:** Submitting a valid email shows the success state without
a full page reload. Submitting an invalid email shows the inline error.
The route logs the address.

---

### S10 — `/story` page

**Depends on:** S4, S3
**Goal:** The "why Trace exists" page. The user clicks "Read the story"
on the hero and lands here.

**Deliverables:**
- `app/story/page.tsx` — long-form, single-column page (max-width ~720px
  for body, 880 for headings). Sections, in order:
  1. Eyebrow `THE STORY` + headline (`The blank box problem.`)
  2. The pain: builders ship real work, post nothing. Direct rewrite of
     spec §2.
  3. The wrong tools: why generic AI content is worse than nothing. Pulls
     from spec §6.
  4. The bet: positioning before generation; proof before prompts. Pulls
     from spec §4 (Layer 1).
  5. Founder note from Vismay (3–4 short paragraphs, signed). Treat this
     as a placeholder draft to be edited later — leave a `TODO(copy):`
     comment.
  6. Closing CTA: pill button to `/waitlist`.
- All section transitions use the same eyebrow → heading → body rhythm.
- Reuses `Eyebrow`, `Card`, `Button` — no new primitives.

**Acceptance:** Page renders, reads top-to-bottom without horizontal
scroll on any breakpoint, and links from the hero `Read the story` CTA
land here.

---

### S11 — `/product` page

**Depends on:** S4, S3
**Goal:** Deeper feature walkthrough. The "I'm interested, show me what
it does" page.

**Deliverables:**
- `app/product/page.tsx` — alternating left/right feature blocks. Each
  block has eyebrow + heading + body + a static visual on the other
  side. Sections (in order, with spec references):
  1. **Strategy Doc** (Layer 1) — visual: a stylized one-page doc card
     with section labels (`POSITIONING`, `PILLARS`, `VOICE PROFILE`,
     etc).
  2. **Work mining** (F3, F4) — visual: the source-quote card from S7,
     reused.
  3. **Voice-first check-ins** (F14) — visual: a static "voice bar" with
     a microphone glyph and a fake live transcript line.
  4. **Anti-slop engine** (§6) — visual: a list of refusals with red
     strikethroughs (`"hot take:"`, `"in today's fast-paced world"`,
     `"as someone who"`…).
  5. **Four formats, one source** (§8) — visual: the platform-row
     component from S7, reused.
- Closing strip: pill CTA `Start with strategy →` to `/waitlist`.

**Acceptance:** All five feature blocks render, each with a real visual
prop (no `<img>` placeholders), and the page reads as a coherent
walkthrough top to bottom.

---

### S12 — `/pricing` page

**Depends on:** S8
**Goal:** Full pricing page with comparison table and FAQ.

**Deliverables:**
- `app/pricing/page.tsx` — reuses `PricingBlock` at the top. Below it:
  - **Comparison table** — 4 rows × 4 columns (feature, Strategy Only,
    Pro, Studio). Rows: source integrations, manual uploads, voice
    calibration, multi-brand. Use `✓` / `—` glyphs in accent / dim
    colors.
  - **FAQ accordion** — 6 questions, hand-written, each grounded in the
    spec. Suggested set: pricing-vs-cost, refund policy, data
    deletion, model choice, posting cadence guidance, what happens
    after the strategy doc. Implemented as a small client component
    using native `<details>` for zero JS surface.
- All copy is real, written for this site. Not copy-pasted from the
  reference.

**Acceptance:** Page renders, the comparison row is legible at 360
width (table becomes vertically stacked cards on mobile), all FAQ items
expand and collapse without layout shift.

---

### S13 — `/waitlist` page

**Depends on:** S9
**Goal:** A standalone, focused signup page for traffic that lands here
directly (e.g. from the nav CTA, from a tweet).

**Deliverables:**
- `app/waitlist/page.tsx` — centered single-column layout. Eyebrow
  `WAITLIST`, big heading (`Get in line for proof-based content.`),
  one-paragraph subcopy, then the same `<form>` from S9 — but bigger,
  with two extra optional fields: `What are you building?` (textarea)
  and `Which platform matters most?` (a row of pill toggles for
  LinkedIn / Instagram / X / Substack). Optional fields are sent to
  the same `/api/waitlist` endpoint and logged.
- Reads `?tier=<slug>` from the URL (query param set by pricing CTAs in
  S8) and shows a small "Selected: Pro" pill above the form. Removable.
- Success state: full-page thank-you with the `TRACE` mark, a one-line
  message, and a link back to `/story`.

**Acceptance:** Page renders, optional fields submit successfully, the
`?tier=` query param is reflected in the UI when present, and the
post-submit state replaces the form without a route change.

---

### S14 — 404, metadata, OG, sitemap, robots

**Depends on:** S2 (tokens), S4 (chrome)
**Goal:** Everything around the pages that a search engine or social
crawler sees.

**Deliverables:**
- `app/not-found.tsx` — on-brand 404. Eyebrow `404 / NOT FOUND`,
  headline (`This page didn't ship.`), subcopy, primary pill back to
  `/`. Reuses chrome from S4.
- Per-route `generateMetadata` for all five public routes. Each route
  sets `title`, `description`, and `openGraph` keys.
- `app/opengraph-image.tsx` — a Next OG-image route that renders the
  TRACE wordmark + tagline on the dark background. Single static OG
  image is fine; per-route OG is out of scope.
- `app/robots.ts` and `app/sitemap.ts` — both small, both hand-written.
  Sitemap lists the five public routes. Robots allows everything.
- Favicon: a single `app/icon.tsx` rendering the `T` mark on the accent
  color at 32×32. Apple touch icon at 180×180.

**Acceptance:** Visiting `/garbage` shows the on-brand 404. The OG image
loads at `/opengraph-image`. `/robots.txt` and `/sitemap.xml` both
serve. Lighthouse SEO score ≥ 95 on `/`.

---

### S15 — Polish & QA

**Depends on:** all prior
**Goal:** Make the site feel finished. This is not a "polish if time
permits" segment — without it, the site looks 80% done.

**Deliverables (a checklist, not a feature list):**
- Hover and focus states on every interactive element. Focus ring is
  the same color and width everywhere (accent at 60% alpha, 2px,
  2px offset).
- Keyboard nav order is correct on every page. ESC closes the mobile
  menu. ENTER submits the waitlist form.
- All images / SVGs have `alt` text or `aria-hidden`.
- All breakpoints reviewed at 360 / 768 / 1024 / 1440. No horizontal
  scroll anywhere. No text smaller than 12px.
- One subtle entrance animation on the hero (8px translate-up + fade,
  300ms, once on mount). Anything more is over-budget.
- `prefers-reduced-motion` honored — entrance animation skipped.
- Lighthouse on `/`: Performance ≥ 95, Accessibility ≥ 95, Best
  Practices ≥ 95, SEO ≥ 95.
- Manual run-through: load `/`, click every nav link, click every CTA,
  open the mobile menu, submit the waitlist form with valid + invalid
  input.
- Update root `README.md` with: how to run, how to build, how to deploy
  to Vercel, where copy lives (`content/`).

**Acceptance:** The site is link-shareable. A real builder loading it on
a phone in a coffee shop would not bounce.

---

## 7. Status

Mark `Done` only when the segment's acceptance criteria pass. One row =
one segment = (ideally) one commit.

| #  | Segment                          | Status      | Notes |
|----|----------------------------------|-------------|-------|
| S1 | Scaffold & tooling               | Done | 2026-04-30 — Next 15, React 19, Tailwind 4, pnpm, lint/typecheck/build scripts. |
| S2 | Design system foundation         | Done | 2026-04-30 — Tokens, Geist fonts, global base styles, ambient glow. |
| S3 | UI primitives                    | Done | 2026-04-30 — Buttons, pills, eyebrow, card, numbered chip, icon button, dev kit. |
| S4 | Site chrome (header + footer)    | Done | 2026-04-30 — Responsive header, mobile menu, footer, nav states. |
| S5 | Home: Hero                       | Done | 2026-04-30 — Hero with chapter/source visual and working CTAs. |
| S6 | Home: Origin section             | Done | 2026-04-30 — Private-origin feature grid grounded in the spec. |
| S7 | Home: Source & trust section     | Done | 2026-04-30 — Source quote, platform rows, trust strip. |
| S8 | Home: Pricing block              | Done | 2026-04-30 — Reusable three-tier pricing block with tier query links. |
| S9 | Home: Waitlist strip + stub API  | Done | 2026-04-30 — Waitlist form, server action, API route, validation. |
| S10| `/story` page                    | Done | 2026-04-30 — Long-form story page and founder-note placeholder. |
| S11| `/product` page                  | Done | 2026-04-30 — Five-part feature walkthrough with static visuals. |
| S12| `/pricing` page                  | Done | 2026-04-30 — Pricing page, comparison table, FAQ. |
| S13| `/waitlist` page                 | Done | 2026-04-30 — Standalone tier-aware waitlist flow with optional fields. |
| S14| 404 + metadata + OG + SEO        | Done | 2026-04-30 — Not found, route metadata, OG image, icon, robots, sitemap. |
| S15| Polish & QA                      | Done | 2026-04-30 — Responsive polish, Playwright tests, README docs, visual QA. |

---

## 8. Out of scope (explicitly)

So a future agent does not start sliding sideways:

- Authentication, sign-in, sign-up, sessions
- The onboarding interview (F1)
- Strategy Doc generation, viewing, or editing (F2)
- Source connections, file uploads (F3)
- Content generation in any form (F5)
- Voice check-ins as a real feature (F14) — only the static visual prop on
  `/product` is in scope
- Database, Drizzle, Supabase wiring
- Stripe / billing
- Analytics, PostHog, Sentry
- Real waitlist persistence (Resend, Supabase) — the endpoint is a stub
- i18n
- A blog, changelog, or docs section
