import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Trace terms for account access, subscriptions, and content use.",
};

const sections = [
  {
    title: "Service",
    body: [
      "Trace helps builders turn source material, check-ins, and strategy interviews into source-backed content drafts. Generated drafts are suggestions for your review, not legal, financial, medical, or professional advice.",
      "You are responsible for the content you approve, publish, export, or share from Trace.",
    ],
  },
  {
    title: "Accounts and Launch Access",
    body: [
      "During the public launch period, Trace may use an invite-only beta gate, waitlist, or allow-list to manage support load. We may pause new signups, revoke test access, or move users between launch cohorts when needed to keep the service reliable.",
      "You must provide accurate account information and keep your credentials secure. You may not use Trace to process material you do not have the right to use.",
    ],
  },
  {
    title: "Subscriptions and Billing",
    body: [
      "Paid plans are billed through Stripe. Stripe is the billing system of record for subscription status, payment method handling, invoices, refunds, cancellations, failed payments, and plan changes.",
      "Feature access, quotas, and AI usage budgets may vary by plan. When a payment fails or a subscription is canceled, Trace may limit Pro-only functionality while preserving access to account settings and deletion controls.",
    ],
  },
  {
    title: "Connected Sources",
    body: [
      "Trace only connects to third-party sources you authorize, such as GitHub. Source access is scoped to the permissions shown during authorization and to the repositories or resources you select where the product supports selection.",
      "You can disconnect providers or delete your account from settings. Some operational logs and billing records may be retained where required for security, compliance, fraud prevention, or accounting.",
    ],
  },
  {
    title: "AI Output and Acceptable Use",
    body: [
      "Trace routes prompts and relevant source excerpts to AI providers to generate, classify, summarize, score, or clean up content. You may not use Trace for unlawful, abusive, deceptive, infringing, or harmful activity.",
      "AI output can be incomplete or inaccurate. Review drafts, citations, and claims before using them publicly.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update these terms as the product moves from beta to public availability. Material changes will be reflected on this page and, where appropriate, communicated in-product or by email.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The practical rules for using Trace during launch and after the product opens more broadly."
      updated="May 1, 2026"
      sections={sections}
    />
  );
}
