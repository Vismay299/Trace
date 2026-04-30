import { describe, it, expect } from "vitest";
import { currentWeekRange, defaultLimitsFor } from "../budget";

describe("budget helpers", () => {
  it("currentWeekRange returns Monday→Sunday", () => {
    // 2026-04-30 is a Thursday — week should start Mon 2026-04-27.
    const r = currentWeekRange(new Date("2026-04-30T12:00:00Z"));
    expect(r.start).toBe("2026-04-27");
    expect(r.end).toBe("2026-05-03");
  });

  it("Sunday rolls back to previous Monday", () => {
    const r = currentWeekRange(new Date("2026-05-03T23:00:00Z"));
    expect(r.start).toBe("2026-04-27");
    expect(r.end).toBe("2026-05-03");
  });

  it("Monday is its own start", () => {
    const r = currentWeekRange(new Date("2026-05-04T00:00:00Z"));
    expect(r.start).toBe("2026-05-04");
  });

  it("free tier limits match spec §F15 Phase 1", () => {
    expect(defaultLimitsFor("free")).toEqual({ 1: 5, 2: 8, 3: 20 });
  });

  it("pro and studio scale up", () => {
    expect(defaultLimitsFor("pro")[1]).toBeGreaterThan(defaultLimitsFor("free")[1]);
    expect(defaultLimitsFor("studio")[1]).toBeGreaterThan(defaultLimitsFor("pro")[1]);
  });
});
