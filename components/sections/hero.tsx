import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ChapterCard } from "@/components/visuals/chapter-card";
import { HERO_COPY } from "@/content/copy";
import { auth } from "@/lib/auth";

export async function Hero() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <section className="px-5 py-16 sm:py-20 lg:px-8 lg:py-24">
      <div className="hero-enter mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <Eyebrow>{HERO_COPY.eyebrow}</Eyebrow>
          <h1 className="mt-8 max-w-4xl text-6xl font-bold leading-[1.04] text-text sm:text-7xl lg:text-8xl">
            {HERO_COPY.heading}
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-text-muted">
            {HERO_COPY.body}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {loggedIn ? (
              <Button
                href="/dashboard"
                size="lg"
                trailing={<ArrowRight aria-hidden className="size-5" />}
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                href="/signup"
                size="lg"
                trailing={<ArrowRight aria-hidden className="size-5" />}
              >
                Create your account
              </Button>
            )}
            <Button href="/story" variant="ghost" size="lg">
              Read the story
            </Button>
          </div>
        </div>

        <div className="lg:pl-8">
          <ChapterCard />
        </div>
      </div>
    </section>
  );
}
