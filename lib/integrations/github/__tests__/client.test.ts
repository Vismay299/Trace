import { describe, expect, it } from "vitest";
import { compareRepoOptions, repoOptionToSelectedResource } from "../client";
import type { RepoOption } from "../client";

const base: RepoOption = {
  id: "1",
  name: "repo",
  fullName: "me/repo",
  url: "https://github.com/me/repo",
  visibility: "public",
  language: "TypeScript",
  pushedAt: "2026-04-01T00:00:00Z",
  isStarred: false,
  isPinned: false,
  contentPotential: "medium",
  contentSignals: ["recent commits"],
  defaultBranch: "main",
};

describe("GitHub repo helpers", () => {
  it("sorts pinned and starred repos before ordinary repos", () => {
    const repos = [
      { ...base, id: "ordinary", fullName: "me/ordinary" },
      { ...base, id: "starred", fullName: "me/starred", isStarred: true },
      { ...base, id: "pinned", fullName: "me/pinned", isPinned: true },
    ].sort(compareRepoOptions);

    expect(repos.map((repo) => repo.id)).toEqual([
      "pinned",
      "starred",
      "ordinary",
    ]);
  });

  it("converts repo options into selected resource metadata", () => {
    const selected = repoOptionToSelectedResource(base);
    expect(selected.id).toBe("1");
    expect(selected.fullName).toBe("me/repo");
    expect(selected.metadata?.contentPotential).toBe("medium");
  });
});
