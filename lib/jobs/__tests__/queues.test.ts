import { describe, expect, it } from "vitest";
import { isJobQueueName, serializeJobError } from "../queues";

describe("job queue helpers", () => {
  it("recognizes registered Phase 2 queues", () => {
    expect(isJobQueueName("source-sync")).toBe(true);
    expect(isJobQueueName("ship-to-post")).toBe(true);
    expect(isJobQueueName("unknown")).toBe(false);
  });

  it("serializes retryable job errors without losing the message", () => {
    const serialized = serializeJobError(new Error("provider timed out"));
    expect(serialized.name).toBe("Error");
    expect(serialized.message).toBe("provider timed out");
    expect(serialized.retryable).toBe(true);
  });
});
