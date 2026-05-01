import {
  BookOpen,
  CheckCircle2,
  FileText,
  Gauge,
  Mic2,
  Quote,
  Shield,
  Sparkles,
} from "lucide-react";

export const SITE = {
  name: "Trace",
  tagline: "Content from proof, not prompts.",
  description:
    "Trace turns commits, docs, decisions, and hard-earned lessons into publish-ready stories with receipts attached.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://trace.app",
};

export const NAV_LINKS = [
  { href: "/story", label: "Story" },
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
];

export const APP_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/strategy", label: "Strategy" },
  { href: "/sources", label: "Sources" },
  { href: "/mine", label: "Mine" },
  { href: "/content", label: "Drafts" },
  { href: "/calendar", label: "Calendar" },
  { href: "/weekly", label: "Weekly" },
  { href: "/settings", label: "Settings" },
];

export const HERO_COPY = {
  eyebrow: "YOU SHIP CODE. TRACE SHIPS YOUR STORY.",
  heading: "Content from proof, not prompts.",
  body: SITE.description,
};

export const ORIGIN_FEATURES = [
  {
    number: "01",
    title: "Strategy before generation",
    body: "Trace starts by extracting your positioning, audience, content pillars, opinions, and voice before it writes a single post.",
  },
  {
    number: "02",
    title: "Source citations on every post",
    body: "Every draft points back to the commit, doc, decision, retro, or check-in that gave the story its private origin.",
  },
  {
    number: "03",
    title: "Anti-slop rules baked in",
    body: "No hot-take theater, fake vulnerability, corporate announcement voice, or motivational filler dressed up as insight.",
  },
  {
    number: "04",
    title: "Voice calibration loop",
    body: "The product learns from what you approve, reject, and edit so future drafts move closer to how you actually explain your work.",
  },
];

export const TRUST_ITEMS = [
  {
    icon: Shield,
    text: "Encrypted, deletable, and never used to train models.",
  },
  {
    icon: Sparkles,
    text: "Rejects generic hooks, fake vulnerability, and LinkedIn-bro slop.",
  },
  {
    icon: Quote,
    text: "Every draft ends with the proof of where the story came from.",
  },
];

export const PRODUCT_FEATURES = [
  {
    eyebrow: "STRATEGY DOC",
    title: "Trace figures out what you should be known for first.",
    body: "The onboarding interview becomes a one-page brand strategy: positioning, pillars, contrarian takes, origin story, target audience, outcome goal, voice profile, and cadence.",
    visual: "strategy",
    icon: BookOpen,
  },
  {
    eyebrow: "WORK MINING",
    title: "Your actual work becomes the source material.",
    body: "Commits, docs, uploads, product decisions, weekly reflections, and user signals are mined for story seeds instead of asking you to invent ideas from a blank box.",
    visual: "source",
    icon: FileText,
  },
  {
    eyebrow: "VOICE FIRST",
    title: "The check-in feels like a founder debrief, not a form.",
    body: "Voice is the default mode for AI interviews. The browser captures a live transcript, you can edit it, and Trace treats the corrected transcript like typed input.",
    visual: "voice",
    icon: Mic2,
  },
  {
    eyebrow: "ANTI-SLOP",
    title: "The system refuses the formats builders hate.",
    body: "Banned patterns are part of the product, not a prompt afterthought. Generic hooks and fake authority get filtered before a draft reaches you.",
    visual: "slop",
    icon: CheckCircle2,
  },
  {
    eyebrow: "FOUR FORMATS",
    title: "One source turns into the formats you actually use.",
    body: "A single earned story can become a LinkedIn post, Instagram carousel, X thread, and Substack draft while keeping the citation attached.",
    visual: "formats",
    icon: Gauge,
  },
];

export const STORY_SECTIONS = [
  {
    eyebrow: "THE PAIN",
    title: "Builders ship real work, then disappear.",
    body: [
      "The people Trace is for spend their days making decisions, fixing sharp edges, learning what customers actually mean, and shipping the unglamorous work that makes products real.",
      "Then they open a posting box, feel the entire internet staring back at them, and close it. The problem is not that they have nothing to say. The problem is that the evidence is scattered across commits, docs, retros, and conversations.",
    ],
  },
  {
    eyebrow: "THE WRONG TOOLS",
    title: "Generic AI content is worse than silence.",
    body: [
      "Most content tools start with a prompt. That means they reward people who already know their positioning, their voice, and the exact angle for today.",
      "Builders do not need more posts that sound like everyone else. They need a system that can find the specific thing they already lived and shape it without sanding off the proof.",
    ],
  },
  {
    eyebrow: "THE BET",
    title: "Proof before prompts. Positioning before volume.",
    body: [
      "Trace starts with strategy because the content engine is only as good as the lens it writes through. The Strategy Doc tells the system what the user owns, who they want to reach, and what they refuse to sound like.",
      "Then the content engine mines the work. Every public idea keeps a private origin attached, so a draft feels less like AI made it up and more like Trace found the story you already earned.",
    ],
  },
];

export const FAQS = [
  {
    question:
      "Why does Trace start with strategy instead of a content generator?",
    answer:
      "Because most builders do not have a content volume problem first. They have a positioning problem. The Strategy Doc gives every future draft a point of view, audience, voice, and set of anti-patterns.",
  },
  {
    question: "What happens after the free Strategy Only tier?",
    answer:
      "The free tier helps you find your positioning and sample the system. Pro is for weekly publishing from sources. Studio adds multi-brand support for operators managing more than one voice.",
  },
  {
    question: "Does Trace train models on my work?",
    answer:
      "No. Trace treats user sources as private product data: encrypted in transit, deletable from settings, and never used to train models.",
  },
  {
    question: "Which AI model does Trace use?",
    answer:
      "The product is designed around routing. Lightweight tasks use cheaper models, heavier generation and voice matching use frontier models, and every call is tracked against a user budget.",
  },
  {
    question: "What if I have no new commits this week?",
    answer:
      "Trace has a Narrative Planning Mode for low-signal weeks. It asks focused questions about decisions, user feedback, uncertainty, and lessons so small signals can still become specific stories.",
  },
  {
    question: "Can Trace post automatically for me?",
    answer:
      "The spec keeps approval in the user's hands. Generated drafts are meant to be reviewed, edited, and approved before publishing. Autonomous posting is a later phase and still requires explicit approval.",
  },
];
