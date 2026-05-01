import { describe, expect, it } from "vitest";
import {
  assessGitHubArtifact,
  qualifiesForShipToPost,
  type GitHubArtifact,
} from "../filter";

const base: GitHubArtifact = {
  id: "github:commit:me/repo:abc",
  type: "commit",
  repoId: "1",
  repoFullName: "me/repo",
  title: "Refactor onboarding state machine to prevent duplicate prompts",
  body: "The old flow could replay a follow-up after refresh. This introduces deterministic transitions and covers the regression.",
  author: "vismay",
  metadata: { changedFiles: 5, additions: 140, deletions: 40 },
};

describe("GitHub meaningful-activity filters", () => {
  it("keeps substantive engineering activity and can trigger Ship-to-Post", () => {
    const result = assessGitHubArtifact(base);
    expect(result.keep).toBe(true);
    expect(result.reason).toBe("meaningful_activity");
    expect(qualifiesForShipToPost(base, result)).toBe(true);
  });

  it("rejects merge, bot, dependency, and one-word churn", () => {
    expect(
      assessGitHubArtifact({
        ...base,
        title: "Merge pull request #12 from feature/foo",
        metadata: { isMergeCommit: true },
      }).reason,
    ).toBe("merge_commit");
    expect(
      assessGitHubArtifact({ ...base, author: "dependabot[bot]" }).reason,
    ).toBe("bot_author");
    expect(assessGitHubArtifact({ ...base, title: "Bump lodash" }).reason).toBe(
      "dependency_churn",
    );
    expect(
      assessGitHubArtifact({ ...base, title: "fix", body: "" }).reason,
    ).toBe("low_information_commit");
  });
});
