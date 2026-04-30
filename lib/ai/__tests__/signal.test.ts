import { describe, expect, it } from "vitest";
import { decideSignalStatus } from "../signal";

describe("signal decision boundaries", () => {
  it("uses source_mining when three fresh chunks exist", () => {
    const status = decideSignalStatus({
      newChunks: 3,
      newSeeds: 0,
      newUploads: 1,
    });
    expect(status.mode).toBe("source_mining");
    expect(status.artifacts_found).toBe(4);
  });

  it("uses source_mining when two fresh story seeds exist", () => {
    const status = decideSignalStatus({
      newChunks: 0,
      newSeeds: 2,
      newUploads: 0,
    });
    expect(status.mode).toBe("source_mining");
    expect(status.stories_found).toBe(2);
  });

  it("uses low_signal below the artifact and story thresholds", () => {
    const status = decideSignalStatus({
      newChunks: 2,
      newSeeds: 1,
      newUploads: 0,
    });
    expect(status.mode).toBe("low_signal");
  });

  it("infers product stage from weekly language", () => {
    expect(
      decideSignalStatus({
        newChunks: 0,
        newSeeds: 0,
        newUploads: 0,
        lastCheckinSummary: "We launched the beta waitlist yesterday.",
      }).product_stage,
    ).toBe("launching");
    expect(
      decideSignalStatus({
        newChunks: 0,
        newSeeds: 0,
        newUploads: 0,
        lastPlanSummary: "Retention improved and churn dropped.",
      }).product_stage,
    ).toBe("operating");
  });
});
