# TRACE — Product Specification & Source of Truth

> **Tagline:** "You ship code. Trace ships your story."
>
> **Last Updated:** April 28, 2026
>
> **Status:** Pre-build — this document is the canonical reference for all development.

---


1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Target Audience](#3-target-audience)
4. [Product Architecture — Two Layers](#4-product-architecture--two-layers)
5. [Feature Specification](#5-feature-specification)
6. [Anti-Slop Engine](#6-anti-slop-engine)
7. [User Journey — Step by Step](#7-user-journey--step-by-step)
8. [Content Output Formats](#8-content-output-formats)
9. [Data Source Integrations](#9-data-source-integrations)
10. [Pricing & Tiers](#10-pricing--tiers)
11. [Tech Stack](#11-tech-stack)
12. [Database Schema](#12-database-schema)
13. [API Design](#13-api-design)
14. [Prompt Engineering Guidelines](#14-prompt-engineering-guidelines)
15. [Content Marketing & Distribution Strategy](#15-content-marketing--distribution-strategy)
16. [Build Phases & Milestones](#16-build-phases--milestones)
17. [Risks & Mitigations](#17-risks--mitigations)
18. [Design & UX Principles](#18-design--ux-principles)
19. [Metrics & Success Criteria](#19-metrics--success-criteria)
20. [Appendix](#20-appendix)

---

## 1. Project Overview

### What Is Trace?

Trace is a content distribution engine for builders — solopreneurs, vibecoders, indie hackers, and mid-career professionals who ship real work every day but have zero online presence. It takes the user's actual work artifacts (GitHub commits, Google Drive docs, Notion pages, calendar data, Slack exports) and transforms them into publish-ready content across four platforms: LinkedIn, Instagram, X/Twitter, and Substack.

### What Makes Trace Different?

Every competitor (Taplio, Kleo, Supergrow, Postiv, Brandled) starts with "what do you want to post today?" — they assume you already know your positioning. Trace starts with **strategy**. Before generating a single word of content, Trace runs a structured 30-minute onboarding interview and produces a Personal Brand Strategy Document. This is McKinsey-level brand positioning delivered in 30 minutes for $39/month instead of $40K.

The second differentiator is **source attribution**. Every piece of content Trace generates cites its origin: "Based on your March 2026 commit to auth-service" or "Sourced from your Oct 2024 client retro." This transforms the user's experience from "AI made this up" to "I actually said/did this — Trace just helped me publish it."

The third differentiator is the **anti-slop engine** — hardcoded refusals baked into every generation prompt that prevent Trace from ever producing generic LinkedIn-bro content.

### The One-Sentence Pitch

Trace turns your GitHub commits, docs, and real work into LinkedIn posts, Instagram carousels, X threads, and Substack drafts that sound like you — not like AI.

---

## 2. Problem Statement

### The Core Pain

Builders (engineers, data people, PMs, indie founders) spend 100% of their time doing real work and 0% telling anyone about it. They know "personal brand" matters — they see less-experienced people getting better jobs, more inbound leads, and more credibility because they post online. But:

1. They open LinkedIn, stare at the blank box, think "what do I even say," close the tab, and go back to coding.
2. When they try AI tools, everything sounds generic and cringe — "Hot take: most engineers don't understand X" — it doesn't sound like them.
3. They don't know their positioning. They can't articulate what they're uniquely good at or who they're trying to reach.
4. Their actual expertise is buried in private repos, internal docs, Slack threads, and meeting notes — places nobody can see.

### What They Need

A tool that:
- Figures out what they should talk about (strategy)
- Finds the stories they've already lived (work mining)
- Writes the content in their voice, not AI voice (voice fidelity)
- Outputs in every format they need (multi-platform)
- Never produces content they'd be embarrassed to post (anti-slop)

---

## 3. Target Audience

### Primary Personas

#### Persona 1: The Vibecoder
- **Profile:** Ships apps fast using AI tools (Cursor, Claude Code, Replit, Bolt, v0). Active on X/Twitter. Builds in public but posts are just app screenshots with "just shipped this" and no storytelling. Gets 12 likes.
- **Pain:** They're building interesting things but can't articulate why anyone should care.
- **Goal:** More users, more followers, maybe sponsors or pre-seed credibility.
- **Where they hang out:** X/Twitter, Discord (Buildspace, AI builder servers), Reddit (r/SideProject, r/SaaS), Indie Hackers.

#### Persona 2: The Solopreneur
- **Profile:** Building a product or business alone. Knows content marketing matters but spends all day building. Content feels like a second job they didn't sign up for.
- **Pain:** Zero time for content creation. When they try, it sounds forced or generic.
- **Goal:** Customers, inbound leads, launch credibility.
- **Where they hang out:** Instagram (carousels), X/Twitter, Reddit (r/Entrepreneur), Indie Hackers, Product Hunt.

#### Persona 3: The Career Switcher
- **Profile:** Engineer/data/PM with 5–15 years of experience, switching companies or roles. Has deep expertise but no public presence.
- **Pain:** Recruiters can't find them. They have no "proof of work" online.
- **Goal:** Better job offers, inbound recruiter interest, industry credibility.
- **Where they hang out:** LinkedIn (primary), X/Twitter (secondary).

#### Persona 4: The Consultant/Freelancer
- **Profile:** Has been heads-down on client work for years. No time to market themselves. Pipeline depends on referrals.
- **Pain:** Feast-or-famine revenue because they have no inbound funnel.
- **Goal:** Inbound consulting leads, thought leadership positioning.
- **Where they hang out:** LinkedIn, Substack, niche communities.

### Explicitly NOT the Target

- **Career creators** — they already have tools (Taplio, Kleo serve them well)
- **Marketers** — they don't need this; they ARE this
- **Junior professionals** — less than 3 years of experience; not enough body of work to mine
- **Enterprise teams** — Trace is for individuals, not brand teams (at least in v1)

---

## 4. Product Architecture — Two Layers

The architecture has two layers, and **the order matters**. Layer 1 must complete before Layer 2 activates.

### Layer 1: Positioning Engine (runs once per user)

This is the moat. A structured onboarding interview that extracts the user's brand positioning. No competitor does this.

**Input:** 30-minute interactive interview (chat-based or voice-to-text)

**Interview Flow (15–20 questions across 5 sections):**

**Section 1 — Career Arc (5 questions)**
1. "Walk me through your career in 2 minutes. Where did you start, where are you now?"
2. "What's the project or accomplishment you're most proud of? Why?"
3. "What's the biggest professional mistake you've made and what did you learn?"
4. "If someone followed your exact career path, what would they know that most people in your field don't?"
5. "What's the thing you keep explaining to coworkers/clients over and over?"

**Section 2 — Expertise & Opinions (4 questions)**
6. "What's something most people in your field believe that you disagree with?"
7. "What's a trend everyone's excited about that you think is overhyped?"
8. "What's an underrated tool, technique, or approach that more people should use?"
9. "If you had to teach a 1-hour masterclass, what would it be about?"

**Section 3 — Current Work (3 questions)**
10. "What are you building right now? Describe it like you're explaining to a friend."
11. "What's the hardest technical/business problem you're solving this month?"
12. "What tools and technologies are in your daily stack?"

**Section 4 — Audience & Goals (4 questions)**
13. "Who do you want reading your posts? Be specific — job title, company size, experience level."
14. "What do you want to happen after someone reads 10 of your posts? (Job offers, consulting inbound, users for your product, investors noticing you)"
15. "Name 3 people whose online presence you admire. What do you like about their style?"
16. "How much time per week can you realistically spend on content? Be honest."

**Section 5 — Voice & Style (3 questions)**
17. "When you explain something well, what does it sound like? (Casual, technical, storytelling, data-driven, humorous)"
18. "What kind of content do you hate seeing in your feed?"
19. "Do you want to be known as [options]: the technical deep-diver, the practical builder, the contrarian thinker, the data storyteller, the systems thinker?"

**Output:** A one-page Personal Brand Strategy Document containing:

```
PERSONAL BRAND STRATEGY — [User Name]
Generated: [Date]

1. POSITIONING STATEMENT
   One sentence: "I help [audience] understand [topic] by sharing [unique angle]."

2. CONTENT PILLARS (3)
   Pillar 1: [Topic] — [Why you own this]
   Pillar 2: [Topic] — [Why you own this]
   Pillar 3: [Topic] — [Why you own this]

3. CONTRARIAN TAKES (3–5)
   - [Take 1] — extracted from interview answer to Q6/Q7
   - [Take 2]
   - [Take 3]

4. ORIGIN STORY (5 beats)
   Beat 1: [Where you started]
   Beat 2: [The turning point]
   Beat 3: [The struggle/lesson]
   Beat 4: [The breakthrough]
   Beat 5: [Where you are now and where you're going]

5. TARGET AUDIENCE PROFILE
   Job title: [X]
   Experience level: [X]
   Company type: [X]
   What they care about: [X]
   Where they hang out: [X]

6. OUTCOME GOAL
   Primary: [e.g., "Inbound consulting leads"]
   Secondary: [e.g., "Hiring signal for PM roles"]
   90-day metric: [e.g., "500 LinkedIn followers, 5 inbound DMs"]

7. VOICE PROFILE
   Tone: [e.g., "Casual but technically precise"]
   Format preference: [e.g., "Story-driven with data"]
   Anti-patterns: [Things to never do, from Q18]
   Role models: [From Q15]

8. POSTING CADENCE
   LinkedIn: [X posts/week]
   Instagram: [X carousels/week]
   X/Twitter: [X tweets/day]
   Substack: [X issues/month]
```

This document is stored in the database and is injected into every content generation prompt as context. It is the foundation of voice fidelity.

### Layer 2: Content Engine (runs continuously)

Once the Strategy Doc exists, the content engine activates. It connects to the user's work sources, mines them for content-worthy stories, and generates publish-ready content in four formats.

**Pipeline:**
1. **Ingest** — Pull data from connected sources (GitHub, Drive, Notion, Calendar, Slack) or accept manual uploads
2. **Analyze** — LLM reads each artifact and identifies content-worthy stories, insights, lessons, and opinions
3. **Map to Pillars** — Each identified story is mapped to one of the user's 3 content pillars from the Strategy Doc
4. **Generate** — For each story, produce content in all 4 output formats (LinkedIn, Instagram, X, Substack)
5. **Voice Check** — Run output through voice fidelity filter using the Voice Profile from the Strategy Doc
6. **Anti-Slop Filter** — Run output through hardcoded refusals (see Section 6)
7. **Present** — Show user the generated content with source citation, ready to edit/approve/publish
8. **Learn** — User marks content as "sounds like me" or "doesn't sound like me" → feedback loop improves voice fidelity


### Layer 2 Operating Modes

The Content Engine has two operating modes. Trace should not depend only on fresh source artifacts like new GitHub commits or new documents. Source activity naturally slows down after a product is built, especially for entrepreneurs, solopreneurs, and builders who only use GitHub and AI coding tools.

Trace therefore supports both:

| Mode | Trigger | Primary Input | Purpose |
|---|---|---|---|
| **Source Mining Mode** | User has meaningful new artifacts | GitHub commits, uploads, docs, PRs, Claude Code conversations | Extract content from work the user has already done |
| **Narrative Planning Mode** | Source activity is low or stale | Weekly check-in answers, Strategy Doc, product stage, previous story seeds | Create an ongoing content plan from the founder's journey, decisions, lessons, and user signals |

The updated Layer 2 pipeline is:

```text
If source activity is healthy:
Ingest → Analyze → Map to Pillars → Generate → Voice Check → Anti-Slop Filter → Present → Learn

If source activity is low:
Detect Low Signal → Weekly Check-In → Narrative Plan → Generate → Voice Check → Anti-Slop Filter → Present → Learn
```

This ensures Trace remains useful after the initial build phase, when commits slow down and the founder's work shifts from building to launching, learning, selling, supporting, and refining the product.

### Product Stage Awareness

Trace should classify the user's current product or career stage because different stages produce different content strategies.

| Stage | Description | Best Content Angles |
|---|---|---|
| **Building** | User is actively creating the product | shipping decisions, bugs, architecture, tradeoffs, first version choices |
| **Launching** | User is preparing or executing launch | positioning, landing page, pricing, launch lessons, user objections |
| **Operating** | Product is live and being improved | user feedback, support questions, onboarding, retention, roadmap decisions |
| **Scaling** | Product has users/revenue and repeated workflows | systems, delegation, growth loops, metrics, repeatable playbooks |

Trace uses the Strategy Doc, source activity, and weekly check-ins to decide which stage the user is in and recommend the right content mix.

### AI Interaction Modes

Trace supports two interaction modes for any AI-driven conversation, including the Weekly Check-In, Strategy Doc interview, and onboarding questions.

| Mode | Description | UX | Phase |
|---|---|---|---|
| **Text Mode** | User types answers. AI responds with typed follow-ups. | Standard chat interface. Works everywhere. | Phase 1 |
| **Voice Mode** | User speaks answers. Speech is transcribed in real-time. AI responds with typed or spoken follow-ups. | Tap-to-talk or continuous listening. Transcript visible as the user speaks. | Phase 1 (basic), Phase 2 (real-time conversational) |

The default interaction mode should be Voice Mode. Text Mode is always available as a fallback.

The reasoning: Trace's target users are builders, founders, and solopreneurs. These users are time-constrained. They will talk for 5 minutes far more willingly than they will type for 10 minutes. A voice-first check-in feels like a quick founder debrief. A text-first check-in feels like a form.

---

## 5. Feature Specification

### F1: Onboarding Interview

- **Type:** Chat-based interactive interview
- **Duration:** ~30 minutes
- **Questions:** 15–20 (see Section 4 for full list)
- **Behavior:** Adaptive — follow-up questions based on answers. If a user gives a short answer, probe deeper. If they give a rich answer, move on.
- **Progress indicator:** Show "Section 2 of 5 — Expertise & Opinions" style progress
- **Save & resume:** User can leave and come back; answers persist
- **Edit later:** User can revisit and update any answer at any time
- **Output:** Personal Brand Strategy Document (see Section 4)

### F2: Strategy Document Generation

- **Input:** Interview answers (structured JSON)
- **Processing:** LLM synthesizes answers into the Strategy Doc format
- **Output:** Rendered document (viewable in-app, downloadable as PDF)
- **Editability:** User can edit any section of the generated doc; edits persist and influence all future content generation
- **Regeneration:** User can request regeneration of any section with additional context

### F3: Source Connection & Data Ingestion

#### F3a: Manual Upload (Phase 1)
- User uploads 1–20 files (PDF, DOCX, TXT, MD, CSV, JSON)
- Files are parsed, chunked, and stored with metadata
- Each chunk is embedded (pgvector) for semantic search
- User can tag uploads with project names or dates for context

#### F3b: GitHub Integration (Phase 2)
- OAuth connection to GitHub account
- Scans: commit messages, PR titles & descriptions, PR comments, README files, issues authored
- Filters out: bot commits, merge commits, dependency updates
- Extracts: "I shipped X," "I fixed Y," "I learned Z" stories
- Cadence: pulls new data daily or on-demand

#### F3c: Google Drive Integration (Phase 2)
- OAuth connection to Google account
- Scans: Google Docs, Sheets, Slides — titles, content, last modified dates
- User selects which folders/files to include (never scans everything without permission)
- Extracts: client retros, project docs, strategy decks, frameworks, methods

#### F3d: Notion Integration (Phase 2)
- OAuth connection to Notion workspace
- Scans: pages, databases — titles, content, tags, dates
- User selects which workspaces/pages to include
- Extracts: project notes, meeting notes, personal knowledge bases

#### F3e: Calendar Integration (Phase 3)
- OAuth connection to Google Calendar
- Scans: meeting titles, frequency, attendee counts (NOT content of meetings)
- Extracts patterns: "You've been in 14 meetings about RAG this month" → suggests topic authority
- Privacy: only reads metadata (titles, times), never reads meeting notes or recordings

#### F3f: Slack/Email Export (Phase 3)
- Manual export upload (Slack JSON export, email .mbox or .eml files)
- Scans: long-form messages and threads where user explained something substantively
- Filters: ignores casual chat, GIFs, reactions, one-liners
- Extracts: opinions, explanations, frameworks the user has already articulated

#### F3g: Existing Social Profiles (Phase 3)
- User provides LinkedIn profile URL and X/Twitter handle
- Scrapes or imports existing public posts
- Purpose: ensures Trace never generates content that repeats what the user has already published
- Stored as a "deduplication index"

### F4: Content Mining & Story Extraction

- **Input:** Raw ingested data from any source
- **Process:**
  1. LLM reads each artifact
  2. Identifies "content-worthy moments" — stories, insights, decisions, lessons, opinions, frameworks, mistakes, wins
  3. Tags each moment with: source file/commit, date, content pillar match, estimated engagement potential
  4. Ranks moments by relevance to the user's Strategy Doc
- **Output:** A "Content Mine" — a ranked list of story seeds, each with:
  - Title: "How you cut pipeline processing time by 40%"
  - Source: "GitHub commit abc123, March 15, 2026"
  - Pillar: "Data Engineering"
  - Formats available: LinkedIn, Instagram, X, Substack

### F5: Content Generation

For each story seed, the user can generate content in any or all of 4 formats. See Section 8 for format specifications.

- **Generation uses as context:**
  - The user's Strategy Doc (always)
  - The specific source material for this story
  - The user's voice profile
  - The anti-slop rules
  - Previously approved content (to maintain consistency and avoid repetition)
- **Hook variants:** Each LinkedIn post and X thread includes 3 alternative hooks. User picks their favorite.
- **Source citation:** Every generated piece includes a citation line: "Based on [source description, date]"
- **Edit mode:** User can edit any generated content inline before publishing
- **Regenerate:** User can request a full regeneration with optional guidance ("make it more technical," "shorter," "add a specific detail about X")

### F6: Content Calendar

- **View:** Weekly and monthly calendar view showing scheduled and draft content
- **Scheduling:** User assigns content to specific dates and platforms
- **Cadence recommendations:** Based on the Strategy Doc's posting cadence, Trace suggests what to post when
- **Balance indicator:** Shows distribution across content pillars (e.g., "You've posted 5x about RAG this month but 0x about team management — here are some team management stories ready to go")

### F7: Ship-to-Post Pipeline (Vibecoder-Specific)

- **Trigger:** New meaningful GitHub commit, PR merge, or deployment
- **Auto-draft:** Trace reads the diff, commit message, and PR description, then auto-drafts a build-in-public post
- **Notification:** User gets a notification: "New post drafted from your latest commit. Review it?"
- **Format:** Defaults to X thread (build-in-public is primarily an X/Twitter format) but can generate for any platform
- **Filtering:** Ignores trivial commits (typo fixes, dependency bumps, merge commits) — only triggers on substantive changes

### F8: Launch Content Package (Solopreneur-Specific)

- **Trigger:** User clicks "Generate Launch Package" and specifies a product/project
- **Input:** Pulls from connected sources for that product (repo, docs, etc.)
- **Output:** A complete launch content kit:
  - Product Hunt listing (name, tagline, description, first comment)
  - X/Twitter launch thread (hook + 8–10 beats)
  - LinkedIn announcement post
  - Instagram carousel (8–10 slides explaining the product)
  - Reddit post for r/SideProject
  - Email newsletter issue announcing the launch
- **Customization:** User can specify launch date, key features to highlight, target audience

### F9: Voice Calibration Loop

- **Mechanism:** After each batch of generated content, user marks posts as:
  - ✅ "Sounds like me"
  - ❌ "Doesn't sound like me" (with optional note: "too formal," "too casual," "I'd never say this")
  - ✏️ "Close but I edited it" (Trace sees the diff between generated and edited version)
- **Learning:** Feedback is stored and injected into future generation prompts as few-shot examples
- **Voice score:** Dashboard shows "Voice Match: 78%" — percentage of generated content marked as "sounds like me"
- **Target:** 80%+ voice match before Trace recommends the user start publishing regularly

### F10: Metrics Dashboard

- **Content metrics:** Posts generated, posts published, posts in draft, posts rejected
- **Platform metrics (if user connects):** Impressions, engagement rate, follower growth, inbound DMs (LinkedIn API, X API)
- **Pillar balance:** Pie chart of content distribution across the 3 pillars
- **Voice match trend:** Voice fidelity score over time
- **Milestone alerts:** "You hit 500 LinkedIn followers!" or "Your X thread got 50+ likes — here's why it worked"

### F11: Autonomous Posting (Phase 3+)

- **Platforms supported:** LinkedIn (official API), X/Twitter (API), Instagram (Meta Business Suite API)
- **Behavior:** After user approves a post, Trace schedules and publishes it at the optimal time
- **User control:** User must explicitly approve every post before it goes live. NO fully autonomous posting without approval.
- **Safety:** If platform API changes or rate-limits, Trace falls back to "copy to clipboard" mode
- **LinkedIn safety:** Trace uses LinkedIn's official API only. No cookie-based auth, no Chrome extensions, no scraping. This is a positioning point: "We won't get your account banned."

### F12: Multi-Brand Support (Studio Tier)

- **Use case:** Ghostwriters or consultants managing content for multiple clients
- **Functionality:** Each brand has its own Strategy Doc, voice profile, connected sources, and content calendar
- **Switching:** Easy brand switcher in the UI
- **Limit:** Up to 5 brands on Studio tier

---

### F13: Weekly Narrative Planner

The Weekly Narrative Planner keeps Trace valuable when source activity slows down. It turns small weekly updates, founder reflections, product decisions, customer feedback, and lessons learned into a structured content plan for the coming week.

This feature prevents Trace from becoming overly dependent on GitHub commits, Notion pages, or fresh documents.

#### Purpose

Trace should not fail when a user has:

- only one meaningful commit this week
- no Notion workspace
- no Twitter/X history
- no Google Drive docs
- no fresh uploads
- only GitHub and Claude Code as work sources
- a mostly built product where the work has shifted from coding to operating

Instead of saying “no content found,” Trace asks a short set of focused questions and converts the answers into story seeds and a weekly publishing plan.

#### Trigger Conditions

The Weekly Narrative Planner activates when one or more of these conditions are true:

- Fewer than 3 meaningful new source artifacts were found in the last 7 days
- No new story seeds were extracted from connected sources
- User has not connected enough sources to support ongoing mining
- User is in the Operating or Launching stage, where content should come from learning, testing, users, and decisions rather than only code
- User manually clicks “Plan my week”
- User has an upcoming launch, milestone, demo, beta cohort, or product update

#### Input Sources

The planner uses:

- Strategy Doc
- content pillars
- previous story seeds
- generated and approved content history
- voice calibration samples
- recent source activity, if available
- weekly check-in answers
- product stage
- user-declared goals for the week
- customer/user feedback, if provided manually
- screenshots, metrics, or proof assets uploaded by the user

#### Weekly Check-In Questions

The check-in should take 5–10 minutes. It should feel like a founder reflection, not a content-writing task.

Default questions:

```text
1. What changed in your product, work, or thinking this week?
2. What did you work on, even if it feels small?
3. What surprised you?
4. What did users, customers, recruiters, or teammates ask or complain about?
5. What decision did you make and why?
6. What are you unsure about right now?
7. What did you learn this week that someone one step behind you would find useful?
```

Adaptive follow-up behavior:

- If the user mentions a feature, ask why it mattered.
- If the user mentions a user/customer reaction, ask what it revealed.
- If the user mentions confusion, ask what changed in their thinking.
- If the user gives a short answer, ask one deeper follow-up.
- If the answer is rich, move on.

#### Low-Signal Mode

Low-Signal Mode is the fallback state used when Trace cannot find enough new source material.

Example UI copy:

```text
Your source activity was light this week.

That is normal after the build phase. Answer a few quick questions and Trace will turn your product decisions, lessons, and user signals into next week’s content plan.
```

Example contextual prompt:

```text
You had 1 meaningful commit this week: "fix onboarding copy."

Answer 3 quick questions:
1. Why did you change the onboarding copy?
2. What was confusing before?
3. What do you want users to understand faster now?
```

Low-Signal Mode should never generate weak filler content. Its job is to extract a stronger story from smaller signals.

#### Output

The Weekly Narrative Planner produces a structured plan:

```text
WEEKLY NARRATIVE PLAN — [Week of Date]

1. MAIN THEME
   The central story for this week.

2. PRODUCT STAGE
   Building / Launching / Operating / Scaling

3. CONTENT STRATEGY
   What the user should talk about this week and why.

4. RECOMMENDED POSTS
   5–10 story seeds mapped to platform and pillar.

5. ANCHOR STORY
   One strongest idea for LinkedIn or Substack.

6. SUPPORTING POSTS
   X thread, Instagram carousel, short LinkedIn post, launch/update post.

7. PROOF ASSETS TO ATTACH
   Suggested screenshots, metrics, commits, user quotes, demos, or before/after images.

8. PILLAR BALANCE
   How the plan maps across the user’s 3 content pillars.

9. SOURCE NOTES
   What each idea is based on: commit, check-in answer, user feedback, screenshot, metric, or prior artifact.
```

#### Example Output

```text
This week’s narrative:
You are moving from building the product to clarifying the promise.

Recommended posts:
1. LinkedIn: Why I rewrote the onboarding flow
2. X thread: 5 things I removed from v1
3. Instagram carousel: Before/after onboarding copy
4. Substack: The difference between building features and building clarity
5. LinkedIn: What user confusion taught me about positioning

Proof assets to attach:
- screenshot of old onboarding screen
- screenshot of new onboarding screen
- commit reference: "fix onboarding copy"
- one sentence from user feedback, if available
```

#### Weekly Content Mix

The planner should recommend a balanced weekly rhythm:

| Type | Purpose | Example |
|---|---|---|
| **Build Log** | Shows progress | “I changed the onboarding flow this week.” |
| **Founder Lesson** | Shows learning | “I built too much before clarifying the first user action.” |
| **Product POV** | Builds authority | “Good onboarding is not shorter. It is better sequenced.” |
| **Proof/Receipts** | Builds trust | screenshot, commit, user quote, metric, demo |

#### Story Types Used by the Planner

The planner should generate story seeds from reusable story types:

| Story Type | Description | Example |
|---|---|---|
| **Origin Story** | Why the product exists | “I built this because I kept running into the same problem.” |
| **Build Decision** | A product or technical choice | “Why I chose Supabase instead of building auth myself.” |
| **Mistake/Lesson** | Something that went wrong and what changed | “I built too much before talking to users.” |
| **User Insight** | What users taught the founder | “A user question changed how I think about onboarding.” |
| **Product Thinking** | A reusable opinion or principle | “A feature is not valuable until the user knows when to use it.” |
| **Launch/Distribution** | How the founder is trying to grow | “My first users came from conversations, not ads.” |
| **Behind-the-Scenes Proof** | Real evidence of work | screenshots, commits, analytics, demos, architecture diagrams |

#### Behavior Rules

The planner must:

- create strategy, not filler
- preserve the user’s content pillars
- avoid repeating previously generated ideas
- avoid generating fake lessons unsupported by user input
- clearly label the source of each idea
- suggest proof assets wherever possible
- keep the weekly plan realistic for the user’s available time
- use Low-Signal Mode when source activity is weak
- treat founder reflection as a first-class content source

#### Anti-Slop Requirements

The Weekly Narrative Planner must follow the same Anti-Slop Engine rules as generated content.

It must not recommend generic themes like:

- “consistency is key”
- “keep building”
- “founder mindset”
- “lessons from my journey”
- “why execution matters”
- “the grind never stops”

Instead, it should recommend specific, earned stories tied to the user’s real work, decisions, questions, and evidence.

---

### F14: Voice-First AI Interview

All AI-driven interviews in Trace should support voice input as the primary interaction mode. This includes:

- Weekly Check-In (F13)
- Strategy Doc interview (onboarding)
- Voice calibration sample collection
- Low-Signal Mode follow-up questions
- Any future AI-to-user conversation flow

#### Purpose

Most users will not type detailed answers to open-ended questions. Voice input reduces friction by 60-80% for reflective questions like "What changed in your thinking this week?" or "What did users complain about?"

The goal is to make every AI interview in Trace feel like a 5-minute conversation, not a 10-minute form.

#### Phase 1: Browser-Native Voice Input

Phase 1 uses the Web Speech API (`SpeechRecognition`), which is free, requires no API key, runs entirely in the browser, and works in Chrome, Edge, Safari, and most modern browsers.

##### How It Works

```text
1. User opens Weekly Check-In.
2. Trace displays the first question as text.
3. User taps the microphone button (or presses a keyboard shortcut).
4. Browser listens. Transcript appears in real-time as the user speaks.
5. User finishes speaking. Transcript is submitted as the answer.
6. Trace sends the transcript to the AI for adaptive follow-up.
7. AI generates the next question. Trace displays it as text.
8. Optionally, Trace reads the next question aloud using browser TTS (SpeechSynthesis API).
9. Repeat until the check-in is complete.
```

##### Technical Implementation

```text
Frontend:
- Use the Web Speech API (SpeechRecognition) for speech-to-text.
- Use the SpeechSynthesis API for optional text-to-speech on AI responses.
- Both APIs are browser-native. No API key. No cost. No backend dependency.
- Show a live transcript as the user speaks.
- Allow the user to edit the transcript before submitting.
- Provide a manual "Done" button and auto-detect silence (2-3 seconds) to finalize.

Backend:
- Receives the transcript as plain text. Same as if the user had typed it.
- No backend changes needed for Phase 1 voice support.
- The adaptive follow-up logic works identically on typed or spoken input.
```

##### Browser Support

| Browser | SpeechRecognition | SpeechSynthesis |
|---|---|---|
| Chrome (desktop + Android) | Yes | Yes |
| Edge | Yes | Yes |
| Safari (desktop + iOS) | Yes | Yes |
| Firefox | No (flag-only) | Yes |

For Firefox users, Trace falls back to Text Mode with a message: "Voice input is not supported in this browser. Switch to Chrome, Edge, or Safari for voice check-ins, or type your answers below."

##### UX Requirements

- The microphone button should be prominent. It should be the primary action, not a secondary icon.
- The transcript should appear in real-time so the user sees their words being captured.
- The user should be able to edit the transcript before submitting. Misheard words are normal.
- The AI's follow-up question should appear immediately after the user submits. Optionally, Trace reads it aloud.
- A "Switch to typing" option should always be visible for users who prefer text.
- The voice indicator should show clear states: listening, processing, idle.

##### Anti-Friction Design

The check-in should feel conversational:

```text
BAD UX:
Question 1 of 7: What changed in your product this week?
[text input field]

GOOD UX:
"What changed in your product or your thinking this week?"
[large microphone button]
[small "type instead" link]
```

The voice interview should not number the questions or show "3 of 7." It should feel like a conversation that ends naturally, not a form with a progress bar.

#### Phase 2: Real-Time Conversational Voice

Phase 2 upgrades the voice experience to a true back-and-forth conversation where the AI speaks its questions aloud and listens for the user's spoken response, with minimal UI interaction.

##### How It Works

```text
1. User opens the check-in and taps "Start voice check-in."
2. AI speaks the first question aloud.
3. User responds naturally by speaking.
4. AI processes the response, generates a follow-up, and speaks it aloud.
5. The conversation continues hands-free until the check-in is complete.
6. Full transcript is saved and visible for review/editing.
```

##### Technical Options

| Option | Description | Cost | Quality |
|---|---|---|---|
| **OpenAI Realtime API** | WebSocket-based real-time speech-to-speech | ~$0.06/min input, ~$0.24/min output | High quality, low latency |
| **Whisper API + TTS API** | Separate STT and TTS calls per turn | ~$0.006/min STT + ~$0.015/1K chars TTS | Good quality, higher latency |
| **Browser STT + Cloud TTS** | Web Speech API for input, ElevenLabs or similar for natural-sounding output | TTS cost only | Good input, excellent output voice |
| **Hybrid** | Web Speech API for input, OpenAI TTS for output | TTS cost only | Free input, good output |

Recommended Phase 2 approach: **Hybrid**. Use the free browser SpeechRecognition API for input (already built in Phase 1) and add a cloud TTS service for higher-quality AI voice output. This keeps input costs at zero and only adds cost for the AI's spoken responses.

##### Voice Identity

The AI interviewer's voice should be:

- Warm, not robotic
- Conversational, not formal
- Consistent across sessions (same voice model/preset)
- Configurable: user can pick from 2-3 voice options

#### Phase 3: Advanced Voice Features

- Voice-triggered check-in: "Hey Trace, let's do my weekly check-in."
- Mobile push notification: "Ready for your weekly check-in?" that opens directly into voice mode.
- Voice notes outside of check-ins: user records a 60-second voice note at any time, Trace transcribes and extracts story seeds.
- Speaker diarization for multi-founder accounts (future).

#### Database Changes

No schema changes needed. The weekly check-in `answers` JSONB column stores the transcript regardless of whether it was typed or spoken. Add an optional metadata field:

```sql
ALTER TABLE weekly_checkins
ADD COLUMN IF NOT EXISTS input_mode VARCHAR(10) DEFAULT 'text'; -- 'text' or 'voice'
```

This allows Trace to track voice adoption rates and optimize the experience.

#### Metrics

- Voice vs. text adoption rate per check-in
- Average check-in completion time: voice vs. text
- Transcript edit rate (how often users correct the speech-to-text output)
- Check-in completion rate: voice vs. text (hypothesis: voice is 2-3x higher)
- Voice check-in NPS or satisfaction rating

---

### F15: AI Compute Economics & Model Routing

Trace depends on AI for multiple core functions. The spec must define how AI compute costs are managed, how models are selected for different tasks, and how usage scales from zero revenue to thousands of users.

#### Purpose

Without a cost strategy, Trace faces two failure modes:

1. **Bootstrap death:** The founder runs out of free API credits before reaching paying users.
2. **Margin collapse:** Paying users generate more AI cost than their subscription covers.

This section defines the model routing architecture, per-user budgets, and scaling plan across all product phases.

#### AI Task Classification

Every AI call in Trace falls into one of three cost tiers based on how much reasoning quality it requires:

| Tier | Task Type | Examples | Model Class | Approximate Cost |
|---|---|---|---|---|
| **Tier 1: Heavy Reasoning** | Tasks that require deep context, voice matching, nuanced judgment, or long-form generation | Final content generation, anchor story writing, Strategy Doc creation, voice calibration scoring, anti-slop filtering on full drafts | Frontier model (Claude Opus, GPT-4o, Gemini Pro) | High |
| **Tier 2: Medium Reasoning** | Tasks that require moderate context and structured output | Weekly narrative plan generation, adaptive check-in follow-ups, story seed extraction, pillar mapping, content calendar planning | Mid-tier model (Claude Sonnet, Gemini Flash 2.0, GPT-4o-mini) | Medium |
| **Tier 3: Light Processing** | Tasks that are mostly classification, extraction, or formatting | Signal assessment (enough source material?), product stage classification, duplicate story detection, proof asset suggestion, input validation, transcript cleanup | Small/fast model (Claude Haiku, Gemini Flash, GPT-4o-mini) | Low |

The routing layer selects the cheapest model that meets quality requirements for each task. This is not optional. Using a frontier model for signal assessment is a waste of budget. Using a small model for final content generation produces slop.

#### Model Routing Architecture

```text
User action triggers AI task
       ↓
Task Router classifies the task (Tier 1, 2, or 3)
       ↓
Budget Check: Does this user have remaining AI credits for this billing period?
       ↓
  YES → Route to the appropriate model via OpenRouter or direct API
  NO  → Show "AI credits used. Upgrade for more." or queue for next period.
       ↓
Model selection:
  Tier 1 → Frontier model (rotate based on cost/availability)
  Tier 2 → Mid-tier model
  Tier 3 → Smallest viable model
       ↓
Response returned to Trace pipeline
```

##### OpenRouter as the Routing Layer

OpenRouter is the recommended routing layer for Phase 1 and Phase 2. It provides:

- Access to multiple model providers (Anthropic, OpenAI, Google, open-weight models) through a single API key
- Automatic fallback if a model is unavailable
- Per-model pricing transparency
- Usage tracking per API key

This means Trace is not locked into any single AI provider. If Claude Sonnet is the best value for Tier 2 today but Gemini Flash 2.0 is cheaper next month, the routing layer switches without code changes.

#### Scaling Plan Across Phases

##### Phase 0: Pre-Launch (0 users, no revenue)

```text
Budget:       $0 (OpenRouter free tier, 50 requests/day)
Users:        Developer only (Vismay)
Strategy:     Use free tier to build and test all AI pipelines.
              Route everything through the cheapest models during development.
              Only use frontier models for testing final content quality.
Model mix:    90% Tier 3 (development/testing), 10% Tier 1 (quality validation)
Constraint:   50 requests/day is enough for one developer iterating.
```

##### Phase 1: Bootstrap (1-5 users, no or minimal revenue)

```text
Budget:       $0-20/month (OpenRouter free tier + small paid top-up if needed)
Users:        1-5 beta users
Strategy:     Aggressive cost optimization.
              Cache everything that can be cached.
              Batch requests where possible.
              Limit AI-generated content to 3-5 posts per user per week.
              Use Tier 3 models for 60% of tasks.
Model mix:    20% Tier 1, 20% Tier 2, 60% Tier 3
Daily budget: ~50-80 requests/day total across all users

Key optimizations:
- Cache the Strategy Doc analysis. Do not re-process it every week.
- Cache voice calibration results. Only re-run when the user updates samples.
- Cache content pillar definitions.
- Batch story seed extraction: process all weekly check-in answers in one call,
  not one call per question.
- Combine signal assessment + product stage classification into one Tier 3 call.
- Use the weekly check-in transcript as context for narrative plan generation
  in a single Tier 2 call, rather than separate calls for each step.
```

##### Phase 2: Early Traction (5-30 users, first paying subscribers)

```text
Budget:       $20-100/month (funded by first subscribers)
Users:        5-30, mix of free and paid
Strategy:     First subscription revenue goes directly to AI compute.
              Differentiate free vs. paid by AI budget, not by features.
              Free users get limited AI generation. Paid users get full access.
Model mix:    30% Tier 1, 30% Tier 2, 40% Tier 3

Free tier AI budget (per user per week):
- 1 narrative plan generation (Tier 2)
- 3 generated posts (Tier 1 for anchor, Tier 2 for supporting)
- 1 check-in with adaptive follow-ups (Tier 3)
- Signal assessment and classification (Tier 3)
- Total: ~8-12 API calls per user per week

Paid tier AI budget (per user per week):
- 1 narrative plan generation (Tier 2)
- 7-10 generated posts (Tier 1 for anchor and long-form, Tier 2 for short-form)
- 1 check-in with adaptive follow-ups (Tier 2 for richer responses)
- Unlimited signal assessment and classification (Tier 3)
- Voice calibration re-scoring on demand (Tier 1)
- Total: ~20-35 API calls per user per week
```

##### Phase 3: Growth (30-200+ users)

```text
Budget:       $100-500+/month (funded by growing subscriber base)
Users:        30-200+
Strategy:     Per-user token budgets enforced at the application level.
              Usage dashboard so users can see their remaining AI credits.
              Overage handling: queue requests for next period or offer pay-as-you-go.
              Negotiate volume pricing with OpenRouter or direct API providers.
              Consider dedicated API keys per provider for better rate limits.
Model mix:    Dynamically optimized based on cost-per-quality benchmarks.

Enterprise/Business tier:
- Unlimited AI generation within reason.
- Priority model access (frontier models for all content generation).
- Custom voice calibration.
- Total: ~50-80 API calls per user per week.
```

#### Request Budget Math

Concrete estimates for request consumption per user interaction:

| User Action | AI Calls | Tier Mix | Estimated Requests |
|---|---|---|---|
| Weekly Check-In (7 questions + follow-ups) | 1 batch call for all questions + 3-4 follow-ups | Tier 3 | 4-5 |
| Signal Assessment | 1 | Tier 3 | 1 |
| Narrative Plan Generation | 1 | Tier 2 | 1 |
| Story Seed Extraction (from check-in) | 1 batch call | Tier 2 | 1 |
| Content Generation: Anchor Story | 1 generation + 1 voice check + 1 anti-slop | Tier 1 + Tier 2 + Tier 3 | 3 |
| Content Generation: Supporting Post | 1 generation + 1 voice check | Tier 2 + Tier 3 | 2 |
| **Total per user per weekly cycle (3 posts)** | | | **~14-16** |
| **Total per user per weekly cycle (7 posts)** | | | **~24-28** |

At 50 requests/day on free tier:

- 50 requests/day x 7 days = 350 requests/week
- 1 user doing a full weekly cycle with 7 posts = ~28 requests
- Maximum users on free tier (full cycle): ~12 users/week
- Maximum users on free tier (light cycle, 3 posts): ~22 users/week

This means the free OpenRouter tier can support the bootstrap phase if users do not all run their cycles on the same day.

#### Caching Strategy

Reduce redundant AI calls by caching results that do not change frequently:

| Data | Cache Duration | Invalidation Trigger |
|---|---|---|
| Strategy Doc analysis | Until user edits the Strategy Doc | User saves changes to Strategy Doc |
| Voice calibration score | Until user updates voice samples | User submits new writing samples |
| Content pillar definitions | Until user modifies pillars | User edits pillars |
| Product stage classification | 1 week | New check-in or source activity changes stage |
| Anti-slop pattern list | Indefinite (system-level) | Admin updates banned patterns |
| Previous content history (for dedup) | Rolling 30-day window | New content approved |

Every cached result should be stored in the database or a lightweight key-value store (Redis, or even a JSONB column). The cache key should include the user ID and a content hash so stale data is never served.

#### Graceful Degradation

When the AI budget is exhausted, Trace should degrade gracefully rather than break:

```text
Budget exhausted mid-week:
1. Inform the user: "You have used your AI content credits for this week."
2. Show when credits reset: "New credits available Monday."
3. Allow the user to still complete check-ins (store answers, generate plan later).
4. Allow the user to still upload source material (process later).
5. Offer upgrade path: "Upgrade to [Paid Tier] for more weekly content."

Never:
- Show an error page.
- Silently fail to generate content.
- Queue content without telling the user.
- Degrade content quality by silently switching to a weaker model.
```

#### Cost Monitoring

Trace should track AI costs at the system and per-user level:

```text
System-level:
- Total API spend per day, week, month
- Spend per model
- Spend per task type (Tier 1, 2, 3)
- Average cost per user per week
- Cost per generated post

Per-user level:
- Requests used this billing period
- Remaining budget
- Breakdown by task type
```

This data informs pricing decisions. If the average paid user costs $2/month in AI compute and the subscription is $12/month, the margin is healthy. If the average user costs $8/month, the pricing or routing needs adjustment.

#### Database Changes

```sql
-- AI Usage Tracking
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL, -- 'content_generation', 'narrative_plan', 'checkin_followup', 'signal_assessment', etc.
  cost_tier SMALLINT NOT NULL, -- 1, 2, or 3
  model_used VARCHAR(100), -- 'claude-opus-4', 'gemini-flash-2.0', etc.
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd NUMERIC(10, 6), -- cost in USD
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Per-User AI Budget
CREATE TABLE ai_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  tier1_requests_limit INTEGER NOT NULL,
  tier2_requests_limit INTEGER NOT NULL,
  tier3_requests_limit INTEGER NOT NULL,
  tier1_requests_used INTEGER DEFAULT 0,
  tier2_requests_used INTEGER DEFAULT 0,
  tier3_requests_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage_log(user_id, created_at);
CREATE INDEX idx_ai_budgets_user_period ON ai_budgets(user_id, billing_period_start);
```

#### API Endpoints

```text
GET    /api/ai/budget              — Get current user's AI budget and usage
GET    /api/ai/usage               — Get usage history for current billing period
GET    /api/admin/ai/costs         — Admin: system-wide cost dashboard
POST   /api/admin/ai/routing       — Admin: update model routing rules
```

---

## 6. Anti-Slop Engine

This is both a product feature and a marketing weapon. The anti-slop engine is a set of hardcoded rules applied to every content generation output. If any rule is violated, the content is regenerated.

### Banned Patterns (Content WILL NOT produce)

#### Hook Bans
- "Hot take:" or "Hot take —"
- "Unpopular opinion:" or "Unpopular opinion —"
- "Here's why most [X] fail and what to do instead"
- "Stop doing [X]. Start doing [Y]."
- "I just realized something important about [vague topic]"
- "This changed everything for me."
- "Nobody talks about this, but..."
- "I'm going to say something controversial..."

#### Format Bans
- LinkedIn-bro format: single sentence per line with line breaks every 3–5 words
- Excessive emoji usage (more than 2 per post)
- Numbered lists presented as "wisdom" without substance ("3 things every PM should do")
- All-caps words for emphasis ("This is SO important")
- Hashtag spam (more than 3 hashtags per post)

#### Content Bans
- Manufactured vulnerability: "I almost gave up. Here's what I learned..."
- Fake humility: "Just a small update..." / "I'm no expert, but..."
- Startup jargon: "disrupting," "leveraging synergies," "paradigm shift"
- Corporate announcements: "I'm thrilled to announce..." / "Excited to share..."
- Inspirational closes: "Keep building. ❤️" / "The grind never stops." / "You got this."
- Motivational platitudes: "Success is a journey, not a destination"
- Vague frameworks without specifics: "The 3 keys to [X]" without concrete detail
- Engagement bait: "Comment 'YES' if you agree" / "Share this with someone who needs it"
- Self-congratulation disguised as advice: "When I [impressive thing], I learned that you should..."

#### Voice Bans (Builder-Specific)
- "We're disrupting the [X] space"
- "Leveraging AI to transform [Y]"
- "Our mission is to democratize [Z]"
- "Just shipped this" without any context or story
- Generic "10x developer" or "hustle culture" language
- Crypto/Web3 buzzwords unless the user's actual work involves these

### Anti-Slop Implementation

```
SYSTEM PROMPT ADDITION (injected into every generation call):

ANTI-SLOP RULES — MANDATORY
You MUST NOT produce content containing any of the following patterns.
If your output contains any of these, you must regenerate.

[Full list of banned patterns from above]

Instead, write like a smart person explaining their work to a curious colleague 
over coffee. Be specific. Use real details from the source material. Name the 
tools, the numbers, the trade-offs. No platitudes, no fake vulnerability, no 
engagement bait.
```

### Post-Generation Slop Check

After every generation, run a secondary LLM call that acts as a "slop detector":

```
INPUT: [Generated content]
TASK: Check this content against the anti-slop rules. 
Return PASS if clean, FAIL + specific violation if not.
If FAIL, suggest a rewrite of just the offending section.
```

If the slop detector returns FAIL, auto-regenerate the offending section (up to 3 retries, then flag for human review).

---

## 7. User Journey — Step by Step

### Journey A: The Vibecoder (Primary Path)

**Step 0 — Discovery**
User sees a post on X/Twitter: "I connected my GitHub to an AI tool. It turned my last 30 commits into 30 days of content. Here's every post." They click the link to trace.app (or whatever the domain is).

**Step 1 — Landing Page**
Hero section: **"You ship code. Trace ships your story."**
Subheadline: "Your GitHub commits, docs, and real work — turned into LinkedIn posts, Instagram carousels, X threads, and Substack drafts that sound like you."
CTA: "Get your free Brand Strategy — no credit card"

**Step 2 — Signup**
Email + password, or "Sign up with GitHub" (preferred for this persona — also pre-fetches GitHub data).
Onboarding screen: "Let's figure out your story. This takes about 30 minutes. You can save and come back anytime."

**Step 3 — Strategy Interview**
Interactive chat-based interview. 15–20 questions across 5 sections (see F1).
Progress bar shows completion. Questions adapt based on answers.
At end: "Generating your Brand Strategy..."

**Step 4 — Strategy Document Reveal**
Full Strategy Doc displayed in-app (see Section 4 for format).
User reads it and thinks "wow, I never thought about my positioning this clearly."
CTA: "Edit anything you want to change" and "Generate your first 5 sample posts →"

**Step 5 — Sample Content Generation (Free Tier)**
Trace generates 5 sample posts based on the Strategy Doc alone (no source data yet).
These are "what your content could look like" examples.
Displayed as cards: user can flip between LinkedIn/Instagram/X/Substack format for each.
Each card shows: the content + "Source: Your interview answer about [X]"

**Step 6 — The "Aha" Moment**
User reads the samples and thinks "this actually sounds like me, not like ChatGPT."
This is the conversion trigger. CTA: "Connect your GitHub to generate real content →"

**Step 7 — Source Connection (Pro Tier — $39/mo paywall)**
User connects GitHub (OAuth flow).
Trace scans repos, commits, PRs. Shows progress: "Scanning 247 commits..."
After scan: "Found 18 content-worthy stories in your work. Here are the top 5."

**Step 8 — Content Mine Review**
User sees a ranked list of story seeds:
- "How you refactored the auth service and cut login latency by 60%" — Source: PR #142, March 2026
- "Why you chose Postgres over MongoDB for your SaaS" — Source: README.md, Jan 2026
- "The 3 AM bug that taught you about connection pooling" — Source: commit messages, Feb 2026

User clicks on any story to generate full content.

**Step 9 — Content Generation & Review**
For selected story, Trace generates all 4 formats.
Each format shows 3 hook variants.
Source citation at bottom: "Based on PR #142 to auth-service, March 15, 2026."
User can: Approve ✅ / Edit ✏️ / Regenerate 🔄 / Skip ⏭

**Step 10 — Publishing**
Option A (Manual — Phase 1): User clicks "Copy to clipboard" and pastes into LinkedIn/X/etc.
Option B (Scheduled — Phase 3): User clicks "Schedule" and picks a date/time. Trace publishes via platform API.

**Step 11 — Voice Calibration**
After publishing 5+ posts, Trace asks: "How did these sound? Mark each as 'sounds like me' or 'doesn't.'"
Feedback improves future generations.

**Step 12 — Ongoing Loop**
Every day/week (based on cadence), Trace:
1. Checks for new source material (new commits, new docs)
2. Generates new content drafts
3. Notifies user: "3 new posts ready for review"
User reviews, approves, publishes. Content calendar fills up. Audience grows.

### Step 13 — Weekly Narrative Planning

As the product matures, source activity may slow down. The user may only have one meaningful commit, one small copy change, or one product decision in a given week.

Trace detects this and shifts from Source Mining Mode into Narrative Planning Mode.

Example:

```text
Trace notices only 1 meaningful commit this week:
"fix onboarding copy"

Instead of generating weak content, Trace asks:
- Why did you change the onboarding copy?
- What was confusing before?
- What do you want users to understand faster now?
```

Trace then creates a weekly narrative plan:

```text
Main theme:
You are moving from building the product to clarifying the promise.

Posts for this week:
1. LinkedIn: Why I rewrote the onboarding flow
2. X thread: 5 onboarding mistakes I made in v1
3. Instagram carousel: Before/after onboarding copy
4. LinkedIn: Pricing copy is not about price. It is about what the user thinks they are buying.
5. Substack: The difference between building features and building clarity
```

This keeps Trace useful after the initial build phase and makes it a long-term content strategy system, not only a commit-to-post generator.

### Voice-First Interaction Note

At every point in the user journey where Trace asks the user open-ended questions, the default should be voice input.

This applies to:

- Onboarding: Strategy Doc interview ("What does your product do?" "Who is it for?")
- Weekly Check-In: All 7 default questions and adaptive follow-ups
- Low-Signal Mode: The 3-5 focused follow-up questions
- Voice calibration: "Paste 3 samples of your writing" could also accept "Read aloud something you have written, and Trace will analyze your speaking style vs. your writing style" (Phase 2+)

For the onboarding journey specifically, the Strategy Doc interview should be presented as:

```text
"Let's learn about your product. This takes about 5 minutes."
[large microphone button: "Talk to Trace"]
[small link: "I'd rather type"]
```

Not:

```text
Step 1 of 8: Tell us about your product.
[text area]
[Next button]
```


### Journey B: The Solopreneur

Same as Journey A, but with these differences:
- **Discovery source:** Instagram carousel or LinkedIn post, not X/Twitter
- **Primary format:** Instagram carousels (they need visual content for IG)
- **Source connection:** Google Drive + Notion (more likely than GitHub)
- **Key feature used:** Launch Content Package (F8) when they're ready to launch
- **Content pillar emphasis:** Business lessons, building-in-public stories, product decisions

### Journey C: The Career Switcher

Same as Journey A, but with these differences:
- **Discovery source:** LinkedIn post or word-of-mouth
- **Primary format:** LinkedIn long-form posts (they want recruiter visibility)
- **Source connection:** Google Drive (project docs, performance reviews, strategy decks)
- **Strategy Doc emphasis:** Outcome goal is "inbound recruiter interest" not "users for my product"
- **Content pillar emphasis:** Industry expertise, career lessons, technical depth


### Shared Ongoing Journey: After the Initial Source Mine

For all personas, the initial artifact scan creates the first content backlog. After that backlog is used, Trace relies on a combination of:

- new source activity
- weekly check-ins
- user/customer/recruiter signals
- product or career stage
- evergreen content pillars
- previously approved content patterns

This means Trace can continue planning content even when new artifacts are limited.

Examples:

| Persona | Low-Signal Weekly Input | Content Output |
|---|---|---|
| Vibecoder | "I changed the onboarding and fixed one auth bug." | build log, technical lesson, before/after carousel |
| Solopreneur | "Three users asked what the product actually does." | positioning post, landing page lesson, customer insight thread |
| Career Switcher | "I worked on one portfolio project and had one interview." | proof-of-work post, interview lesson, technical explanation |
| Consultant/Freelancer | "A client asked the same question twice this week." | market insight post, client education carousel, framework post |

---

## 8. Content Output Formats

### Format 1: LinkedIn Long-Form Post

```
STRUCTURE:
- Hook (first 2 lines — must stop the scroll; 3 variants provided)
- Story setup (2–3 sentences of context)
- The insight/lesson/framework (3–5 sentences, specific details)
- Proof/data point (1–2 sentences with numbers or specifics)
- Takeaway (1–2 sentences, actionable)
- CTA (optional, soft — "What's your experience with [X]?" or "Drop your [X] below")

LENGTH: 150–300 words (LinkedIn optimal range)
FORMATTING: Paragraphs, not single-line breaks. Natural prose flow.
SOURCE CITATION: Last line in italics: "↳ Based on [source, date]"

EXAMPLE OUTPUT:
---
Hook (Variant 1): "I spent 3 hours debugging an OAuth redirect. The fix was a trailing slash."
Hook (Variant 2): "The dumbest bugs teach the best lessons. Here's my latest."
Hook (Variant 3): "Every senior engineer has a 'trailing slash' story. Here's mine."

Last Tuesday I shipped a new auth flow for our SaaS. Everything worked locally. 
In staging, users hit a blank white screen after Google login.

Three hours of digging through logs, checking scopes, rebuilding the consent 
screen. Nothing worked. Then my coworker said "check the redirect URI."

Trailing slash. That's it. `auth/callback` vs `auth/callback/`. Google treats 
them as different URIs. Three hours for one character.

What I actually learned: OAuth isn't hard. OAuth configuration is hard. The spec 
is fine. The implementation surface area between your app, the identity provider, 
and the redirect chain is where every bug lives.

Now I keep a pre-flight checklist for every OAuth integration. 5 items. Takes 
2 minutes. Would have saved me 3 hours.

What's your "trailing slash" story?

↳ Based on commit to auth-service, March 15, 2026
---
```

### Format 2: Instagram Carousel Script

```
STRUCTURE:
- Slide 1: Hook slide (scroll-stopper headline, 5–8 words max)
- Slides 2–3: Problem/context (what happened, why it matters)
- Slides 4–7: The meat (insight, framework, steps, or story beats)
- Slide 8: Proof/data slide (numbers, screenshot description, or result)
- Slide 9: Summary/takeaway slide
- Slide 10: CTA slide ("Follow for more [pillar topic]" or "Save this for later")

SLIDES: 8–10 slides total
TEXT PER SLIDE: 15–30 words (must be readable as a phone-screen-sized image)
DESIGN NOTES: Each slide includes a brief design direction for Canva 
  (e.g., "dark background, large white text, code snippet visual")
SOURCE CITATION: Slide 9 or 10 includes "Sourced from real work" subtle badge

EXAMPLE OUTPUT:
---
Slide 1: "3 hours debugging. The fix was 1 character."
Design: Dark background (#1a1a2e), white bold text, monospace font accent

Slide 2: "Shipped a new auth flow. Everything worked locally."
Design: Clean, minimal. Small code snippet visual: `localhost:3000/auth ✓`

Slide 3: "Staging? Blank white screen after Google login."
Design: Error screen mockup. Red accent.

Slide 4: "Checked logs. Rebuilt consent screen. Verified scopes. Nothing."
Design: Terminal/log aesthetic. Scrolling text visual.

Slide 5: "Then my coworker said: 'Check the redirect URI.'"
Design: Chat bubble design. Casual, human.

Slide 6: "auth/callback vs auth/callback/ — Google treats these as different URIs."
Design: Split screen comparison. Highlight the slash in red.

Slide 7: "OAuth isn't hard. OAuth configuration is hard."
Design: Quote format. Large text, minimal.

Slide 8: "Now I use a 5-item pre-flight checklist. Takes 2 min. Saves hours."
Design: Checklist visual with checkboxes.

Slide 9: "Save this before your next OAuth integration."
Design: CTA format. Arrow pointing to save button.

↳ Source: auth-service commit, March 2026
---
```

### Format 3: X/Twitter Thread

```
STRUCTURE:
- Tweet 1: Hook (must work standalone — this is what gets retweeted)
  - 3 hook variants provided
- Tweets 2–3: Context/setup
- Tweets 4–7: The story/insight/framework (one idea per tweet)
- Tweet 8: The lesson/takeaway
- Tweet 9–10 (optional): CTA or related resource

LENGTH: 6–10 tweets per thread
CHARACTERS: Each tweet under 280 characters
FORMATTING: No hashtags in the thread (except optionally tweet 1). 
  No "🧵 Thread:" prefix (that's slop).
SOURCE: Final tweet includes source attribution

EXAMPLE OUTPUT:
---
1/8 Hook (V1): I spent 3 hours debugging OAuth. The fix was a trailing slash.

Here's the checklist I now use before every integration:

1/8 Hook (V2): OAuth isn't hard. OAuth *configuration* is hard.

A story from last week:

1/8 Hook (V3): The dumbest bugs teach the best lessons.

Last week, one character cost me 3 hours:

2/8 Shipped a new Google OAuth flow for our SaaS. Worked perfectly in local dev.

Deployed to staging. Users hit a blank white screen after login.

3/8 Spent 3 hours checking:
- OAuth scopes ✓
- Consent screen config ✓  
- Token exchange logic ✓
- CORS headers ✓

Everything looked correct.

4/8 My coworker walked by. "Did you check the redirect URI?"

auth/callback vs auth/callback/

One trailing slash. Google treats them as completely different URIs.

5/8 The actual lesson: OAuth specs are fine. The bug surface area is the 
*configuration layer* between your app, the IdP, and the redirect chain.

6/8 I now keep a 5-item pre-flight checklist before any OAuth integration:

1. Redirect URI exact match (including trailing slash)
2. Scopes match between request and console
3. Token endpoint accepts your auth method
4. State parameter is validated
5. Error redirect is configured

7/8 Takes 2 minutes. Would have saved me 3 hours.

8/8 What's your "trailing slash" story?

↳ From a real commit, March 2026
---
```

### Format 4: Substack Draft

```
STRUCTURE:
- Title (clear, specific, not clickbait)
- Subtitle/Hook (1 sentence that makes the reader want to continue)
- Opening paragraph (the story, the moment, the hook — 3–4 sentences)
- Section 1–3 (the meat — insights, analysis, framework — 5–7 paragraphs total)
- Takeaway section (what the reader should do differently)
- CTA (subscribe, reply, share — soft and genuine)

LENGTH: 800–1,500 words
TONE: Conversational essay, like a smart blog post
SOURCE CITATION: Opening or closing mentions the source naturally 
  ("This started as a 3 AM debugging session last month...")
```

---

## 9. Data Source Integrations

### Integration Architecture

All integrations follow this pattern:

```
[External Service] → OAuth 2.0 → [Trace Backend] → [Parser/Chunker] → [Vector DB] → [Content Engine]
```

### Integration Details

| Source | Auth Method | Data Pulled | Privacy Level | Phase |
|--------|------------|-------------|---------------|-------|
| Manual Upload | N/A (direct upload) | PDFs, DOCX, TXT, MD, images | User-controlled | Phase 1 |
| GitHub | OAuth 2.0 (GitHub App) | Commits, PRs, READMEs, Issues | Public + private repos (user chooses) | Phase 2 |
| Google Drive | OAuth 2.0 (Google) | Docs, Sheets, Slides content | User selects specific folders | Phase 2 |
| Notion | OAuth 2.0 (Notion) | Pages, databases, content | User selects specific pages | Phase 2 |
| Google Calendar | OAuth 2.0 (Google) | Meeting titles, frequency, attendee count | Metadata only, no content | Phase 3 |
| Slack | Manual export (JSON) | Long messages, threads | User exports manually | Phase 3 |
| Email | Manual export (.mbox/.eml) | Long-form emails | User exports manually | Phase 3 |
| LinkedIn | Public profile URL | Existing public posts | Public only | Phase 3 |
| X/Twitter | API v2 (OAuth) | Existing public tweets | Public only | Phase 3 |
| Claude Code / AI Coding Logs | Manual export or local upload initially | prompts, implementation notes, error messages, accepted/rejected changes, code-generation conversations | User-controlled upload only | Phase 1.5 |
| Weekly Check-In | In-app form/chat | founder reflections, product decisions, lessons, user signals, current uncertainties | First-party data created inside Trace | Phase 1 |
| Voice Transcripts (Weekly Check-In) | Browser-native SpeechRecognition, no auth needed | Spoken answers transcribed to text | First-party, processed locally in browser before submission | Phase 1 |

### Data Processing Pipeline

```
1. INGEST
   - Pull raw data from source
   - Normalize to common format: { source, date, title, content, metadata }

2. CHUNK
   - Split long documents into semantic chunks (500–1000 tokens each)
   - Maintain context: each chunk carries metadata (source file, page, date)

3. EMBED (Phase 2+ only — skip in Phase 1)
   - Phase 1: With ≤10 files per user, pass source chunks directly to LLM. No embeddings needed.
   - Phase 2+: Generate embeddings for each chunk (free model via OpenRouter or Supabase)
   - Store in pgvector

4. EXTRACT
   - LLM reads each chunk with prompt: "Identify content-worthy moments in this text. 
     A content-worthy moment is: a decision and its rationale, a mistake and its lesson, 
     a win and what caused it, a framework or method, an opinion strongly held, 
     a technical insight, or a surprising result."
   - Output: list of story seeds with titles, summaries, and source references

5. MAP
   - Each story seed is matched to the user's content pillars (from Strategy Doc)
   - Unmatched stories are flagged for user review ("This doesn't fit your pillars — want to add a new one?")

6. DEDUPLICATE
   - Compare against user's existing published content (LinkedIn, X)
   - Compare against previously generated content
   - Flag near-duplicates for user review

7. RANK
   - Score each story seed on: pillar relevance, recency, specificity, estimated engagement
   - Present to user in ranked order
```

### 8. SIGNAL ASSESSMENT

After extracting source material, Trace assesses whether there is enough signal to generate useful content.

Signal factors:

- number of new artifacts
- artifact quality
- source freshness
- specificity of extracted stories
- pillar coverage
- duplicate risk
- user's current product stage

If the signal is strong, Trace proceeds with Source Mining Mode.

If the signal is weak, Trace activates Low-Signal Mode and asks the user to complete a Weekly Check-In.

### 9. NARRATIVE PLAN

Trace combines:

- Strategy Doc
- source material
- weekly check-in answers
- product stage
- previous content history
- voice feedback

Then it creates a weekly content plan with 5-10 story seeds.

### 10. PROOF ASSET SUGGESTIONS

For each recommended story, Trace suggests evidence the user can attach:

- screenshot
- commit
- metric
- user quote
- demo clip
- before/after image
- architecture diagram
- landing page copy
- pricing change
- support question

This reinforces the "earned, not generated" positioning.

### F3h: Claude Code / AI Coding Conversation Import

Many builders use AI coding tools heavily but do not maintain detailed Notion docs, Twitter threads, or formal product notes. For these users, Claude Code conversations and AI coding logs are valuable source material because they often contain the "why" behind product decisions.

GitHub shows what changed. Claude Code often shows why it changed.

#### Phase 1.5 Behavior

- User manually uploads exported Claude Code conversations or coding session notes.
- Trace parses the conversation and extracts:
  - feature decisions
  - bugs encountered
  - prompts that reveal product intent
  - rejected approaches
  - implementation tradeoffs
  - moments where the user simplified or changed direction
  - lessons learned from errors
- Trace maps extracted stories to the Strategy Doc pillars.
- Trace cites outputs as:
  - "Based on Claude Code session, April 2026"
  - "Based on implementation notes from onboarding flow build"
  - "Based on debugging conversation around auth flow"

#### Privacy

AI coding conversations may include sensitive code, credentials, or internal context. Trace must:

- warn users before upload
- encourage removing secrets
- never train on uploaded conversations
- allow deletion at any time
- support chunk-level source citations without exposing private code in the final post

### Weekly Check-In as a First-Party Source

Weekly check-ins are stored and treated as source material.

They should be searchable, reusable, and citeable inside Trace.

Example source citation:

```text
↳ Based on your weekly founder check-in, Week of April 29, 2026
```

This allows Trace to create earned content even when external integrations are sparse.


### Data Privacy & Security

- All user data is encrypted at rest (AES-256) and in transit (TLS 1.3)
- User data is NEVER used to train any model
- Users can delete any or all data at any time (hard delete, not soft)
- Data retention: source data is retained for 90 days after last access, then auto-deleted unless user opts to keep
- Clear privacy page on landing site: "Your data is yours. We encrypt it, we never train on it, you can delete it anytime."
- Future: offer BYOK (Bring Your Own Key) tier for users who want to use their own OpenRouter or Anthropic API key
- Future: offer self-hosted option for maximum privacy

---

## 10. Pricing & Tiers

### Free Tier — "Strategy Only"
- **Price:** $0
- **Includes:**
  - Full onboarding interview
  - Personal Brand Strategy Document (viewable + downloadable as PDF)
  - 5 sample posts generated from interview answers
  - Email captured at signup
- **Purpose:** Lead generation. The Strategy Doc is genuinely useful standalone — this gets people in the door.
- **Limitation:** No source connections, no ongoing content generation

### Pro Tier
- **Price:** $39/month or $390/year (2 months free on annual)
- **AI Model:** DeepSeek V3 / Qwen 3 via OpenRouter (high quality, near-zero LLM cost)
- **Includes:**
  - Everything in Free
  - Full content engine — unlimited content generation in all 4 formats
  - Up to 3 source integrations (GitHub, Drive, Notion — pick 3)
  - Manual file uploads (up to 20 files)
  - Content calendar
  - Voice calibration loop
  - Anti-slop engine
  - Hook variant generation (3 per post)
  - Source citations on all content
- **Target:** Individual professionals and solopreneurs

### Studio Tier
- **Price:** $99/month
- **AI Model:** Anthropic Claude Sonnet (best-in-class voice fidelity — the premium upgrade)
- **Includes:**
  - Everything in Pro
  - Multi-brand support (up to 5 brands)
  - Unlimited source integrations
  - Unlimited file uploads
  - White-label Strategy Doc (PDF with custom branding, no Trace logo)
  - Priority generation (faster queue)
  - Autonomous posting (when available — Phase 3)
- **Target:** Ghostwriters, content consultants, agencies managing multiple clients

### Future Consideration
- **Enterprise/API tier:** For companies that want to offer Trace-powered content to their users. Pricing TBD.

---

## 11. Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State management:** React Query (TanStack Query) for server state, Zustand for client state
- **Forms:** React Hook Form + Zod validation
- **Rich text editing:** Tiptap (for content editing before publish)

### Backend
- **Runtime:** Node.js (Next.js API routes for all endpoints in Phase 1)
- **Language:** TypeScript
- **Authentication:** NextAuth.js (supports GitHub, Google OAuth, email/password)
- **Job queue:** Phase 1 — synchronous API calls with loading spinner (no queue needed for 20 users). Phase 2+ — BullMQ + Redis when async processing is needed.
- **File storage:** Supabase Storage (free tier, built into Supabase — no AWS setup needed)

### Database
- **Primary:** PostgreSQL (via Supabase — free tier includes auth, storage, and database)
- **Vector store:** Phase 1 — not needed (≤10 files per user, pass directly to LLM). Phase 2+ — pgvector extension when source data scales.
- **Cache:** Phase 1 — not needed. Phase 2+ — Redis for session data, job queue, rate limiting.

### AI/LLM — Tier-Based Model Routing via OpenRouter

Trace uses **OpenRouter** as the single LLM gateway for Phase 1 and Phase 2. OpenRouter provides access to multiple models through one API key, keeping costs near zero during early growth. Anthropic Claude is reserved for the highest-paying tier only (Studio, Phase 3+).

**Model routing by user tier:**

| User Tier | Primary Model | Slop Detection Model | Why |
|-----------|--------------|---------------------|-----|
| Free | DeepSeek V3 (via OpenRouter) | DeepSeek V3 | Zero/near-zero cost for sample posts |
| Pro ($39/mo) | DeepSeek V3 or Qwen 3 (via OpenRouter) | DeepSeek V3 | Good quality, keeps margins high (~$0.14/M input tokens) |
| Studio ($99/mo) | Anthropic Claude Sonnet (via Anthropic API directly) | Claude Haiku | Best voice fidelity, premium feel, justifies price |

**Available models on OpenRouter (ranked by quality for content generation):**
1. **DeepSeek V3** — best cost/quality ratio, $0.14/M input tokens, strong writing
2. **Qwen 3** — excellent structured output (carousels, threads), comparable to DeepSeek V3
3. **Llama 4 Maverick** — Meta's latest, free tier available, good creative writing
4. **Google Gemini 2.5 Flash** — very fast, cheap, decent quality for light tasks

**Implementation:**
- `src/lib/ai/client.ts` contains a `getModel(userTier)` function that returns the correct model config
- All LLM calls go through this router — no direct model references anywhere else in the codebase
- OpenRouter API is OpenAI-compatible, so switching models requires zero code changes
- When Studio tier launches (Phase 3), add Anthropic SDK as a second client for premium users only

**Embeddings:**
- Phase 1: Skip embeddings entirely. With ≤10 uploaded files per user, pass source chunks directly to the LLM. No pgvector needed yet.
- Phase 2+: Add embeddings when users have 50+ source documents. Use a free/cheap embedding model via OpenRouter or Supabase's built-in embedding support.

**Prompt management:** Version-controlled prompt templates in codebase (not in DB). Same prompts work across all models — the anti-slop rules and voice profile are model-agnostic.

### Integrations
- **GitHub:** GitHub App (OAuth + webhook for real-time commit notifications)
- **Google Drive:** Google Drive API v3 (OAuth 2.0)
- **Notion:** Notion API (OAuth 2.0)
- **Google Calendar:** Google Calendar API v3 (OAuth 2.0)
- **LinkedIn:** LinkedIn API (OAuth 2.0, official — NO scraping, NO cookie auth)
- **X/Twitter:** X API v2 (OAuth 2.0)
- **Instagram:** Meta Graph API / Business Suite API

### Infrastructure
- **Hosting:** Vercel (frontend + API routes) — free tier is sufficient for Phase 1
- **CI/CD:** GitHub Actions (or Vercel's built-in Git deploy)
- **Monitoring:** Phase 1 — console.error + Vercel logs (free). Phase 2+ — Sentry (errors), PostHog (analytics). Phase 3+ — Langfuse (LLM observability, only when optimizing prompt quality at scale).
- **Email:** Resend (free tier, 100 emails/day — enough for Phase 1 waitlist + transactional)

### Dev Tools
- **Package manager:** pnpm
- **Linting:** ESLint + Prettier
- **Testing:** Vitest (unit), Playwright (e2e)
- **Database migrations:** Drizzle ORM

---

## 12. Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255), -- null if OAuth-only
  avatar_url TEXT,
  tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'studio'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Strategy Documents
CREATE TABLE strategy_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  version INT DEFAULT 1,
  positioning_statement TEXT,
  pillar_1_topic VARCHAR(255),
  pillar_1_description TEXT,
  pillar_2_topic VARCHAR(255),
  pillar_2_description TEXT,
  pillar_3_topic VARCHAR(255),
  pillar_3_description TEXT,
  contrarian_takes JSONB, -- array of strings
  origin_story JSONB, -- { beat1, beat2, beat3, beat4, beat5 }
  target_audience JSONB, -- { job_title, experience, company_type, interests, platforms }
  outcome_goal JSONB, -- { primary, secondary, ninety_day_metric }
  voice_profile JSONB, -- { tone, format_pref, anti_patterns, role_models }
  posting_cadence JSONB, -- { linkedin_per_week, ig_per_week, x_per_day, substack_per_month }
  raw_interview_answers JSONB, -- full interview Q&A for reference
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Interview Sessions (for save & resume)
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_section INT DEFAULT 1,
  current_question INT DEFAULT 1,
  answers JSONB DEFAULT '{}', -- { "q1": "answer", "q2": "answer" }
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Connected Sources
CREATE TABLE source_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'github', 'google_drive', 'notion', etc.
  access_token_encrypted TEXT, -- encrypted OAuth token
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  source_metadata JSONB, -- { github_username, selected_repos, etc. }
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Source Chunks (raw ingested + embedded data)
CREATE TABLE source_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_connection_id UUID REFERENCES source_connections(id),
  source_type VARCHAR(50) NOT NULL, -- 'github_commit', 'github_pr', 'gdrive_doc', 'manual_upload', etc.
  source_reference TEXT, -- 'commit abc123', 'PR #142', 'file: retro-q3.docx'
  source_date TIMESTAMPTZ, -- when the original artifact was created
  title TEXT,
  content TEXT NOT NULL,
  content_embedding vector(1536), -- pgvector (Phase 2+ only, nullable in Phase 1)
  metadata JSONB, -- { repo, file_path, page_number, etc. }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Story Seeds (extracted content-worthy moments)
CREATE TABLE story_seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_chunk_id UUID REFERENCES source_chunks(id),
  title TEXT NOT NULL,
  summary TEXT,
  pillar_match VARCHAR(255), -- which content pillar this maps to
  relevance_score FLOAT, -- 0-1
  source_citation TEXT, -- "Based on PR #142 to auth-service, March 2026"
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'used', 'skipped', 'archived'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generated Content
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_seed_id UUID REFERENCES story_seeds(id),
  format VARCHAR(20) NOT NULL, -- 'linkedin', 'instagram', 'x_thread', 'substack'
  hook_variant INT DEFAULT 1, -- 1, 2, or 3
  content TEXT NOT NULL, -- the generated text
  content_metadata JSONB, -- { slides: [...] for carousels, tweets: [...] for threads }
  source_citation TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'approved', 'published', 'rejected'
  voice_feedback VARCHAR(20), -- 'sounds_like_me', 'doesnt_sound_like_me', 'close_but_edited'
  voice_feedback_note TEXT, -- user's note on why it didn't sound right
  edited_content TEXT, -- user's edited version (if they edited before publishing)
  scheduled_for TIMESTAMPTZ, -- when to publish (if scheduled)
  published_at TIMESTAMPTZ,
  generation_prompt_version VARCHAR(50), -- track which prompt version generated this
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Calibration Samples (for few-shot learning)
CREATE TABLE voice_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_content TEXT, -- what Trace generated
  edited_content TEXT, -- what the user changed it to (if edited)
  feedback VARCHAR(20), -- 'sounds_like_me', 'doesnt_sound_like_me', 'close_but_edited'
  feedback_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content Calendar
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  generated_content_id UUID REFERENCES generated_content(id),
  scheduled_date DATE NOT NULL,
  platform VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'published', 'missed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Brands (for Studio tier multi-brand)
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- the account owner
  brand_name VARCHAR(255) NOT NULL,
  strategy_doc_id UUID REFERENCES strategy_docs(id),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded Files (manual uploads)
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50), -- 'pdf', 'docx', 'txt', 'md', etc.
  s3_key TEXT NOT NULL, -- S3/R2 storage path
  file_size_bytes BIGINT,
  processing_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  chunk_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_source_chunks_user ON source_chunks(user_id);
CREATE INDEX idx_source_chunks_embedding ON source_chunks USING ivfflat (content_embedding vector_cosine_ops); -- Phase 2+ only
CREATE INDEX idx_story_seeds_user_status ON story_seeds(user_id, status);
CREATE INDEX idx_generated_content_user_status ON generated_content(user_id, status);
CREATE INDEX idx_content_calendar_user_date ON content_calendar(user_id, scheduled_date);
```

-- Weekly Check-Ins
CREATE TABLE weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  product_stage VARCHAR(20), -- 'building', 'launching', 'operating', 'scaling'
  answers JSONB NOT NULL, -- { q1: answer, q2: answer, ... }
  source_activity_summary JSONB, -- { commits_count, docs_count, uploads_count, stories_found }
  input_mode VARCHAR(10) DEFAULT 'text', -- 'text' or 'voice'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly Narrative Plans
CREATE TABLE narrative_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weekly_checkin_id UUID REFERENCES weekly_checkins(id),
  week_start_date DATE NOT NULL,
  main_theme TEXT,
  product_stage VARCHAR(20), -- 'building', 'launching', 'operating', 'scaling'
  content_strategy TEXT,
  recommended_posts JSONB, -- array of planned post/story objects
  anchor_story JSONB,
  proof_assets JSONB, -- suggested assets to attach
  pillar_balance JSONB,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'approved', 'archived'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Usage Tracking
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL, -- 'content_generation', 'narrative_plan', 'checkin_followup', 'signal_assessment', etc.
  cost_tier SMALLINT NOT NULL, -- 1, 2, or 3
  model_used VARCHAR(100), -- 'claude-opus-4', 'gemini-flash-2.0', etc.
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd NUMERIC(10, 6), -- cost in USD
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Per-User AI Budget
CREATE TABLE ai_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  tier1_requests_limit INTEGER NOT NULL,
  tier2_requests_limit INTEGER NOT NULL,
  tier3_requests_limit INTEGER NOT NULL,
  tier1_requests_used INTEGER DEFAULT 0,
  tier2_requests_used INTEGER DEFAULT 0,
  tier3_requests_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Story Seeds: additional columns for narrative planning
ALTER TABLE story_seeds
ADD COLUMN IF NOT EXISTS source_mode VARCHAR(30) DEFAULT 'source_mining',
ADD COLUMN IF NOT EXISTS weekly_checkin_id UUID REFERENCES weekly_checkins(id),
ADD COLUMN IF NOT EXISTS narrative_plan_id UUID REFERENCES narrative_plans(id),
ADD COLUMN IF NOT EXISTS story_type VARCHAR(50); -- origin, build_decision, mistake_lesson, user_insight, product_pov, launch_distribution, proof

-- Additional indexes
CREATE INDEX idx_weekly_checkins_user_week ON weekly_checkins(user_id, week_start_date);
CREATE INDEX idx_narrative_plans_user_week ON narrative_plans(user_id, week_start_date);
CREATE INDEX idx_story_seeds_source_mode ON story_seeds(user_id, source_mode);
CREATE INDEX idx_ai_usage_user_date ON ai_usage_log(user_id, created_at);
CREATE INDEX idx_ai_budgets_user_period ON ai_budgets(user_id, billing_period_start);
```

---

## 13. API Design

### Authentication Endpoints

```
POST /api/auth/signup          — Email/password registration
POST /api/auth/login           — Email/password login
GET  /api/auth/github          — GitHub OAuth initiation
GET  /api/auth/github/callback — GitHub OAuth callback
GET  /api/auth/google          — Google OAuth initiation
GET  /api/auth/google/callback — Google OAuth callback
POST /api/auth/logout          — Session termination
GET  /api/auth/me              — Current user profile
```

### Interview Endpoints

```
GET    /api/interview                — Get current interview session (or create new)
POST   /api/interview/answer        — Submit answer to current question
         Body: { question_id: string, answer: string }
PUT    /api/interview/answer/:qid   — Update a previous answer
POST   /api/interview/complete      — Mark interview as complete, trigger Strategy Doc generation
GET    /api/interview/progress      — Get interview progress { section, question, percent_complete }
```

### Strategy Document Endpoints

```
GET    /api/strategy                — Get current Strategy Doc
PUT    /api/strategy                — Update Strategy Doc (user edits)
POST   /api/strategy/regenerate     — Regenerate specific section
         Body: { section: string, additional_context?: string }
GET    /api/strategy/pdf            — Download Strategy Doc as PDF
```

### Source Connection Endpoints

```
GET    /api/sources                 — List all connected sources
POST   /api/sources/connect/:type   — Initiate OAuth for a source (github, gdrive, notion)
DELETE /api/sources/:id             — Disconnect a source
POST   /api/sources/:id/sync       — Trigger manual sync for a source
GET    /api/sources/:id/status      — Get sync status { last_synced, chunks_count, stories_found }
```

### Upload Endpoints

```
POST   /api/uploads                 — Upload a file (multipart form data)
GET    /api/uploads                 — List uploaded files
DELETE /api/uploads/:id             — Delete an uploaded file and its chunks
GET    /api/uploads/:id/status      — Get processing status
```

### Content Mine Endpoints

```
GET    /api/stories                 — List story seeds (filterable by pillar, status, source)
         Query: ?pillar=X&status=new&source=github&sort=relevance&page=1
GET    /api/stories/:id             — Get story seed detail
PUT    /api/stories/:id             — Update story seed status (skip, archive)
```

### Content Generation Endpoints

```
POST   /api/generate                — Generate content from a story seed
         Body: { story_seed_id: string, formats: ['linkedin', 'instagram', 'x_thread', 'substack'] }
         Response: { job_id: string } (async — generation takes 10-30 seconds)
GET    /api/generate/:job_id        — Poll generation status + results
POST   /api/generate/sample         — Generate 5 sample posts from Strategy Doc (free tier)
POST   /api/generate/launch-kit     — Generate launch content package
         Body: { product_name: string, product_description: string, key_features: string[] }
```

### Content Management Endpoints

```
GET    /api/content                 — List generated content (filterable)
         Query: ?format=linkedin&status=draft&page=1
GET    /api/content/:id             — Get single content piece with all variants
PUT    /api/content/:id             — Update content (edit, change status)
         Body: { status?: string, edited_content?: string, selected_hook_variant?: number }
POST   /api/content/:id/regenerate  — Regenerate content with guidance
         Body: { guidance?: string } (e.g., "make it more technical")
DELETE /api/content/:id             — Delete content
```

### Voice Calibration Endpoints

```
POST   /api/voice/feedback          — Submit voice feedback for a content piece
         Body: { content_id: string, feedback: 'sounds_like_me' | 'doesnt' | 'close', note?: string }
GET    /api/voice/score             — Get current voice match percentage
GET    /api/voice/samples           — Get all voice feedback samples (for prompt injection)
```

### Calendar Endpoints

```
GET    /api/calendar                — Get content calendar
         Query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
POST   /api/calendar                — Schedule content
         Body: { content_id: string, date: string, platform: string }
PUT    /api/calendar/:id            — Reschedule
DELETE /api/calendar/:id            — Unschedule
```

### Publishing Endpoints (Phase 3)

```
POST   /api/publish/:content_id     — Publish content to platform now
POST   /api/publish/:content_id/schedule — Schedule publish for later
         Body: { publish_at: string }
GET    /api/publish/status/:content_id   — Get publish status
```

### Dashboard/Metrics Endpoints

```
GET    /api/dashboard/stats         — Overall stats (posts generated, published, voice score)
GET    /api/dashboard/pillars       — Content distribution across pillars
GET    /api/dashboard/activity      — Recent activity feed
```

---

### Weekly Check-In Endpoints

```text
GET    /api/checkins/current          — Get current week's check-in or create one
POST   /api/checkins/answer           — Submit or update check-in answer
         Body: { question_id: string, answer: string }
POST   /api/checkins/complete         — Complete check-in and trigger narrative plan
GET    /api/checkins/history          — List previous weekly check-ins
GET    /api/checkins/:id              — Get specific check-in
```

### Narrative Planner Endpoints

```text
GET    /api/narrative/current         — Get current week's narrative plan
POST   /api/narrative/generate        — Generate weekly narrative plan
         Body: { week_start_date?: string, force_low_signal_mode?: boolean }
PUT    /api/narrative/:id             — Edit narrative plan
POST   /api/narrative/:id/approve     — Approve the weekly plan
POST   /api/narrative/:id/create-stories — Convert recommended posts into story seeds
GET    /api/narrative/history         — List past narrative plans
```

### Signal Assessment Endpoint

```text
GET    /api/signal/status             — Assess whether user has enough new source signal
         Response: {
           mode: 'source_mining' | 'low_signal',
           artifacts_found: number,
           stories_found: number,
           recommendation: string
         }
```

### AI Budget & Usage Endpoints

```text
GET    /api/ai/budget              — Get current user's AI budget and usage
GET    /api/ai/usage               — Get usage history for current billing period
GET    /api/admin/ai/costs         — Admin: system-wide cost dashboard
POST   /api/admin/ai/routing       — Admin: update model routing rules
```


## 14. Prompt Engineering Guidelines

### Master System Prompt (Content Generation)

Every content generation call includes this system prompt structure:

```
SYSTEM PROMPT STRUCTURE:

1. ROLE
You are a content writer for [User Name]. You write in their voice, using their 
real work as source material. You are NOT a generic AI writer. You are an extension 
of this specific person's brain.

2. STRATEGY CONTEXT
[Inject full Strategy Doc here — pillars, voice profile, audience, goals]

3. VOICE PROFILE
Tone: [from Strategy Doc]
Format preference: [from Strategy Doc]
They sound like: [from Strategy Doc — role models, style description]
They do NOT sound like: [from Strategy Doc — anti-patterns]

4. VOICE EXAMPLES (few-shot)
Here are examples of content this person approved as "sounds like me":
[Inject up to 5 approved voice samples]

Here are examples they rejected, with their notes:
[Inject up to 3 rejected samples with feedback]

5. ANTI-SLOP RULES
[Inject full anti-slop banned pattern list from Section 6]

6. SOURCE MATERIAL
The following is the source material for this content:
[Inject the specific source chunk/story seed]
Source citation: [Source reference and date]

7. FORMAT INSTRUCTIONS
Generate a [format] post following this structure:
[Inject format-specific template from Section 8]

8. FINAL INSTRUCTION
Write as if you ARE this person. Use specifics from the source material — tool 
names, numbers, timelines, trade-offs. Never be vague. Every sentence should 
contain a detail that only someone who did this work would know.

End with the source citation: "↳ Based on [source citation]"
```

### Prompt Versioning

- All prompts are stored in `/prompts/` directory in the codebase
- Each prompt has a version string (e.g., `v1.2.0`)
- Generated content stores which prompt version produced it (for A/B testing)
- Prompt changes require a changelog entry

### LLM Call Routing

All LLM calls go through `src/lib/ai/client.ts` which routes to the correct model based on user tier. The routing logic is:

```typescript
// Pseudocode for model routing
function getModel(userTier: 'free' | 'pro' | 'studio', taskType: string) {
  if (userTier === 'studio') {
    // Studio users get Anthropic Claude via direct API
    return taskType === 'slop_check' ? 'claude-haiku-4-5' : 'claude-sonnet-4';
  }
  // Free and Pro users go through OpenRouter
  return taskType === 'slop_check' ? 'deepseek/deepseek-chat-v3' : 'deepseek/deepseek-chat-v3';
}
```

**Task-to-model mapping (Free/Pro tier — OpenRouter):**

| Task | Model | Reason |
|------|-------|--------|
| Strategy Doc generation | DeepSeek V3 | Good synthesis quality, near-zero cost |
| Content generation (all 4 formats) | DeepSeek V3 | Strong writing quality at $0.14/M input tokens |
| Hook variant generation | DeepSeek V3 or Qwen 3 | Both handle creative variation well |
| Anti-slop detection (post-gen check) | DeepSeek V3 | Fast, cheap, binary pass/fail output |
| Story seed extraction from source chunks | DeepSeek V3 | Sufficient nuance for extraction |
| Voice similarity scoring | DeepSeek V3 | Simple comparison task |
| Interview follow-up question generation | DeepSeek V3 | Conversational and adaptive |
| Embedding generation | Skip in Phase 1 | Not needed with ≤10 files per user |

**Task-to-model mapping (Studio tier — Anthropic API):**

| Task | Model | Reason |
|------|-------|--------|
| Strategy Doc generation | Claude Sonnet | Highest quality synthesis |
| Content generation (all 4 formats) | Claude Sonnet | Best voice fidelity |
| Hook variant generation | Claude Sonnet | Superior creativity |
| Anti-slop detection (post-gen check) | Claude Haiku | Fast, cheap, binary output |
| Story seed extraction | Claude Sonnet | Best nuance |
| Voice similarity scoring | Claude Haiku | Lightweight comparison |
| Interview follow-up questions | Claude Sonnet | Most natural conversation |

**OpenRouter API format (OpenAI-compatible):**

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-chat-v3',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    max_tokens: 2000,
  }),
});
```

**Cost estimation (Phase 1, 20 users):**
- Average 10 posts/user/week × 20 users = 200 generations/week
- ~2,000 tokens per generation = 400K tokens/week
- DeepSeek V3 at $0.14/M input: **~$0.06/week total**
- Monthly LLM cost for Phase 1: **under $1**

---

### Weekly Narrative Planner Prompt Template

Store in `/prompts/weekly-narrative-planner.md`:

```text
ROLE
You are the weekly narrative strategist for [User Name]. Your job is not to generate random content ideas. Your job is to turn the user's real work, product decisions, lessons, and current uncertainties into a coherent weekly content strategy.

STRATEGY CONTEXT
[Inject full Strategy Doc]

RECENT SOURCE ACTIVITY
[Inject summary of commits, uploads, docs, story seeds, and whether source activity is low]

WEEKLY CHECK-IN ANSWERS
[Inject user answers]

PRODUCT STAGE
[Building / Launching / Operating / Scaling]

PREVIOUS CONTENT
[Inject recently generated or approved content to avoid repetition]

ANTI-SLOP RULES
[Inject full banned pattern list]

TASK
Create a Weekly Narrative Plan with:
1. Main theme
2. Product stage
3. Content strategy
4. 5-10 recommended story seeds
5. One anchor story for long-form content
6. Supporting posts across LinkedIn, X, Instagram, and/or Substack
7. Proof assets the user should attach
8. Pillar balance
9. Source notes for every idea

RULES
- Every idea must be grounded in the user's real work or weekly check-in.
- Do not invent fake traction, fake users, fake lessons, or fake metrics.
- Prefer specific, earned stories over broad advice.
- If the source signal is thin, extract the deeper decision, tradeoff, or uncertainty.
- Avoid generic founder content.
- Avoid motivational platitudes.
- The plan should feel like a clear editorial strategy for the week.
```

### Low-Signal Follow-Up Prompt Template

Store in `/prompts/low-signal-followup.md`:

```text
ROLE
You help a builder turn small weekly signals into useful content.

CONTEXT
The user has limited new source activity this week:
[Inject source activity summary]

STRATEGY DOC
[Inject Strategy Doc]

TASK
Ask 3-5 focused questions that will help extract content-worthy stories from this low-signal week.

QUESTION RULES
- Ask about decisions, tradeoffs, user signals, lessons, and uncertainty.
- Do not ask generic journaling questions.
- Reference any small source activity available.
- Keep questions short and easy to answer.
- The user should be able to complete this in under 10 minutes.
```

### Model-Aware Prompt Design

All prompt templates should be written to work across multiple model providers, not only Claude. This is required because the model routing layer (F15) may send different tasks to different models.

Rules for model-portable prompts:

- Do not use Claude-specific XML tag conventions unless the task is guaranteed to route to Claude.
- Use clear natural language section headers (ROLE, CONTEXT, TASK, RULES) that work across all models.
- Keep system prompts under 2,000 tokens for Tier 3 tasks. Small models have smaller context windows and perform worse with long instructions.
- For Tier 1 tasks (content generation), the full prompt with Strategy Doc, voice samples, anti-slop rules, and content history can be longer (up to 8,000 tokens).
- For Tier 2 tasks (narrative planning, story extraction), keep prompts under 4,000 tokens.
- Test every prompt template against at least two model providers before shipping.


## 15. Content Marketing & Distribution Strategy

### Pre-Launch (Weeks 1–4)

#### The Validation Play
1. Build a landing page in 2 hours
   - Headline: "You ship code. Trace ships your story."
   - Subheadline: "Your GitHub, docs, and real work — turned into content that sounds like you."
   - Email waitlist field
   - "Things Trace will never write" section (the anti-slop list as a demo)
   - Social proof placeholder: "Join [X] builders on the waitlist"

2. Post the anti-slop content piece on Instagram and LinkedIn (this is the viral hook)
   - Instagram carousel: "Things this AI tool refuses to write" — slide by slide through the banned patterns
   - LinkedIn post: "Why I built a content tool that refuses to write 'Unpopular opinion:'"

3. Validation thresholds:
   - 100+ waitlist signups in 2 weeks → build Phase 1
   - 20+ signups → narrow targeting, try different hooks
   - <10 signups → reposition or kill it

### Launch & Ongoing (Weeks 5+)

#### Instagram (5 posts/week, carousel-first)
1. "I gave my AI tool 30 of my old client docs. Here's the 90-day content calendar it built."
2. "Things this tool refuses to write." (The anti-slop list — shareable, viral)
3. "Before/After: what your client retro doc becomes when AI mines it for content." (Side-by-side)
4. Persona demos: "If you're a [data analyst / PM / engineer] with 0 LinkedIn posts, here's 7 days with Trace."
5. Series: "I analyzed 100 LinkedIn posts that hit 50K+ impressions. Here's what they all have."

#### LinkedIn (3 posts/week, long-form)
1. The origin post: "I built this because I had 10 years of work and 0 posts about it."
2. Public dashboard: "Day 14 using my own tool. 4 posts, 12K impressions, 3 inbound DMs."
3. Counter-positioning: "Why I refused to add 'unpopular opinion' to my LinkedIn tool."
4. Teardowns: "I rewrote 5 viral LinkedIn posts to remove the slop. Here's the diff."

#### X/Twitter (daily, build-in-public)
- Daily metrics, daily insights
- Hot takes about content quality (using the tool's own guardrails, ironically)
- Engage in vibecoder / indie hacker communities

#### Substack (weekly)
- Newsletter name: "Receipts" or "The Quiet Brand"
- Each issue analyzes one person's content engine — what works, what's slop, what's earned
- Eventually features Trace users as case studies

#### Reddit (background)
- r/Entrepreneur, r/SaaS, r/SideProject — genuine build-in-public posts, no pitching
- r/marketing — data-driven analysis posts, mention tool only in comments
- r/DataAnalysis, r/webdev — community-specific angles

### The Compounding Play

Every post Vismay publishes is proof the tool works. Within 90 days, he has a personal brand built using his own product, with metrics to prove it. That becomes the marketing forever. **The founder IS the case study.**

---

## 16. Build Phases & Milestones

### Phase 1: Core Product (Weeks 1–6)

**Phase 1 Stack (minimal — 4 services total):**
- Next.js on Vercel (free tier)
- Supabase (Postgres + auth + file storage — free tier)
- OpenRouter (DeepSeek V3 for LLM — near-zero cost)
- Resend (email — free tier)
- **Total monthly cost: ~$0-5**

**Scope:**
- Landing page + waitlist
- User authentication (email + GitHub OAuth)
- Onboarding interview flow (chat-based, 15–20 questions, save & resume)
- Strategy Document generation + display + PDF download
- Manual file upload (up to 10 files per user, stored in Supabase Storage)
- File parsing + chunking (no embeddings/pgvector — pass chunks directly to LLM)
- Story seed extraction from uploaded files
- Content generation in all 4 formats via OpenRouter (DeepSeek V3)
- 3 hook variants per post
- Source citation on every generated piece
- Anti-slop engine (banned patterns + post-gen slop detector)
- Basic content management (draft, approve, reject, edit)
- Voice feedback (sounds like me / doesn't)
- Copy-to-clipboard publishing

**NOT in Phase 1:**
- No API integrations (GitHub, Drive, Notion)
- No content calendar
- No autonomous posting
- No metrics dashboard
- No multi-brand

**Milestone:** 20 beta users (free, from personal network) using the tool and providing voice feedback

**Success criteria:** 80%+ of users say the Strategy Doc was "genuinely useful" AND 60%+ of generated content is marked "sounds like me"

**Additional Phase 1 Scope (F13/F14/F15):**
- Weekly Check-In flow
- Low-Signal Mode
- Weekly Narrative Planner
- Product stage selection: building, launching, operating, scaling
- Narrative plan generation from Strategy Doc + check-in answers
- Convert narrative plan items into story seeds
- Basic proof asset suggestions
- Manual Claude Code conversation upload support, if technically simple
- Voice input for Weekly Check-In using browser Web Speech API
- Text-to-speech for AI follow-up questions using browser SpeechSynthesis API (optional, can be toggled off)
- AI task classification and model routing (Tier 1, 2, 3)
- OpenRouter integration with model selection per task type
- Per-user AI budget tracking
- Strategy Doc and voice calibration caching
- Request batching for check-in processing
- Graceful degradation when AI budget is exhausted

**Additional Phase 1 Success Criteria:**
- 70%+ of beta users complete at least one Weekly Check-In
- 60%+ of Weekly Narrative Plan story seeds are approved or saved
- Users with fewer than 3 new artifacts/week still approve at least 1 generated post/week
- 50%+ of check-in completions use voice input
- Average check-in completion time under 7 minutes in voice mode
- AI cost per user per week under $0.50 on the free tier
- System operates within OpenRouter free tier limits for up to 10 beta users

### Phase 2: Integrations + Public Launch (Weeks 7–12)

**Stack additions in Phase 2:**
- Stripe (payments — Pro tier $39/mo)
- Google OAuth (for Drive integration)
- Notion OAuth
- Redis + BullMQ (async job processing for source scanning)
- Sentry (error tracking — free tier)
- PostHog (analytics — free tier)
- pgvector (when users accumulate 50+ source documents)

**Scope:**
- GitHub integration (OAuth + commit/PR scanning + auto-sync)
- Google Drive integration (OAuth + doc scanning)
- Notion integration (OAuth + page scanning)
- Ship-to-Post pipeline (auto-draft from new commits)
- Content calendar (weekly/monthly view + scheduling)
- Improved voice calibration (few-shot learning from feedback)
- Stripe integration for Pro tier ($39/mo)
- Launch on Product Hunt, Indie Hackers

**Milestone:** 100 paying Pro users

**Success criteria:** $3,900 MRR, <5% monthly churn

**Additional Phase 2 Scope (F13/F14/F15):**
- Improved source signal assessment
- Claude Code / AI coding log import
- Automatic connection between GitHub activity and weekly check-in prompts
- Narrative plan calendar integration
- Better product-stage detection based on user behavior and source activity
- Real-time conversational voice check-in (hybrid: browser STT + cloud TTS)
- Voice quality upgrade: natural-sounding AI interviewer voice
- AI cost dashboard for admin
- Per-user usage dashboard ("You have X credits remaining this week")
- Dynamic model routing optimization based on cost-per-quality benchmarks
- Evaluate direct API keys vs. OpenRouter for cost at scale

**Additional Phase 2 Success Criteria:**
- Voice check-in completion rate is 2x higher than text check-in completion rate
- AI cost per user per week under $0.30 for free tier, under $1.00 for paid tier
- Model routing achieves equivalent content quality at 40%+ lower cost vs. single-model approach

### Phase 3: Full Platform (Weeks 13–20)

**Stack additions in Phase 3:**
- Anthropic API key (Claude Sonnet/Haiku — Studio tier users only)
- LinkedIn API, X API, Meta Graph API (autonomous posting)
- Langfuse (LLM observability — optimize prompt quality at scale)

**Scope:**
- Calendar integration (Google Calendar)
- Slack/Email export support
- LinkedIn + X existing post deduplication
- Autonomous posting via platform APIs (LinkedIn, X, Instagram)
- Launch Content Package feature
- Metrics dashboard (basic — posts published, voice score, pillar balance)
- Studio tier ($99/mo) with multi-brand support
- White-label Strategy Doc PDF

**Milestone:** $5K MRR

**Success criteria:** 150+ paying users across Pro and Studio tiers


**Additional Phase 3 Scope (F13/F14/F15):**
- Advanced weekly planning with performance feedback
- Plan future content based on what previously performed well
- Launch-stage and operating-stage templates
- Automated weekly reminder to complete check-in
- Metrics-informed recommendations for content themes
- Advanced voice features: voice notes, push-to-talk check-in from mobile notification
- AI budget self-service: users can see and manage their usage
- Pay-as-you-go overage option for power users
- Provider-level cost negotiation and volume discounts
- A/B testing of model quality across providers for each task type

### Phase 4: Scale (Weeks 21+)

**Scope:**
- Advanced analytics (platform metrics ingestion — impressions, engagement, followers)
- AI-powered scheduling (optimal post times based on audience data)
- Carousel image generation (not just scripts — actual Canva-ready or in-app generated images)
- Team features (for small content teams)
- API access for developers
- BYOK (Bring Your Own Key) tier
- Mobile app (React Native) for content review on the go

---

## 17. Risks & Mitigations

### Risk 1: Voice Fidelity Failure (CRITICAL)
- **Risk:** Generated content sounds generic despite Strategy Doc and voice profile
- **Impact:** Entire product positioning collapses. Users churn immediately.
- **Mitigation:**
  - Heavy hand-tuning for first 20 users
  - Weekly voice calibration loops where users mark posts
  - Don't scale marketing until 80%+ voice match rate
  - Use few-shot examples from approved content
  - Allow users to provide writing samples for better voice matching

### Risk 2: Crowded Market
- **Risk:** Taplio, Kleo, Supergrow, Postiv, Brandled already exist
- **Impact:** Users compare features and see Trace as "another LinkedIn tool"
- **Mitigation:**
  - Lead marketing with Strategy Doc (no competitor offers this)
  - Position as "distribution engine for builders" not "LinkedIn tool"
  - Anti-slop engine as visible differentiator
  - Source citation feature is unique

### Risk 3: Privacy Sensitivity
- **Risk:** Users uploading client docs and connecting work accounts creates anxiety
- **Impact:** Users won't connect their most valuable data sources
- **Mitigation:**
  - Clear privacy page: "Your data is never used to train models, encrypted at rest, deletable anytime"
  - Let users select exactly which repos/folders/pages to include
  - Future: BYOK and self-hosted options
  - SOC 2 compliance roadmap for Studio tier customers

### Risk 4: LinkedIn Account Safety
- **Risk:** Users fear getting their LinkedIn account flagged or banned
- **Impact:** Users won't use LinkedIn publishing features
- **Mitigation:**
  - NEVER use cookie-based auth, Chrome extensions, or scraping
  - Use LinkedIn's official API only
  - Make this a positioning point: "We won't get your account banned"
  - Phase 1 is copy-to-clipboard only — zero LinkedIn API interaction

### Risk 5: Build Complexity Exceeds Runway
- **Risk:** This is 3–4x more complex than a simple coaching tool. Multiple integrations, prompt engineering, multi-format generation.
- **Impact:** Months of building with no revenue
- **Mitigation:**
  - Phase 1 is manual-upload-only — validate positioning wedge before building integrations
  - If 20 users won't pay $39/mo for Strategy Doc + 4-format generation alone, integrations won't save it
  - Ship Phase 1 in 4 weekends (manual uploads, no integrations)

### Risk 6: Anti-Slop Guardrails Get Cloned
- **Risk:** Indie hackers copy the banned-patterns list within weeks
- **Impact:** Differentiator disappears
- **Mitigation:**
  - The moat isn't the prompt — it's the Strategy Doc + work-history mining + multi-format output coherence + voice calibration loop
  - Build the moat in the workflow, not the prompts

### Risk 7: API Rate Limits & Costs
- **Risk:** LLM API costs could eat into margins
- **Impact:** Unprofitable unit economics
- **Mitigation:**
  - Phase 1–2: Using DeepSeek V3 via OpenRouter at $0.14/M input tokens — estimated cost is under $1/month for 20 users. Even at 100 Pro users, LLM costs are ~$5-10/month. Margins are massive.
  - Only Studio tier ($99/mo) uses Anthropic Claude, which costs ~$3-5/user/month — still 95%+ margin.
  - OpenRouter lets you switch models instantly if pricing changes or better models appear.
  - Cache generated content aggressively — don't regenerate if source material hasn't changed.
  - Monitor cost per user per month in a simple dashboard.


### Risk 8: Source Activity Drought

- **Risk:** After the initial build phase, users may have fewer commits, fewer docs, and fewer new artifacts. Trace may appear to "run out of content."
- **Impact:** The product becomes useful only during active building and loses long-term retention.
- **Mitigation:**
  - Add Weekly Narrative Planner as a first-class feature.
  - Treat weekly founder reflections as source material.
  - Detect low source activity and trigger Low-Signal Mode.
  - Ask targeted questions that extract decisions, tradeoffs, user signals, and lessons.
  - Create content plans from product stage, Strategy Doc, and previous story seeds.
  - Suggest proof assets to keep content grounded.
  - Position Trace as a founder narrative system, not only a commit-to-post generator.

### Risk 9: Weak Reflection Inputs

- **Risk:** Users may give short or vague weekly check-in answers.
- **Impact:** Narrative plans become generic.
- **Mitigation:**
  - Use adaptive follow-up questions.
  - Reference specific small signals, like one commit or one uploaded screenshot.
  - Ask "why did this matter?" and "what changed because of this?"
  - Allow voice notes in future versions to reduce friction.
  - Show examples of strong weekly answers.

### Risk 10: Fake Founder Lessons

- **Risk:** The planner may over-interpret small updates and create lessons the user does not actually believe.
- **Impact:** Content feels fake, which breaks the trust promise.
- **Mitigation:**
  - Require every narrative plan item to cite a source or check-in answer.
  - Label speculative ideas as "needs user confirmation."
  - Avoid invented metrics, fake users, or exaggerated stakes.
  - Include an approval step before turning plan items into generated content.

### Risk 11: AI Compute Budget Exhaustion

- **Risk:** Free-tier API limits (50 requests/day on OpenRouter) are consumed before the product reaches paying users. Alternatively, early paying users generate more AI cost than their subscription covers.
- **Impact:** The product stops functioning for all users or operates at a loss.
- **Mitigation:**
  - Implement three-tier model routing so cheap tasks never consume expensive model budgets.
  - Cache Strategy Doc analysis, voice calibration, and pillar definitions aggressively.
  - Batch multiple small AI calls into single requests where possible.
  - Set per-user weekly AI budgets with graceful degradation, not hard failures.
  - Track cost per user per week from day one.
  - Route to frontier models only for final content generation, not for classification or extraction.
  - Plan to move from OpenRouter free tier to paid tier as soon as first subscription revenue arrives.
  - Never assume AI is free. Price subscriptions to cover at least 3x the expected AI cost per user.

### Risk 12: Voice Transcription Quality

- **Risk:** Browser-native speech-to-text (Web Speech API) produces inaccurate transcripts, especially for non-native English speakers, technical jargon, or product-specific terminology.
- **Impact:** Check-in answers are garbled. AI follow-ups are based on misheard input. User trust drops.
- **Mitigation:**
  - Always show the transcript in real-time so the user can catch errors immediately.
  - Allow inline editing of the transcript before submitting.
  - Store the corrected transcript, not the raw speech output.
  - In Phase 2, evaluate Whisper API or Deepgram as higher-accuracy alternatives for users who experience frequent errors.
  - Add a "Did Trace hear you correctly?" confirmation step after each answer (optional, user can disable).

### Risk 13: Model Provider Dependency

- **Risk:** Trace depends on a single model provider (e.g., only Claude, only OpenAI). If that provider changes pricing, rate limits, or availability, Trace breaks.
- **Impact:** Service disruption or sudden cost increase.
- **Mitigation:**
  - Use OpenRouter as an abstraction layer so Trace is provider-agnostic.
  - Test all prompt templates against at least two model providers.
  - Maintain a fallback model for each cost tier.
  - Do not use provider-specific features (Claude XML tags, OpenAI function calling format) in prompts unless the task is pinned to that provider.
  - Monitor model quality monthly and re-route if a cheaper model reaches equivalent quality.

---

## 18. Design & UX Principles

### Visual Identity
- **Aesthetic:** Clean, developer-friendly, anti-corporate. Think Linear or Raycast, not Salesforce.
- **Color palette:** Dark mode primary. Neutral tones with one accent color.
- **Typography:** Monospace accents for code/source references. Clean sans-serif for body text.
- **No:** Gradients, illustrations of abstract people, stock photography, excessive animations.

### UX Principles
1. **Show the source, always.** Every piece of generated content must visually link back to its source material. This is the core trust mechanism.
2. **Never feel like AI.** The UI should feel like a smart writing assistant, not a content factory. Avoid "Generate 50 posts" energy.
3. **Earned, not generated.** Copy throughout the app emphasizes that the content comes from the user's real work. "Your commit → Your post" not "AI → Post."
4. **One-click to value.** From any screen, the user should be no more than 1 click away from useful content.
5. **Respect time.** The onboarding interview shows progress. Content generation shows estimated time. Everything feels respectful of a builder's limited time.
6. **No dark patterns.** No fake urgency, no misleading CTAs, no hiding the cancel button.

### Key UI Screens

1. **Dashboard** — Content calendar view, recent drafts, voice score, pillar balance
2. **Interview** — Chat-style interface, progress indicator, save & resume
3. **Strategy Doc** — Full rendered document, section-by-section editing
4. **Content Mine** — Ranked list of story seeds with source info and pillar tags
5. **Content Editor** — Generated content with hook variants, format tabs, edit mode, source citation
6. **Sources** — Connected integrations, sync status, file uploads
7. **Calendar** — Weekly/monthly content schedule
8. **Settings** — Account, billing, integrations, data management (delete my data)


9. **Weekly Planner** — Weekly planning interface with signal status, check-in chat, narrative plan preview, and proof asset reminders
10. **Voice Check-In** — Voice-first check-in interface with large microphone button, live transcript, AI follow-up display, and mode toggle

### Weekly Planner Screen

A weekly planning interface that appears when the user starts a new content week or when Trace detects low source activity.

Core components:

1. **Signal Status Card**
   - Shows whether Trace found enough new source material.
   - Example: "Light activity this week: 1 commit, 0 docs, 0 uploads."

2. **Weekly Check-In Chat**
   - 5-7 short questions.
   - Adaptive follow-ups.
   - Save and resume.

3. **Narrative Plan Preview**
   - Main theme for the week.
   - 5-10 recommended post ideas.
   - Platform suggestions.
   - Pillar balance.
   - Suggested proof assets.

4. **Convert to Stories**
   - User can approve the plan and convert selected recommendations into story seeds.

5. **Proof Asset Reminder**
   - Trace asks for screenshots, metrics, user quotes, demos, or before/after visuals that can make the content more grounded.

### Voice Check-In Screen

The voice check-in is the primary interface for the Weekly Check-In.

Core components:

1. **Question Display**
   - Current question shown as large, readable text.
   - No question numbering. No progress bar. The conversation ends when it ends.

2. **Microphone Button**
   - Large, central, prominent.
   - Three states: idle (gray), listening (pulsing blue/green), processing (spinner).
   - Tap to start. Tap again or wait 2-3 seconds of silence to stop.

3. **Live Transcript**
   - Appears below the question as the user speaks.
   - Editable before submission.
   - "Submit" button or auto-submit after user confirms.

4. **AI Response Area**
   - Follow-up question or next question appears here.
   - Optionally read aloud (toggle: "Read questions aloud").

5. **Mode Toggle**
   - Small link: "Switch to typing" / "Switch to voice"
   - Persistent across the session. Remembered for next check-in.

6. **Session Summary**
   - After the check-in is complete, show a summary of all answers.
   - "Edit any answer" option before finalizing.
   - "Generate my weekly plan" button.

### AI Budget Indicator (Paid Tiers)

A small, non-intrusive indicator showing remaining AI credits for the week.

- Location: Settings page or dashboard sidebar.
- Format: "12 of 25 AI credits used this week" or a simple progress bar.
- Warning state: When 80% of credits are used, show a gentle alert.
- Exhausted state: Show the graceful degradation message defined in F15.

### UX Principle Addition

**Stay useful when the work gets quiet.**
Trace should not require constant shipping activity to create valuable content. When source activity slows down, the product should help users reflect, extract lessons, and plan their narrative instead of producing filler.

---

## 19. Metrics & Success Criteria

### North Star Metric
**Weekly Active Content Approvers** — users who approve at least 1 generated post per week. This measures both engagement (they're using the tool) and quality (they approve what it generates).

### Key Metrics by Phase

#### Phase 1
- Waitlist signups: 100+ in first 2 weeks
- Beta users: 20 active users
- Strategy Doc satisfaction: 80%+ rate it "useful" or "very useful"
- Voice match: 60%+ of generated content marked "sounds like me"
- Time to first approved post: under 45 minutes from signup

#### Phase 2
- Paying users: 100 Pro subscribers
- MRR: $3,900
- Monthly churn: <5%
- Content approved per user per week: 2+ posts
- Voice match: 80%+
- Integration adoption: 70%+ of Pro users connect at least 1 source

#### Phase 3
- Paying users: 150+ across Pro and Studio
- MRR: $5,000+
- Monthly churn: <3%
- Content published per user per week: 3+ posts
- Studio adoption: 10+ Studio subscribers
- Autonomous posting usage: 50%+ of Pro users enable auto-publish

### Vanity Metrics (Track but Don't Optimize For)
- Total posts generated (doesn't matter if they're not approved)
- Total sources connected
- Total files uploaded
- Social media followers of Trace's own accounts


### Additional Metrics (F13/F14/F15)

#### Phase 1 Additional Metrics
- Weekly Check-In completion rate
- Narrative plans generated per active user
- Story seeds created from Low-Signal Mode
- Approval rate of Weekly Narrative Planner story seeds
- Percent of users with low source activity who still approve at least 1 post/week
- Voice adoption rate: percentage of check-ins completed in voice mode
- Check-in completion rate: voice vs. text
- Average check-in duration: voice vs. text
- Transcript edit rate (proxy for speech-to-text accuracy)
- AI cost per user per week
- AI cost per generated post
- Cache hit rate for Strategy Doc, voice calibration, and pillar definitions
- API requests per user per weekly cycle
- Percentage of weeks where AI budget was exhausted before all content was generated

#### Phase 2 Additional Metrics
- Low-Signal Mode recovery rate: percentage of low-source weeks that still produce at least 3 usable story seeds
- Product-stage accuracy: user confirms Trace correctly identified building/launching/operating/scaling stage
- Narrative-to-publish conversion: percentage of planned posts that become approved or published content
- Cost per model tier (Tier 1 vs. Tier 2 vs. Tier 3 spend)
- Model routing efficiency: quality score per dollar spent
- Voice check-in satisfaction score
- Revenue-to-AI-cost ratio (target: subscription revenue is at least 3x AI cost)

#### North Star Metric Clarification

Weekly Active Content Approvers should include users who approve content generated from either:

- source-mined artifacts
- weekly narrative plans
- check-in-based story seeds

This prevents the North Star Metric from overvaluing only users with constant source activity.

---

## 20. Appendix

### A. Competitor Landscape

| Tool | What It Does | What It Lacks | Trace's Advantage |
|------|-------------|---------------|-------------------|
| Taplio | LinkedIn content suite, scheduling, analytics | No positioning/strategy, serves career creators | Strategy Doc, anti-slop, work mining |
| Kleo | LinkedIn AI ghostwriter | No multi-platform, no source mining | 4-format output, source citations |
| Supergrow | LinkedIn + X content generation | Generic AI output, no brand positioning | Voice fidelity, anti-slop engine |
| Postiv | LinkedIn carousel generator | LinkedIn only, no strategy | Full platform coverage, Strategy Doc |
| Brandled | Personal branding AI | Broad/unfocused, not builder-specific | Builder persona focus, GitHub integration |
| Buffer/Hootsuite | Social scheduling | No content generation, no strategy | Full generation + strategy + scheduling |

### B. Naming Options

| Name | Meaning | Pros | Cons | Status |
|------|---------|------|------|--------|
| **Trace** | Tracing expertise back to its source | Clean, memorable, ties to source-mining concept | Minor conflict with TraceSieve project (different category) | **SELECTED** |
| Receipts | Slang for proof | Aligns with "earned, not generated" pitch | Might confuse non-native English speakers | Backup |
| Marginalia | Thoughts in the margins | Scholarly, differentiated | Requires explanation, hard to spell | Rejected |
| Backstory | Descriptive | Easy to grasp | Generic, likely domain conflicts | Rejected |
| Wellspring | Source metaphor | Poetic | Overwrought, not builder-friendly | Rejected |

### C. Key Phrases & Copy Reference

- **Tagline:** "You ship code. Trace ships your story."
- **Positioning line:** "Content from your codebase, not ChatGPT."
- **Value prop:** "Your commits have stories. We find them."
- **Anti-slop hook:** "Things Trace will never write."
- **Builder-specific:** "Built something real? Now say it out loud."
- **Strategy Doc pitch:** "McKinsey-level brand positioning in 30 minutes for $40/month."
- **Trust line:** "Every post cites its source. Your content is earned, not generated."
- **Safety line:** "We won't get your account banned."


### F. Ongoing Content Strategy When Source Activity Slows

Trace must support the reality that builders do not produce equally rich artifacts every week. During active development, GitHub commits, PRs, and docs may provide a strong content stream. After the product is mostly built, the founder's valuable work shifts into less visible activities:

- talking to users
- rewriting positioning
- fixing onboarding
- changing pricing
- deciding what not to build
- learning from objections
- preparing a launch
- supporting early users
- interpreting analytics
- making roadmap tradeoffs

These moments are still content-worthy, even if they do not create many commits.

Therefore, Trace's long-term content strategy should be based on:

```text
Historical build artifacts
+ Strategy Doc
+ Weekly founder check-ins
+ Product stage
+ User/customer signals
+ Evergreen content pillars
+ Proof assets
```

The strategic shift is:

```text
Early product:
"What did I ship?"

Maturing product:
"What am I learning from building, launching, selling, supporting, and improving this?"
```

This ensures Trace remains a durable content engine, not a short-lived commit-to-post tool.

#### Example: One Slow Week

Input:

```text
Commit: fixed onboarding copy
Commit: changed pricing copy
Commit: added waitlist form
```

Output content plan:

| Day | Platform | Post Angle |
|---|---|---|
| Monday | LinkedIn | "I changed my onboarding because I was explaining features before value." |
| Tuesday | X | "3 onboarding mistakes I made in v1." |
| Wednesday | Instagram | "Before/after: confusing onboarding vs clear onboarding." |
| Thursday | LinkedIn | "Pricing copy is not about price. It is about what the user thinks they are buying." |
| Friday | X | "I added a waitlist form before finishing the product. Here is why." |
| Sunday | Substack | "What building Trace taught me about founder-led distribution." |

This plan comes from small signals, but the content is still earned because each idea is tied to a real change, decision, or lesson.

### G. AI Compute Economics Reference

#### Why This Matters

Trace is an AI-native product. Every core action involves at least one AI call. Unlike traditional SaaS where compute costs are negligible per user, Trace has meaningful per-user AI costs that scale linearly with usage.

The business model only works if:

```text
Subscription price per user > AI cost per user x 3
```

The 3x multiplier accounts for infrastructure, hosting, development time, and margin.

#### Cost Reference Table (April 2026, approximate)

| Model | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) | Use In Trace |
|---|---|---|---|
| Claude Opus | $15.00 | $75.00 | Tier 1: final content, voice matching |
| Claude Sonnet | $3.00 | $15.00 | Tier 2: narrative planning, story extraction |
| Claude Haiku | $0.25 | $1.25 | Tier 3: classification, assessment |
| GPT-4o | $2.50 | $10.00 | Tier 2 alternative |
| GPT-4o-mini | $0.15 | $0.60 | Tier 3 alternative |
| Gemini 2.0 Flash | $0.10 | $0.40 | Tier 3, cheapest option |
| Gemini 2.5 Pro | $1.25 | $10.00 | Tier 2 alternative |

These prices change frequently. Trace should track actual costs via OpenRouter billing, not hardcoded assumptions.

#### Example: Weekly Cost Per User (Paid Tier, 7 Posts)

```text
Check-in follow-ups (4 calls, Tier 3):          ~$0.002
Signal assessment (1 call, Tier 3):              ~$0.001
Narrative plan (1 call, Tier 2):                 ~$0.02
Story seed extraction (1 call, Tier 2):          ~$0.01
Content generation, anchor (1 call, Tier 1):     ~$0.15
Content generation, supporting x6 (Tier 2):      ~$0.12
Voice check + anti-slop (7 calls, Tier 3):       ~$0.01
                                                 --------
Estimated total per user per week:               ~$0.31
Estimated total per user per month:              ~$1.25
```

At a $12/month subscription, this leaves ~$10.75/month per user for everything else. The margin is healthy as long as model routing is enforced and frontier models are reserved for Tier 1 tasks only.

#### AI Task Classification

Every AI call in Trace falls into one of three cost tiers:

| Tier | Task Type | Examples | Model Class | Approximate Cost |
|---|---|---|---|---|
| **Tier 1: Heavy Reasoning** | Deep context, voice matching, long-form generation | Final content generation, anchor story writing, Strategy Doc creation, voice calibration scoring, anti-slop filtering on full drafts | Frontier model (Claude Opus, GPT-4o, Gemini Pro) | High |
| **Tier 2: Medium Reasoning** | Moderate context, structured output | Weekly narrative plan generation, adaptive check-in follow-ups, story seed extraction, pillar mapping, content calendar planning | Mid-tier model (Claude Sonnet, Gemini Flash 2.0, GPT-4o-mini) | Medium |
| **Tier 3: Light Processing** | Classification, extraction, formatting | Signal assessment, product stage classification, duplicate story detection, proof asset suggestion, input validation, transcript cleanup | Small/fast model (Claude Haiku, Gemini Flash, GPT-4o-mini) | Low |

#### Model Routing Architecture

```text
User action triggers AI task
       |
Task Router classifies the task (Tier 1, 2, or 3)
       |
Budget Check: Does this user have remaining AI credits for this billing period?
       |
  YES -> Route to the appropriate model via OpenRouter or direct API
  NO  -> Show "AI credits used. Upgrade for more." or queue for next period.
       |
Model selection:
  Tier 1 -> Frontier model (rotate based on cost/availability)
  Tier 2 -> Mid-tier model
  Tier 3 -> Smallest viable model
       |
Response returned to Trace pipeline
```

#### Caching Strategy

| Data | Cache Duration | Invalidation Trigger |
|---|---|---|
| Strategy Doc analysis | Until user edits the Strategy Doc | User saves changes to Strategy Doc |
| Voice calibration score | Until user updates voice samples | User submits new writing samples |
| Content pillar definitions | Until user modifies pillars | User edits pillars |
| Product stage classification | 1 week | New check-in or source activity changes stage |
| Anti-slop pattern list | Indefinite (system-level) | Admin updates banned patterns |
| Previous content history (for dedup) | Rolling 30-day window | New content approved |

#### Graceful Degradation

When the AI budget is exhausted, Trace should degrade gracefully rather than break:

```text
Budget exhausted mid-week:
1. Inform the user: "You have used your AI content credits for this week."
2. Show when credits reset: "New credits available Monday."
3. Allow the user to still complete check-ins (store answers, generate plan later).
4. Allow the user to still upload source material (process later).
5. Offer upgrade path: "Upgrade to [Paid Tier] for more weekly content."

Never:
- Show an error page.
- Silently fail to generate content.
- Queue content without telling the user.
- Degrade content quality by silently switching to a weaker model.
```

#### The Bootstrap Bridge

The hardest period is from 0 to the first 5 paying users. During this period:

```text
Revenue:        $0
AI budget:      50 free requests/day (OpenRouter)
Users:          1-5 beta testers

Survival strategy:
1. Offer the first 5 users free access in exchange for feedback.
2. Use Tier 3 models for 70% of tasks during beta.
3. Generate content in batch (all users' weekly plans on Sunday night).
4. Cap free beta users at 3 posts/week.
5. Once 3 users say "I would pay for this," launch paid tier.
6. First 2-3 subscriptions fund $20-40/month in API credits.
7. That covers 15-30 users on smart routing.
```

This is not a permanent plan. This is a 60-90 day bridge to reach the first paying customers.

### D. File & Directory Structure (Codebase)

```
trace/
├── README.md
├── TRACE_SPEC.md              ← This document
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── drizzle.config.ts
├── .env.example
├── .env.local
│
├── prisma/ (or drizzle/)
│   └── schema.ts              ← Database schema
│   └── migrations/
│
├── prompts/                   ← All LLM prompt templates (version controlled)
│   ├── strategy-generation.md
│   ├── content-linkedin.md
│   ├── content-instagram.md
│   ├── content-x-thread.md
│   ├── content-substack.md
│   ├── story-extraction.md
│   ├── slop-detector.md
│   ├── voice-check.md
│   └── interview-followup.md
│
├── src/
│   ├── app/                   ← Next.js App Router pages
│   │   ├── page.tsx           ← Landing page
│   │   ├── login/
│   │   ├── signup/
│   │   ├── onboarding/        ← Interview flow
│   │   ├── dashboard/
│   │   ├── strategy/          ← Strategy Doc view/edit
│   │   ├── mine/              ← Content Mine (story seeds)
│   │   ├── content/           ← Content editor & management
│   │   ├── calendar/          ← Content calendar
│   │   ├── sources/           ← Source connections
│   │   ├── settings/
│   │   └── api/               ← API routes
│   │       ├── auth/
│   │       ├── interview/
│   │       ├── strategy/
│   │       ├── sources/
│   │       ├── uploads/
│   │       ├── stories/
│   │       ├── generate/
│   │       ├── content/
│   │       ├── voice/
│   │       ├── calendar/
│   │       ├── publish/
│   │       └── dashboard/
│   │
│   ├── components/            ← Shared React components
│   │   ├── ui/                ← shadcn/ui primitives
│   │   ├── interview/
│   │   ├── strategy/
│   │   ├── content/
│   │   ├── calendar/
│   │   └── layout/
│   │
│   ├── lib/                   ← Core business logic
│   │   ├── ai/                ← LLM interaction layer
│   │   │   ├── client.ts      ← OpenRouter + Anthropic API client with tier-based model routing
│   │   │   ├── models.ts      ← Model configs: DeepSeek V3, Qwen 3, Claude Sonnet, etc.
│   │   │   ├── generate.ts    ← Content generation orchestrator
│   │   │   ├── extract.ts     ← Story extraction logic
│   │   │   ├── slop-check.ts  ← Anti-slop detector
│   │   │   └── voice.ts       ← Voice calibration logic
│   │   │
│   │   ├── integrations/      ← Source integration logic
│   │   │   ├── github.ts
│   │   │   ├── gdrive.ts
│   │   │   ├── notion.ts
│   │   │   ├── calendar.ts
│   │   │   └── parser.ts      ← File parsing (PDF, DOCX, etc.)
│   │   │
│   │   ├── db/                ← Database queries & helpers
│   │   ├── auth/              ← Auth utilities
│   │   ├── stripe/            ← Billing logic
│   │   └── utils/             ← Shared utilities
│   │
│   ├── hooks/                 ← Custom React hooks
│   ├── types/                 ← TypeScript type definitions
│   └── styles/                ← Global styles
│
├── workers/                   ← Background job processors
│   ├── sync-github.ts
│   ├── sync-gdrive.ts
│   ├── process-upload.ts
│   ├── generate-content.ts
│   └── publish-content.ts
│
└── scripts/                   ← Dev scripts, seed data, etc.
```

### E. Environment Variables Required

```env
# ============================================
# PHASE 1 — Only these are needed to start
# ============================================

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database (Supabase — free tier)
DATABASE_URL=postgresql://...          # Supabase Postgres connection string
NEXT_PUBLIC_SUPABASE_URL=...           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=...          # Supabase service role key (server-side only)

# Auth
NEXTAUTH_SECRET=...                    # Random secret for NextAuth
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=...                   # GitHub OAuth app
GITHUB_CLIENT_SECRET=...

# AI — Primary LLM gateway (OpenRouter)
OPENROUTER_API_KEY=...                 # Single key for all models (DeepSeek, Qwen, Llama, etc.)

# Email
RESEND_API_KEY=...                     # Free tier: 100 emails/day

# ============================================
# PHASE 2 — Add when launching publicly
# ============================================

# Google OAuth (for Drive + Calendar integrations)
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...

# Integrations
# NOTION_CLIENT_ID=...
# NOTION_CLIENT_SECRET=...

# Payments
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...

# Monitoring
# SENTRY_DSN=...
# POSTHOG_API_KEY=...

# ============================================
# PHASE 3 — Add when Studio tier launches
# ============================================

# AI — Premium model for Studio tier users only
# ANTHROPIC_API_KEY=...                # Claude Sonnet/Haiku for $99/mo users

# Social Publishing APIs
# LINKEDIN_CLIENT_ID=...
# LINKEDIN_CLIENT_SECRET=...
# TWITTER_CLIENT_ID=...
# TWITTER_CLIENT_SECRET=...

# Job Queue (async processing at scale)
# REDIS_URL=redis://...

# LLM Observability (when optimizing prompts at scale)
# LANGFUSE_PUBLIC_KEY=...
# LANGFUSE_SECRET_KEY=...
```

**Phase 1 total services to set up: 4** (Supabase, OpenRouter, GitHub OAuth, Resend). That's it.

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| 2026-04-28 | Initial spec created | Vismay Rathod + Claude |
| 2026-04-28 | Replaced Anthropic API with OpenRouter (DeepSeek V3) for Phase 1-2. Anthropic Claude reserved for Studio tier only. Simplified Phase 1 stack to 4 services. Added tier-based model routing. Removed unnecessary services (AWS, Redis, Langfuse, Sentry) from Phase 1. | Vismay Rathod + Claude |
| 2026-04-29 | Added F13: Weekly Narrative Planner, Low-Signal Mode, product-stage-aware content planning, Claude Code / AI coding log import, weekly check-ins, narrative plan schema/API extensions, and source activity drought risk mitigation. | Vismay Rathod + ChatGPT |
| 2026-04-29 | Added F14: Voice-First AI Interview (browser-native voice input for check-ins, Phase 1-3 voice roadmap), F15: AI Compute Economics & Model Routing (three-tier model classification, OpenRouter routing, per-user budgets, caching strategy, scaling plan from bootstrap to growth, cost reference tables), and associated risks (budget exhaustion, transcription quality, provider dependency). | Vismay Rathod + Claude |

---

*This document is the single source of truth for building Trace. All development decisions, prompt engineering, and product decisions should reference this spec. If something isn't covered here, add it before building it.*

