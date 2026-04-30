/**
 * Default weekly check-in questions. Spec §F13.
 * Spec says 7 default questions; in low-signal mode we substitute 3-5
 * tailored questions (lib/checkin/low-signal-questions.ts).
 */
export type CheckinQuestion = {
  id: string;
  prompt: string;
  /** Hint to the follow-up classifier on what kind of probe is most useful. */
  followupHint?: string;
};

export const DEFAULT_CHECKIN_QUESTIONS: CheckinQuestion[] = [
  {
    id: "wq1",
    prompt: "What changed in your product, work, or thinking this week?",
    followupHint: "If they mention a feature, ask why it mattered.",
  },
  {
    id: "wq2",
    prompt: "What did you work on, even if it feels small?",
  },
  {
    id: "wq3",
    prompt: "What surprised you?",
    followupHint: "If they mention confusion, ask what changed in their thinking.",
  },
  {
    id: "wq4",
    prompt:
      "What did users, customers, recruiters, or teammates ask or complain about?",
    followupHint:
      "If they mention a user reaction, ask what it revealed.",
  },
  {
    id: "wq5",
    prompt: "What decision did you make and why?",
  },
  {
    id: "wq6",
    prompt: "What are you unsure about right now?",
  },
  {
    id: "wq7",
    prompt:
      "What did you learn this week that someone one step behind you would find useful?",
  },
];

export const FOLLOWUP_CAP = 4;
