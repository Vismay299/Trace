import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Trace collects, uses, stores, and deletes product data.",
};

const sections = [
  {
    title: "Information We Collect",
    body: [
      "Trace collects account details, authentication identifiers, billing identifiers, product settings, uploaded files, connected-source metadata, selected source excerpts, interview answers, generated drafts, feedback, and usage telemetry needed to operate the product.",
      "If you connect GitHub, Trace may store provider account identifiers, selected repository metadata, sync status, normalized activity, and content chunks created from selected sources.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use product data to authenticate you, generate strategy and content, maintain source citations, enforce AI budgets, provide support, improve reliability, detect abuse, and understand activation and retention funnels.",
      "Trace does not use your private sources or generated content to train foundation models.",
    ],
  },
  {
    title: "Processors",
    body: [
      "Trace may use Stripe for billing, GitHub for OAuth and source access, AI providers for generation and classification, Supabase or Postgres-compatible infrastructure for storage, Resend for email, and observability or analytics tools for reliability and product measurement.",
      "Only the data needed for each service is sent to that processor. AI providers receive prompts and the relevant excerpts needed for the requested task, not an entire connected account by default.",
    ],
  },
  {
    title: "Storage and Deletion",
    body: [
      "Trace stores source chunks so generated drafts can remain tied to the original evidence. Account deletion removes user-owned product records such as uploads, generated content, check-ins, voice samples, and narrative plans from the application database.",
      "Operational logs, security records, backups, and billing records may persist for limited periods where needed for reliability, fraud prevention, legal compliance, or accounting.",
    ],
  },
  {
    title: "Security",
    body: [
      "Trace uses access controls, provider-scoped credentials, server-side budget enforcement, and deletion workflows to reduce exposure. No internet service can guarantee absolute security, so report suspected issues promptly.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You can update account details, disconnect integrations where available, request support, and delete your account from settings. You can also contact us to ask about access, correction, or deletion.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How Trace handles the private work behind your public story."
      updated="May 1, 2026"
      sections={sections}
    />
  );
}
