import { describe, expect, it } from "vitest";
import { selectedResourcesForSync } from "../sync";

const selected = [
  {
    id: "1",
    name: "repo",
    fullName: "me/repo",
    selectedAt: "2026-05-06T00:00:00.000Z",
  },
  {
    id: "2",
    name: "other",
    fullName: "me/other",
    selectedAt: "2026-05-06T00:00:00.000Z",
  },
];

describe("GitHub sync targeting", () => {
  it("narrows webhook syncs to the selected target repo", () => {
    expect(
      selectedResourcesForSync({
        payload: {
          sourceType: "github",
          target: {
            repo: { id: "1", fullName: "me/repo" },
            commitShas: ["abc"],
            reason: "push",
          },
        },
        connectionSelected: selected,
      }),
    ).toEqual([selected[0]]);
  });

  it("ignores webhook target repos outside the user's selection", () => {
    expect(
      selectedResourcesForSync({
        payload: {
          sourceType: "github",
          target: {
            repo: { id: "3", fullName: "me/unselected" },
            commitShas: ["abc"],
            reason: "push",
          },
        },
        connectionSelected: selected,
      }),
    ).toEqual([]);
  });
});
