import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { STORY_SECTIONS } from "@/content/copy";

export const metadata: Metadata = {
  title: "Story",
  description:
    "Why Trace exists for builders who have proof of work but no public story.",
};

export default function StoryPage() {
  return (
    <div className="px-5 py-16 sm:py-24 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Eyebrow>The story</Eyebrow>
        <h1 className="mt-8 text-5xl font-bold leading-[1.06] text-text sm:text-6xl">
          The blank box problem.
        </h1>
        <p className="mt-8 text-xl leading-8 text-text-muted">
          Trace exists because the best builders often have the weakest public
          trail. Their work is real. Their proof is scattered. Their posts sound
          like they were written under protest.
        </p>

        <div className="mt-16 space-y-16">
          {STORY_SECTIONS.map((section) => (
            <section key={section.title}>
              <Eyebrow muted>{section.eyebrow}</Eyebrow>
              <h2 className="mt-5 text-3xl font-medium leading-tight text-text sm:text-4xl">
                {section.title}
              </h2>
              <div className="mt-6 space-y-5">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-lg leading-8 text-text-muted"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Card className="mt-16 p-7 sm:p-9">
          <Eyebrow>Founder note</Eyebrow>
          <div className="mt-6 space-y-5 text-lg leading-8 text-text-muted">
            {/* TODO(copy): Replace this placeholder founder note with Vismay's final wording before launch. */}
            <p>
              I am building Trace for the person who has the receipts but not
              the rhythm. The builder who can explain every tradeoff in a system
              diagram, then freezes when the internet asks for a post.
            </p>
            <p>
              The product should not make you perform expertise. It should help
              you recover the story already inside your work, keep the proof
              attached, and refuse the shortcuts that make AI content feel
              hollow.
            </p>
            <p>
              If Trace works, publishing starts to feel less like self-promotion
              and more like leaving a useful trail behind the things you are
              already doing.
            </p>
            <p className="font-mono text-sm uppercase text-accent">
              Vismay Rathod
            </p>
          </div>
        </Card>

        <div className="mt-12">
          <Button href="/waitlist" size="lg">
            Join the waitlist
          </Button>
        </div>
      </article>
    </div>
  );
}
