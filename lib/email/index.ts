/**
 * Resend transactional email. No-ops in dev when RESEND_API_KEY is unset
 * — we don't want signup flows to error out for contributors who haven't
 * provisioned Resend yet.
 */
import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  if (client) return client;
  if (!process.env.RESEND_API_KEY) return null;
  client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@trace.dev";

export async function sendWaitlistConfirmation(email: string) {
  const c = getClient();
  if (!c) {
    console.info("[email] RESEND_API_KEY unset; would email", email);
    return { skipped: true };
  }
  await c.emails.send({
    from: FROM,
    to: email,
    subject: "You're on the Trace waitlist",
    text: [
      "You're in.",
      "",
      "Trace turns your real work — commits, docs, threads — into LinkedIn",
      "posts, Instagram carousels, X threads, and Substack drafts that sound",
      "like you (not like AI). When we open access, you'll be one of the first.",
      "",
      "— Vismay",
      "trace.dev",
    ].join("\n"),
  });
  return { skipped: false };
}

export async function sendStrategyDocReadyEmail(
  email: string,
  name: string | null,
) {
  const c = getClient();
  if (!c) return { skipped: true };
  const greeting = name ? `Hey ${name},` : "Hey,";
  await c.emails.send({
    from: FROM,
    to: email,
    subject: "Your Brand Strategy is ready",
    text: [
      greeting,
      "",
      "Your Personal Brand Strategy Document is ready to read. It's the synthesis",
      "of every interview answer you gave us — pillars, voice, contrarian takes,",
      "audience, and a 90-day metric.",
      "",
      "Open it: https://trace.dev/strategy",
      "",
      "— Trace",
    ].join("\n"),
  });
  return { skipped: false };
}
