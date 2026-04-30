import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getStrategy } from "@/lib/strategy/generate";

export const runtime = "nodejs";
export const maxDuration = 30;

const styles = StyleSheet.create({
  page: {
    padding: 42,
    color: "#1c1d1d",
    fontSize: 10,
    lineHeight: 1.45,
    fontFamily: "Helvetica",
  },
  title: { fontSize: 24, marginBottom: 4 },
  meta: { color: "#666", fontSize: 9, marginBottom: 18 },
  section: { marginTop: 14 },
  heading: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    color: "#555",
    marginBottom: 6,
  },
  text: { marginBottom: 4 },
  item: { marginBottom: 3 },
});

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

  const pdf = await renderToBuffer(strategyPdf(doc));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="trace-strategy-v${doc.version}.pdf"`,
    },
  });
}

function strategyPdf(doc: NonNullable<Awaited<ReturnType<typeof getStrategy>>>) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Personal Brand Strategy"),
      React.createElement(
        Text,
        { style: styles.meta },
        `Version ${doc.version} · Generated ${new Date(doc.createdAt).toDateString()}`,
      ),
      section("Positioning Statement", [doc.positioningStatement]),
      section("Content Pillars", [
        `${doc.pillar1Topic ?? "Pillar 1"} - ${doc.pillar1Description ?? ""}`,
        `${doc.pillar2Topic ?? "Pillar 2"} - ${doc.pillar2Description ?? ""}`,
        `${doc.pillar3Topic ?? "Pillar 3"} - ${doc.pillar3Description ?? ""}`,
      ]),
      section("Contrarian Takes", doc.contrarianTakes ?? []),
      section("Origin Story", [
        doc.originStory?.beat1,
        doc.originStory?.beat2,
        doc.originStory?.beat3,
        doc.originStory?.beat4,
        doc.originStory?.beat5,
      ]),
      section("Target Audience", objectLines(doc.targetAudience)),
      section("Outcome Goal", objectLines(doc.outcomeGoal)),
      section("Voice Profile", objectLines(doc.voiceProfile)),
      section("Posting Cadence", objectLines(doc.postingCadence)),
    ),
  );
}

function section(title: string, values: Array<unknown>) {
  const clean = values.filter((value) => String(value ?? "").trim().length);
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.heading }, title),
    ...(clean.length ? clean : ["(empty)"]).map((value, index) =>
      React.createElement(
        Text,
        { key: `${title}-${index}`, style: index === 0 ? styles.text : styles.item },
        String(value),
      ),
    ),
  );
}

function objectLines(value: Record<string, unknown> | null) {
  if (!value) return [];
  return Object.entries(value).map(([key, entry]) => {
    const rendered = Array.isArray(entry) ? entry.join(", ") : String(entry ?? "");
    return `${key.replaceAll("_", " ")}: ${rendered}`;
  });
}
