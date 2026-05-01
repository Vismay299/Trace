import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Data-Use Disclosure",
  description:
    "Plain-language disclosure for Trace sources, AI providers, Stripe, and GitHub.",
};

const sections = [
  {
    title: "What Trace Sends to AI Providers",
    body: [
      "Trace sends the prompt, user request, selected source excerpts, and task metadata needed to complete an AI task. Examples include strategy generation, source extraction, voice scoring, signal assessment, and draft generation.",
      "Trace does not send an entire connected GitHub account by default. It works from selected repositories, normalized activity, and source chunks relevant to the task.",
    ],
  },
  {
    title: "GitHub OAuth Scopes",
    body: [
      "GitHub access is used to connect your account, identify authorized repositories, sync selected repository activity, and keep source citations attached to generated story seeds and drafts.",
      "The launch goal is explicit user-controlled repository selection. Trace should never scan every repository by default when a narrower selected-source flow is available.",
    ],
  },
  {
    title: "Stripe Billing Data",
    body: [
      "Stripe handles payment methods, checkout, invoices, subscription status, billing portal access, and webhook events. Trace stores Stripe customer and subscription identifiers plus reconciled subscription state so feature access can match the billing source of truth.",
    ],
  },
  {
    title: "Source Chunks",
    body: [
      "Trace breaks uploaded or connected source material into chunks so the product can retrieve specific evidence and cite where a draft came from. Chunks may include text from files, commits, pull requests, README content, or user-provided answers.",
      "Chunks are tied to your account, provider, and source identifiers. They exist to make content generation specific and auditable, not to train foundation models.",
    ],
  },
  {
    title: "Analytics and Reliability Events",
    body: [
      "Trace measures activation and reliability events such as signup, strategy generation, source connection, sync completion, story seed review, content approval, scheduled content, queue failures, webhook delays, and AI budget exhaustion.",
      "These events help the founder support launch users, detect outages, and confirm Phase 2 success metrics are measurable from product behavior.",
    ],
  },
];

export default function DataUsePage() {
  return (
    <LegalPage
      title="Data-Use Disclosure"
      description="A direct view of what moves through Trace during the public launch flow."
      updated="May 1, 2026"
      sections={sections}
    />
  );
}
