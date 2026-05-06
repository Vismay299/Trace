import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildWebhookSyncJobs,
  targetFromWebhook,
  verifyGitHubWebhookSignature,
} from "../webhooks";

const body = JSON.stringify({ ok: true });
const signature =
  "sha256=" + createHmac("sha256", "secret").update(body).digest("hex");

describe("GitHub webhooks", () => {
  it("verifies GitHub HMAC signatures", () => {
    expect(
      verifyGitHubWebhookSignature({ body, signature, secret: "secret" }),
    ).toBe(true);
    expect(
      verifyGitHubWebhookSignature({ body, signature, secret: "wrong" }),
    ).toBe(false);
    expect(
      verifyGitHubWebhookSignature({ body, signature: null, secret: "secret" }),
    ).toBe(false);
  });

  it("builds push targets from commit shas", () => {
    const target = targetFromWebhook("push", {
      repository: { id: 1, name: "repo", full_name: "me/repo" },
      commits: [{ id: "abc" }, { id: "def" }],
      head_commit: { id: "def" },
    });

    expect(target).toMatchObject({
      repo: { id: "1", fullName: "me/repo" },
      commitShas: ["abc", "def"],
      reason: "push",
    });
  });

  it("ignores unselected repos and creates stable selected-repo jobs", () => {
    const jobs = buildWebhookSyncJobs({
      event: "pull_request",
      delivery: "delivery-1",
      payload: {
        repository: { id: 1, name: "repo", full_name: "me/repo" },
        pull_request: { number: 12 },
      },
      connections: [
        {
          id: "connection-1",
          userId: "user-1",
          selectedResources: [
            {
              id: "1",
              name: "repo",
              fullName: "me/repo",
              selectedAt: "2026-05-06T00:00:00.000Z",
            },
          ],
        },
        {
          id: "connection-2",
          userId: "user-2",
          selectedResources: [
            {
              id: "2",
              name: "other",
              fullName: "me/other",
              selectedAt: "2026-05-06T00:00:00.000Z",
            },
          ],
        },
      ],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      userId: "user-1",
      sourceConnectionId: "connection-1",
      target: {
        repo: { id: "1", fullName: "me/repo" },
        pullRequestNumbers: [12],
      },
    });
    expect(jobs[0]?.jobId).toMatch(
      /^github-webhook:delivery-1:connection-1:1:[a-f0-9]{24}$/,
    );
  });
});
