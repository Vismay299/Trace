import { describe, expect, it } from "vitest";
import { getRoutingCatalog } from "../routing";

describe("AI routing catalog", () => {
  it("exposes tier-safe task defaults for admin controls", () => {
    const catalog = getRoutingCatalog();
    const content = catalog.tasks.find(
      (task) => task.taskType === "content_generation",
    );
    expect(content?.tier).toBe(1);
    expect(
      catalog.models.find((model) => model.id === content?.defaultModel)?.tier,
    ).toBe(1);
  });
});
