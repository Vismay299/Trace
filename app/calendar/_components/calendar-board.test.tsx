import { describe, expect, it } from "vitest";
import { dateKey } from "./calendar-board";

describe("dateKey", () => {
  it("normalizes dates from strings, Date objects, and missing values", () => {
    expect(dateKey("2026-05-03T12:00:00.000Z")).toBe("2026-05-03");
    expect(dateKey(new Date("2026-05-04T08:00:00.000Z"))).toBe("2026-05-04");
    expect(dateKey(null)).toBe("");
  });
});
