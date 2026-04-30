import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getStrategy } from "@/lib/strategy/generate";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Renders the Strategy Doc as a printable HTML page. The browser's print-to-PDF
 * works against this — keeps Phase 1 free of a heavy headless-browser dep.
 * Phase 2 can swap to @react-pdf/renderer if a true PDF blob is required.
 */
export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await getStrategy(userId);
  if (!doc) {
    return NextResponse.json({ error: "No strategy doc" }, { status: 404 });
  }

  const html = renderHtml(doc);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `inline; filename="trace-strategy-v${doc.version}.html"`,
    },
  });
}

function renderHtml(doc: Awaited<ReturnType<typeof getStrategy>>) {
  if (!doc) return "";
  const escape = (s: unknown) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const list = (xs?: unknown) =>
    Array.isArray(xs)
      ? `<ul>${xs.map((x) => `<li>${escape(x)}</li>`).join("")}</ul>`
      : "";
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Trace — Personal Brand Strategy v${doc.version}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #1c1d1d; line-height: 1.55; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.18em; color: #555; margin-top: 2rem; }
  ul { padding-left: 1.2rem; }
  dl { display: grid; grid-template-columns: 180px 1fr; row-gap: 6px; }
  dt { color: #555; }
  .meta { color: #888; font-size: 13px; }
  .pill { font-weight: 600; }
</style>
</head><body>
<h1>Personal Brand Strategy</h1>
<p class="meta">Version ${doc.version} · Generated ${new Date(doc.createdAt).toDateString()}</p>

<h2>Positioning Statement</h2>
<p>${escape(doc.positioningStatement)}</p>

<h2>Content Pillars</h2>
<ol>
  <li><span class="pill">${escape(doc.pillar1Topic)}</span> — ${escape(doc.pillar1Description)}</li>
  <li><span class="pill">${escape(doc.pillar2Topic)}</span> — ${escape(doc.pillar2Description)}</li>
  <li><span class="pill">${escape(doc.pillar3Topic)}</span> — ${escape(doc.pillar3Description)}</li>
</ol>

<h2>Contrarian Takes</h2>
${list(doc.contrarianTakes)}

<h2>Origin Story</h2>
<ol>
  ${[1, 2, 3, 4, 5]
    .map((i) => {
      const beat = doc.originStory?.[`beat${i}` as `beat1`];
      return beat ? `<li>${escape(beat)}</li>` : "";
    })
    .join("")}
</ol>

<h2>Target Audience</h2>
<dl>
  ${Object.entries(doc.targetAudience ?? {})
    .map(
      ([k, v]) =>
        `<dt>${escape(k.replaceAll("_", " "))}</dt><dd>${escape(Array.isArray(v) ? v.join(", ") : v)}</dd>`,
    )
    .join("")}
</dl>

<h2>Outcome Goal</h2>
<dl>
  ${Object.entries(doc.outcomeGoal ?? {})
    .map(
      ([k, v]) =>
        `<dt>${escape(k.replaceAll("_", " "))}</dt><dd>${escape(v)}</dd>`,
    )
    .join("")}
</dl>

<h2>Voice Profile</h2>
<dl>
  ${Object.entries(doc.voiceProfile ?? {})
    .map(
      ([k, v]) =>
        `<dt>${escape(k.replaceAll("_", " "))}</dt><dd>${escape(Array.isArray(v) ? v.join(", ") : v)}</dd>`,
    )
    .join("")}
</dl>

<h2>Posting Cadence</h2>
<dl>
  ${Object.entries(doc.postingCadence ?? {})
    .map(([k, v]) => `<dt>${escape(k.replaceAll("_", " "))}</dt><dd>${escape(v)}</dd>`)
    .join("")}
</dl>

<p class="meta" style="margin-top: 3rem;">trace.dev</p>
<script>setTimeout(() => window.print && window.print(), 600);</script>
</body></html>`;
}
