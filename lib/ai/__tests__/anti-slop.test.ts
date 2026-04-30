import { describe, it, expect } from "vitest";
import { ANTI_SLOP_BLOCK, BANNED_PATTERNS, containsSlop } from "../anti-slop";

describe("anti-slop banned patterns", () => {
  it("catches Hot take opener", () => {
    const v = containsSlop("Hot take: most engineers don't get auth right.");
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].label).toMatch(/Hot take/);
  });

  it("catches Unpopular opinion opener", () => {
    expect(
      containsSlop("Unpopular opinion: TypeScript is overrated."),
    ).not.toEqual([]);
  });

  it("catches I'm thrilled to announce", () => {
    expect(
      containsSlop("I'm thrilled to announce we just shipped a new feature."),
    ).not.toEqual([]);
  });

  it("catches startup jargon", () => {
    expect(containsSlop("We're disrupting the recruiting space.")).not.toEqual(
      [],
    );
  });

  it("catches engagement bait", () => {
    expect(
      containsSlop("Comment 'YES' if you agree with this take."),
    ).not.toEqual([]);
  });

  it("catches excessive emoji", () => {
    expect(containsSlop("Big launch 🚀🚀🚀🚀 today!")).not.toEqual([]);
  });

  it("catches hashtag spam", () => {
    expect(
      containsSlop("Shipped! #buildinpublic #saas #startup #indiehackers"),
    ).not.toEqual([]);
  });

  it("allows real ALL-CAPS acronyms", () => {
    expect(
      containsSlop("Built an API for our SaaS using JSON over HTTPS."),
    ).toEqual([]);
  });

  it("flags actual all-caps shouting", () => {
    expect(containsSlop("This is so AWESOME and IMPORTANT.")).not.toEqual([]);
  });

  it("normalizes curly quotes", () => {
    expect(containsSlop("“Unpopular opinion”: nope.")).toEqual([]); // not the actual pattern
    expect(containsSlop("Unpopular opinion— stop using mocks.")).not.toEqual(
      [],
    );
  });

  it("flags 5+ consecutive ultra-short lines (LinkedIn-bro spacing)", () => {
    const text =
      "We launched.\n\nIt was fun.\n\nIt grew.\n\nIt scaled.\n\nIt was nice.\n\nKeep building.";
    expect(containsSlop(text)).not.toEqual([]);
  });

  it("clean prose passes", () => {
    const v = containsSlop(
      "Yesterday I cut auth latency from 480ms to 190ms by moving session lookups out of the hot path. The trade-off was an extra Redis hop, but the p99 dropped by 41%.",
    );
    expect(v).toEqual([]);
  });

  it("ANTI_SLOP_BLOCK references every banned pattern", () => {
    for (const p of BANNED_PATTERNS) {
      expect(ANTI_SLOP_BLOCK).toContain(p.label);
    }
  });
});
