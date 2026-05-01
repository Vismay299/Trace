"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type Question = {
  id: string;
  prompt: string;
  section: number;
  sectionName: string;
  globalIndex: number;
  allowFollowUp: boolean;
};

type Followup = {
  needsFollowup: boolean;
  followupQuestion: string;
  reason: string;
};

type Progress = {
  section: number;
  sectionName: string;
  index: number;
  total: number;
  percent: number;
};

export function InterviewChat({
  initialQuestion,
  initialProgress,
  initialIsComplete,
}: {
  initialQuestion: Question | null;
  initialProgress: Progress;
  initialIsComplete: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan");
  const [question, setQuestion] = useState<Question | null>(initialQuestion);
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [pendingFollowup, setPendingFollowup] = useState<Followup | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(initialIsComplete);
  const [completing, setCompleting] = useState(false);

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

  // When voice is not supported, force text mode.
  useEffect(() => {
    if (!supported && mode === "voice") setMode("text");
  }, [supported, mode, setMode]);

  // Sync the editable textarea with the live voice transcript when in voice mode.
  useEffect(() => {
    if (mode === "voice") setText(transcript);
  }, [transcript, mode]);

  const handleSubmit = async (
    isFollowupReply: boolean,
    skipFollowup: boolean,
  ) => {
    if (!question) return;
    if (!text.trim()) {
      setError("Type or speak an answer first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          answer: text,
          inputMode: mode,
          isFollowupReply,
          skipFollowup,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not save your answer.");
        return;
      }
      const data = await res.json();
      setText("");
      setTranscript("");
      resetVoice();

      if (data.followup?.needsFollowup) {
        // Stay on the same question — show the follow-up.
        setPendingFollowup(data.followup);
        return;
      }
      setPendingFollowup(null);
      setQuestion(data.nextQuestion ?? null);
      setProgress(data.progress);
      setIsComplete(data.isComplete);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    const res = await fetch("/api/interview/complete", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not complete the interview yet.");
      setCompleting(false);
      return;
    }
    router.push(`/strategy?firstRun=1${plan === "pro" ? "&plan=pro" : ""}`);
  };

  if (!question || isComplete) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-medium tracking-tight text-text">
          That's the whole interview. Ready to see your strategy?
        </h2>
        <p className="text-text-muted">
          We'll synthesize your answers into your Personal Brand Strategy
          Document. Takes about a minute.
        </p>
        <Button onClick={handleComplete} disabled={completing} size="lg">
          {completing ? "Generating…" : "Generate my Brand Strategy →"}
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }

  const activePrompt = pendingFollowup?.followupQuestion ?? question.prompt;

  return (
    <div className="space-y-6">
      {/* Section + progress */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
            Section {progress.section} of 5 — {progress.sectionName}
          </p>
          <p className="mt-1 text-xs text-text-dim">
            Question {progress.index} of {progress.total}
          </p>
        </div>
        <ModeToggle mode={mode} onChange={setMode} voiceSupported={supported} />
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-card border border-border-strong bg-bg-elev p-6">
        {pendingFollowup && (
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-accent">
            Follow-up
          </p>
        )}
        <p className="text-lg leading-snug text-text">{activePrompt}</p>
      </div>

      {/* Input */}
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
          placeholder="Type your answer. Be specific."
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => handleSubmit(Boolean(pendingFollowup), false)}
          disabled={submitting || !text.trim()}
          size="lg"
        >
          {submitting
            ? "Saving…"
            : pendingFollowup
              ? "Send follow-up"
              : "Submit & next question"}
        </Button>
        {!pendingFollowup && (
          <Button
            variant="ghost"
            onClick={() => handleSubmit(false, true)}
            disabled={submitting || !text.trim()}
          >
            Skip follow-up — just save
          </Button>
        )}
        {pendingFollowup && (
          <Button
            variant="ghost"
            onClick={() => {
              // Skip the follow-up and move on without answering it.
              setPendingFollowup(null);
              // Advance immediately without re-saving.
              fetch("/api/interview/progress")
                .then((r) => r.json())
                .then((data) => {
                  setQuestion(data.currentQuestion ?? question);
                  setProgress(data.progress);
                  setIsComplete(Boolean(data.isComplete));
                });
            }}
          >
            Skip — next question
          </Button>
        )}
      </div>

      <p className="text-xs text-text-dim">
        Save & resume works automatically. Close the tab anytime.
      </p>
    </div>
  );
}
