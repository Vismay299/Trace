"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LiveTranscript } from "@/components/voice/live-transcript";
import { MicButton } from "@/components/voice/mic-button";
import {
  ModeToggle,
  UnsupportedBrowserBanner,
  useInputMode,
} from "@/components/voice/mode-toggle";
import { useVoiceInput } from "@/hooks/use-voice-input";

type Question = { id: string; prompt: string };

type AnswerEntry = {
  answer: string;
  followups?: string[];
  mode?: "text" | "voice";
};

export function CheckinChat({
  questions,
  initialAnswers,
  initialIsComplete,
  weekStartDate,
}: {
  questions: Question[];
  initialAnswers: Record<string, AnswerEntry>;
  initialIsComplete: boolean;
  weekStartDate: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>(initialAnswers);
  const [activeId, setActiveId] = useState<string>(() => firstUnanswered(questions, initialAnswers));
  const [pendingFollowup, setPendingFollowup] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productStage, setProductStage] = useState<
    "building" | "launching" | "operating" | "scaling" | ""
  >("");
  const [completing, setCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(initialIsComplete);

  const [mode, setMode] = useInputMode("voice");
  const {
    supported,
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    start,
    stop,
    reset: resetVoice,
    setTranscript,
  } = useVoiceInput();

  useEffect(() => {
    if (!supported && mode === "voice") setMode("text");
  }, [supported, mode, setMode]);

  useEffect(() => {
    if (mode === "voice") setText(transcript);
  }, [transcript, mode]);

  const activeQuestion = questions.find((q) => q.id === activeId) ?? questions[0];
  const answeredCount = Object.keys(answers).length;

  const submit = async (isFollowupReply: boolean, skipFollowup = false) => {
    if (!text.trim()) {
      setError("Type or speak an answer first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkins/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          answer: text,
          inputMode: mode,
          isFollowupReply,
          skipFollowup,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not save.");
        return;
      }
      const data = await res.json();
      setAnswers(data.answers ?? {});
      setText("");
      setTranscript("");
      resetVoice();
      if (data.followup?.needsFollowup) {
        setPendingFollowup(data.followup.followupQuestion);
        return;
      }
      setPendingFollowup(null);
      const nextId = firstUnanswered(questions, data.answers ?? {});
      setActiveId(nextId || activeQuestion.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const onComplete = async () => {
    setCompleting(true);
    setError(null);
    const res = await fetch("/api/checkins/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productStage: productStage || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not complete check-in.");
      setCompleting(false);
      return;
    }
    setIsComplete(true);
    router.refresh();
  };

  if (isComplete) {
    return (
      <div className="rounded-card border border-accent/30 bg-accent-soft p-6">
        <h2 className="text-2xl font-medium text-text">Check-in submitted.</h2>
        <p className="mt-2 text-sm text-text-muted">
          Now generate your weekly narrative plan — one Tier 2 call that turns
          your answers into 5–10 ranked story seeds.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/weekly/plan">Generate weekly plan →</Button>
          <Button href="/dashboard" variant="ghost">
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const allAnswered = answeredCount >= questions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
          Week of {new Date(weekStartDate).toLocaleDateString()}
          {" · "}
          {answeredCount}/{questions.length} answered
        </p>
        <ModeToggle mode={mode} onChange={setMode} voiceSupported={supported} />
      </div>

      {pendingFollowup ? (
        <div className="rounded-card border border-accent/30 bg-accent-soft p-5">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-accent">
            Follow-up
          </p>
          <p className="text-lg text-text">{pendingFollowup}</p>
        </div>
      ) : (
        <div className="rounded-card border border-border-strong bg-bg-elev p-6">
          <p className="text-lg leading-snug text-text">{activeQuestion.prompt}</p>
        </div>
      )}

      {!supported && mode === "voice" && <UnsupportedBrowserBanner />}

      {mode === "voice" && supported ? (
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <MicButton
              isListening={isListening}
              onToggle={isListening ? stop : start}
            />
            <LiveTranscript
              transcript={text}
              interimTranscript={interimTranscript}
              isListening={isListening}
              onChange={(s) => {
                setText(s);
                setTranscript(s);
              }}
              className="flex-1"
            />
          </div>
          {voiceError && <p className="text-sm text-danger">{voiceError}</p>}
        </div>
      ) : (
        <Textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your answer. Be specific — name a person, a number, a moment."
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => submit(Boolean(pendingFollowup), false)}
          disabled={submitting || !text.trim()}
          size="lg"
        >
          {submitting ? "Saving…" : pendingFollowup ? "Send follow-up" : "Submit & next"}
        </Button>
        {!pendingFollowup && (
          <Button
            variant="ghost"
            onClick={() => submit(false, true)}
            disabled={submitting || !text.trim()}
          >
            Skip follow-up
          </Button>
        )}
        {pendingFollowup && (
          <Button
            variant="ghost"
            onClick={() => {
              setPendingFollowup(null);
              const nextId = firstUnanswered(questions, answers);
              setActiveId(nextId || activeQuestion.id);
            }}
          >
            Skip — next question
          </Button>
        )}
      </div>

      <details className="rounded-card border border-border-strong bg-bg-elev p-4">
        <summary className="cursor-pointer text-sm text-text-muted">
          Edit a previous answer ({answeredCount}/{questions.length})
        </summary>
        <ul className="mt-3 space-y-2">
          {questions.map((q, i) => {
            const a = answers[q.id];
            return (
              <li key={q.id} className="text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(q.id);
                    setText(a?.answer ?? "");
                    setPendingFollowup(null);
                  }}
                  className="text-left hover:text-accent"
                >
                  <span className="text-text-dim">Q{i + 1}.</span>{" "}
                  <span className="text-text">{q.prompt}</span>
                  {a?.answer && (
                    <span className="ml-2 text-text-dim italic">
                      “{a.answer.slice(0, 60)}{a.answer.length > 60 ? "…" : ""}”
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </details>

      <section className="space-y-3 rounded-card border border-border-strong bg-bg-elev p-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          Where are you in the journey?
        </p>
        <div className="flex flex-wrap gap-2">
          {(["building", "launching", "operating", "scaling"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setProductStage(s)}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition ${
                productStage === s
                  ? "border-accent bg-accent text-black"
                  : "border-border-strong text-text-muted hover:border-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button onClick={onComplete} disabled={completing || !allAnswered}>
          {completing
            ? "Submitting…"
            : allAnswered
              ? "Submit weekly check-in"
              : `Answer all ${questions.length} questions to submit`}
        </Button>
      </section>
    </div>
  );
}

function firstUnanswered(
  questions: Question[],
  answers: Record<string, AnswerEntry>,
): string {
  for (const q of questions) if (!answers[q.id]) return q.id;
  return questions[questions.length - 1]?.id ?? "";
}
