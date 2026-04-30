/**
 * Anti-slop banned patterns. Source of truth: trace_spec.md §6.
 *
 * Used in two places:
 *   1. Injected into every generation prompt as `ANTI_SLOP_BLOCK`.
 *   2. Run as a regex pre-filter (`containsSlop`) before the LLM slop detector,
 *      so cheap obvious cases never burn a Tier-3 call.
 *
 * Order matters: hooks first (highest leverage), then format, content, voice.
 * `regex` is ASCII-case-insensitive; we normalize curly quotes / em-dashes /
 * ellipses on input to keep these patterns simple.
 */

export type BannedCategory =
  | "hook"
  | "format"
  | "content"
  | "voice_builder";

export type BannedPattern = {
  category: BannedCategory;
  /** Human-readable label shown in violation messages and the marketing UI. */
  label: string;
  /** Optional regex; if absent, this is a soft rule the LLM detector enforces. */
  regex?: RegExp;
};

export const BANNED_PATTERNS: BannedPattern[] = [
  // ── Hook bans ──────────────────────────────────────────────────────────
  {
    category: "hook",
    label: 'Opening with "Hot take"',
    regex: /\bhot take\s*[:\-—]/i,
  },
  {
    category: "hook",
    label: 'Opening with "Unpopular opinion"',
    regex: /\bunpopular opinion\s*[:\-—]/i,
  },
  {
    category: "hook",
    label: '"Here\'s why most X fail" hook',
    regex: /here'?s why most .{2,40} (fail|are wrong|get it wrong)/i,
  },
  {
    category: "hook",
    label: '"Stop doing X. Start doing Y." hook',
    regex: /\bstop doing [^.]{2,80}\.\s*start doing /i,
  },
  {
    category: "hook",
    label: '"I just realized something important" opener',
    regex: /\bi just realized something (important|big|huge)/i,
  },
  {
    category: "hook",
    label: '"This changed everything for me" opener',
    regex: /\bthis (literally )?changed everything (for me)?\b/i,
  },
  {
    category: "hook",
    label: '"Nobody talks about this" opener',
    regex: /\bnobody (talks about|is talking about|tells you about) this\b/i,
  },
  {
    category: "hook",
    label: '"I\'m going to say something controversial" opener',
    regex: /\bi'?m going to say something controversial\b/i,
  },

  // ── Format bans ────────────────────────────────────────────────────────
  {
    category: "format",
    label: "Excessive emoji (more than 2 per post)",
    // Counted programmatically below; this entry is for the prompt list.
  },
  {
    category: "format",
    label: "Hashtag spam (more than 3 hashtags)",
  },
  {
    category: "format",
    label: 'All-caps emphasis ("This is SO important")',
    regex: /\b[A-Z]{4,}\b/,
  },

  // ── Content bans ───────────────────────────────────────────────────────
  {
    category: "content",
    label: '"I almost gave up. Here\'s what I learned"',
    regex: /\bi almost gave up\b.{0,40}(here'?s what|what i learned)/i,
  },
  {
    category: "content",
    label: '"Just a small update" / "I\'m no expert, but"',
    regex: /\b(just a (small|quick) update|i'?m no expert,? but)\b/i,
  },
  {
    category: "content",
    label: 'Startup jargon ("disrupting", "leveraging synergies", "paradigm shift")',
    regex:
      /\b(disrupting (the )?[a-z\- ]{2,30} space|leveraging synergies|paradigm shift)\b/i,
  },
  {
    category: "content",
    label: 'Corporate announcement ("I\'m thrilled to announce", "Excited to share")',
    regex: /\b(i'?m thrilled to (announce|share)|excited to (announce|share))\b/i,
  },
  {
    category: "content",
    label: "Inspirational close (\"Keep building\", \"The grind never stops\", \"You got this\")",
    regex:
      /\b(keep (building|shipping|grinding)\.?\s*[❤🚀💪]?|the grind never stops|you got this)\b/i,
  },
  {
    category: "content",
    label: "Motivational platitude (\"Success is a journey, not a destination\")",
    regex: /\bsuccess is a journey,?\s*not a destination\b/i,
  },
  {
    category: "content",
    label: 'Engagement bait ("Comment YES", "Share this with someone")',
    regex:
      /\b(comment ['"]?yes['"]? if|share this (with|if) someone (who )?needs)/i,
  },

  // ── Voice bans (builder-specific) ──────────────────────────────────────
  {
    category: "voice_builder",
    label: '"We\'re disrupting the X space"',
    regex: /\bwe'?re disrupting the [a-z\- ]{2,30} space\b/i,
  },
  {
    category: "voice_builder",
    label: '"Leveraging AI to transform Y"',
    regex: /\bleveraging ai to transform\b/i,
  },
  {
    category: "voice_builder",
    label: '"Our mission is to democratize Z"',
    regex: /\bour mission is to democratize\b/i,
  },
  {
    category: "voice_builder",
    label: '"10x developer" / hustle culture language',
    regex: /\b10x (developer|engineer)\b|\bhustle culture\b|\brise and grind\b/i,
  },
];

export type SlopViolation = {
  category: BannedCategory;
  label: string;
  excerpt?: string;
};

/**
 * Normalizes typographically-weird characters so authors using Word/Notion
 * don't accidentally bypass the regex set with curly quotes or unicode dashes.
 */
function normalize(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...");
}

const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu;
const HASHTAG_REGEX = /(?:^|\s)#[A-Za-z][\w]+/g;

/**
 * Cheap regex pre-filter. Returns every violation found.
 * Acronym allowlist for the all-caps rule keeps real abbreviations clean.
 */
const ALLCAPS_ALLOWLIST = new Set([
  "API",
  "APIs",
  "URL",
  "URLs",
  "JSON",
  "YAML",
  "HTTP",
  "HTTPS",
  "HTML",
  "CSS",
  "JS",
  "TS",
  "TSX",
  "MVP",
  "PR",
  "PRs",
  "SQL",
  "AWS",
  "GCP",
  "OSS",
  "SaaS",
  "AI",
  "LLM",
  "LLMs",
  "GPT",
  "CTO",
  "CEO",
  "VP",
  "PM",
  "QA",
  "UI",
  "UX",
  "B2B",
  "B2C",
  "ARR",
  "MRR",
  "RPC",
  "REST",
  "JWT",
  "OAUTH",
  "OAUTH2",
  "SDK",
  "CLI",
  "CDN",
  "DNS",
  "TLS",
  "SSL",
  "OS",
  "IDE",
  "RAG",
  "ETL",
  "OKR",
  "KPI",
  "NPS",
  "USA",
  "UK",
  "EU",
]);

export function containsSlop(text: string): SlopViolation[] {
  const violations: SlopViolation[] = [];
  const normalized = normalize(text);

  for (const pattern of BANNED_PATTERNS) {
    if (!pattern.regex) continue;
    const match = pattern.regex.exec(normalized);
    if (!match) continue;
    if (pattern.label.startsWith("All-caps")) {
      const caps = match[0];
      if (ALLCAPS_ALLOWLIST.has(caps)) continue;
    }
    violations.push({
      category: pattern.category,
      label: pattern.label,
      excerpt: match[0],
    });
  }

  // Emoji count
  const emojis = normalized.match(EMOJI_REGEX) ?? [];
  if (emojis.length > 2) {
    violations.push({
      category: "format",
      label: "Excessive emoji (more than 2 per post)",
      excerpt: `${emojis.length} emoji used`,
    });
  }

  // Hashtag count
  const hashtags = normalized.match(HASHTAG_REGEX) ?? [];
  if (hashtags.length > 3) {
    violations.push({
      category: "format",
      label: "Hashtag spam (more than 3 hashtags)",
      excerpt: `${hashtags.length} hashtags used`,
    });
  }

  // LinkedIn-bro line breaks: 5+ consecutive ≤6-word lines
  const lines = normalized.split("\n").filter(Boolean);
  let shortRun = 0;
  for (const line of lines) {
    const words = line.trim().split(/\s+/).filter(Boolean).length;
    if (words > 0 && words <= 6) {
      shortRun += 1;
      if (shortRun >= 5) {
        violations.push({
          category: "format",
          label: "LinkedIn-bro single-sentence-per-line spacing",
          excerpt: "5+ consecutive ultra-short lines",
        });
        break;
      }
    } else {
      shortRun = 0;
    }
  }

  return violations;
}

/**
 * The block injected into every generation system prompt. Provider-portable
 * (no XML tags) so it routes to DeepSeek, Gemini, or Claude unchanged.
 */
export const ANTI_SLOP_BLOCK = `ANTI-SLOP RULES — MANDATORY

You MUST NOT produce content containing any of the following patterns. If your
output contains any of these, regenerate before responding.

${BANNED_PATTERNS.map((p, i) => `${i + 1}. ${p.label}`).join("\n")}

Instead, write like a smart person explaining their work to a curious colleague
over coffee. Be specific. Use real details from the source material — name the
tools, the numbers, the trade-offs. No platitudes, no fake vulnerability, no
engagement bait. Every sentence should contain a detail that only someone who
did the work would know.`;
