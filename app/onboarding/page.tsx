import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import {
  getOrCreateSession,
  currentQuestionFor,
} from "@/lib/interview/session";
import { InterviewChat } from "./_components/interview-chat";

export const metadata = {
  title: "Onboarding interview",
};

export default async function OnboardingPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/onboarding");

  const session = await getOrCreateSession(userId);
  const state = currentQuestionFor(session);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-medium tracking-tight text-text">
          Let's figure out your story.
        </h1>
        <p className="mt-3 text-text-muted">
          About 30 minutes. 19 questions across 5 sections. You can save and
          come back. Voice mode is on by default — tap the mic and start
          talking.
        </p>
      </header>

      <InterviewChat
        initialQuestion={
          state.question
            ? {
                id: state.question.id,
                prompt: state.question.prompt,
                section: state.question.section,
                sectionName: state.question.sectionName,
                globalIndex: state.question.globalIndex,
                allowFollowUp: state.question.allowFollowUp,
              }
            : null
        }
        initialProgress={state.progress}
        initialIsComplete={session.isComplete}
      />
    </section>
  );
}
