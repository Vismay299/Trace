import Link from "next/link";

type Section = {
  title: string;
  body: string[];
};

export function LegalPage({
  title,
  description,
  updated,
  sections,
}: {
  title: string;
  description: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
        Updated {updated}
      </p>
      <h1 className="mt-4 text-4xl font-medium tracking-tight text-text">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-8 text-text-muted">{description}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-2xl font-medium tracking-tight text-text">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-base leading-7 text-text-muted">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-card border border-border-strong bg-bg-elev p-5 text-sm leading-6 text-text-muted">
        Questions or deletion requests can go to{" "}
        <a className="text-accent hover:underline" href="mailto:hello@trace.app">
          hello@trace.app
        </a>
        . You can also review the{" "}
        <Link className="text-accent hover:underline" href="/legal/data-use">
          data-use disclosure
        </Link>
        .
      </div>
    </article>
  );
}
