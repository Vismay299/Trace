/**
 * Canonical onboarding interview questions. Source: spec §4.
 * 19 questions across 5 sections. Numbering matches the spec exactly so
 * users can reference questions by id in support / debugging.
 */

export type InterviewSection = 1 | 2 | 3 | 4 | 5;

export type InterviewQuestion = {
  id: string;
  section: InterviewSection;
  sectionName: string;
  index: number; // 1-based within the section
  globalIndex: number; // 1..19
  prompt: string;
  /** Whether one Tier-3 follow-up may be asked. */
  allowFollowUp: boolean;
};

export const SECTIONS: { n: InterviewSection; name: string }[] = [
  { n: 1, name: "Career Arc" },
  { n: 2, name: "Expertise & Opinions" },
  { n: 3, name: "Current Work" },
  { n: 4, name: "Audience & Goals" },
  { n: 5, name: "Voice & Style" },
];

export const QUESTIONS: InterviewQuestion[] = [
  // Section 1 — Career Arc
  q(1, "Career Arc", 1, "Walk me through your career in 2 minutes. Where did you start, where are you now?"),
  q(1, "Career Arc", 2, "What's the project or accomplishment you're most proud of? Why?"),
  q(1, "Career Arc", 3, "What's the biggest professional mistake you've made and what did you learn?"),
  q(1, "Career Arc", 4, "If someone followed your exact career path, what would they know that most people in your field don't?"),
  q(1, "Career Arc", 5, "What's the thing you keep explaining to coworkers/clients over and over?"),

  // Section 2 — Expertise & Opinions
  q(2, "Expertise & Opinions", 1, "What's something most people in your field believe that you disagree with?"),
  q(2, "Expertise & Opinions", 2, "What's a trend everyone's excited about that you think is overhyped?"),
  q(2, "Expertise & Opinions", 3, "What's an underrated tool, technique, or approach that more people should use?"),
  q(2, "Expertise & Opinions", 4, "If you had to teach a 1-hour masterclass, what would it be about?"),

  // Section 3 — Current Work
  q(3, "Current Work", 1, "What are you building right now? Describe it like you're explaining to a friend."),
  q(3, "Current Work", 2, "What's the hardest technical or business problem you're solving this month?"),
  q(3, "Current Work", 3, "What tools and technologies are in your daily stack?"),

  // Section 4 — Audience & Goals
  q(4, "Audience & Goals", 1, "Who do you want reading your posts? Be specific — job title, company size, experience level."),
  q(4, "Audience & Goals", 2, "What do you want to happen after someone reads 10 of your posts? Job offers, consulting inbound, users for your product, investors noticing you?"),
  q(4, "Audience & Goals", 3, "Name 3 people whose online presence you admire. What do you like about their style?"),
  q(4, "Audience & Goals", 4, "How much time per week can you realistically spend on content? Be honest."),

  // Section 5 — Voice & Style
  q(5, "Voice & Style", 1, "When you explain something well, what does it sound like? Casual, technical, storytelling, data-driven, humorous?"),
  q(5, "Voice & Style", 2, "What kind of content do you hate seeing in your feed?"),
  q(5, "Voice & Style", 3, "Do you want to be known as the technical deep-diver, the practical builder, the contrarian thinker, the data storyteller, or the systems thinker? Pick one or describe your own."),
];

let counter = 0;
function q(
  section: InterviewSection,
  sectionName: string,
  index: number,
  prompt: string,
  allowFollowUp = true,
): InterviewQuestion {
  counter += 1;
  return {
    id: `s${section}q${index}`,
    section,
    sectionName,
    index,
    globalIndex: counter,
    prompt,
    allowFollowUp,
  };
}

export function findQuestion(id: string): InterviewQuestion | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function nextQuestionAfter(id: string): InterviewQuestion | undefined {
  const i = QUESTIONS.findIndex((q) => q.id === id);
  if (i < 0 || i >= QUESTIONS.length - 1) return undefined;
  return QUESTIONS[i + 1];
}

export function totalQuestions(): number {
  return QUESTIONS.length;
}

export function progressFor(currentQuestionId: string | undefined) {
  if (!currentQuestionId) {
    return { section: 1, sectionName: SECTIONS[0].name, percent: 0, index: 0, total: QUESTIONS.length };
  }
  const q = findQuestion(currentQuestionId);
  if (!q) return { section: 1, sectionName: SECTIONS[0].name, percent: 0, index: 0, total: QUESTIONS.length };
  return {
    section: q.section,
    sectionName: q.sectionName,
    percent: Math.round((q.globalIndex / QUESTIONS.length) * 100),
    index: q.globalIndex,
    total: QUESTIONS.length,
  };
}
