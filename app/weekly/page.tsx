import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { getOrCreateCheckin } from "@/lib/checkin/session";
import { questionsForWeeklyCheckin } from "@/lib/checkin/low-signal-questions";
import type { WeeklyCheckin } from "@/lib/db/schema";
import { getSignalStatus } from "@/lib/ai/signal";
import { CheckinChat } from "./_components/checkin-chat";
import { SignalBanner } from "./_components/signal-banner";

export const metadata = { title: "Weekly check-in" };

export default async function WeeklyPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/weekly");

  const session = await getOrCreateCheckin(userId);
  const signal = await getSignalStatus(userId);
  const { questions, lowSignal } = await questionsForWeeklyCheckin(
    userId,
    signal,
  );

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-text">
          Weekly check-in
        </h1>
        <p className="mt-3 text-text-muted">
          5–10 minutes. Answer like you're texting a friend who's also a
          founder. We'll turn your answers into next week's content plan — no
          generic advice, no motivational platitudes.
        </p>
      </header>

      <div className="mb-6">
        <SignalBanner signal={signal} banner={lowSignal?.banner} />
      </div>

      <CheckinChat
        questions={questions}
        initialAnswers={normalizeAnswers(session.answers)}
        initialIsComplete={session.isComplete}
        weekStartDate={session.weekStartDate}
      />
    </section>
  );
}

function normalizeAnswers(sessionAnswers: WeeklyCheckin["answers"] | null) {
  return (sessionAnswers ?? {}) as Record<
    string,
    { answer: string; followups?: string[]; mode?: "text" | "voice" }
  >;
}
