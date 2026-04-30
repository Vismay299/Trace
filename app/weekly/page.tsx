import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { getOrCreateCheckin } from "@/lib/checkin/session";
import { DEFAULT_CHECKIN_QUESTIONS } from "@/lib/checkin/questions";
import { CheckinChat } from "./_components/checkin-chat";

export const metadata = { title: "Weekly check-in" };

export default async function WeeklyPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/weekly");

  const session = await getOrCreateCheckin(userId);

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

      <CheckinChat
        questions={DEFAULT_CHECKIN_QUESTIONS.map((q) => ({
          id: q.id,
          prompt: q.prompt,
        }))}
        initialAnswers={(session.answers ?? {}) as any}
        initialIsComplete={session.isComplete}
        weekStartDate={session.weekStartDate}
      />
    </section>
  );
}
