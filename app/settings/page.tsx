import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generatedContent,
  narrativePlans,
  storySeeds,
  uploadedFiles,
  users,
  voiceSamples,
  weeklyCheckins,
} from "@/lib/db/schema";
import { AccountForm } from "./_components/account-form";
import { DeleteAccountButton } from "./_components/delete-account-button";
import { IntegrationsPlaceholder } from "./_components/integrations-placeholder";
import { TierCard } from "./_components/tier-card";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/settings");

  const [[user], counts] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    dataCounts(userId),
  ]);
  if (!user) redirect("/login");

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-text">
          Settings
        </h1>
        <p className="mt-2 text-text-muted">
          Account details, Phase 2 integration placeholders, current tier, and
          permanent data deletion.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-card border border-border-strong bg-bg-elev p-6">
          <h2 className="text-xl font-medium text-text">Profile</h2>
          <div className="mt-5">
            <AccountForm
              initialName={user.name ?? ""}
              initialEmail={user.email}
            />
          </div>
        </section>
        <TierCard tier={user.tier} />
      </div>

      <div className="mt-6">
        <IntegrationsPlaceholder />
      </div>

      <section className="mt-6 rounded-card border border-border-strong bg-bg-elev p-6">
        <h2 className="text-xl font-medium text-text">Your data</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {counts.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border-strong p-4"
            >
              <p className="text-2xl font-medium text-text">{item.count}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-dim">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-card border border-danger/40 bg-danger/10 p-6">
        <h2 className="text-xl font-medium text-text">Delete account</h2>
        <div className="mt-4">
          <DeleteAccountButton email={user.email} />
        </div>
      </section>
    </section>
  );
}

async function dataCounts(userId: string) {
  const count = sql<number>`count(*)::int`;
  const [[files], [seeds], [content], [voice], [checkins], [plans]] =
    await Promise.all([
      db
        .select({ count })
        .from(uploadedFiles)
        .where(eq(uploadedFiles.userId, userId)),
      db
        .select({ count })
        .from(storySeeds)
        .where(eq(storySeeds.userId, userId)),
      db
        .select({ count })
        .from(generatedContent)
        .where(eq(generatedContent.userId, userId)),
      db
        .select({ count })
        .from(voiceSamples)
        .where(eq(voiceSamples.userId, userId)),
      db
        .select({ count })
        .from(weeklyCheckins)
        .where(eq(weeklyCheckins.userId, userId)),
      db
        .select({ count })
        .from(narrativePlans)
        .where(eq(narrativePlans.userId, userId)),
    ]);
  return [
    { label: "files", count: files?.count ?? 0 },
    { label: "seeds", count: seeds?.count ?? 0 },
    { label: "drafts", count: content?.count ?? 0 },
    { label: "voice", count: voice?.count ?? 0 },
    { label: "check-ins", count: checkins?.count ?? 0 },
    { label: "plans", count: plans?.count ?? 0 },
  ];
}
