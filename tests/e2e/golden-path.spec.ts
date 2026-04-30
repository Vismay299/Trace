import { expect, test } from "@playwright/test";

test.describe("Phase 1 golden path", () => {
  test.skip(
    !process.env.TRACE_E2E_FULL,
    "Set TRACE_E2E_FULL=true with a seeded Postgres/OpenRouter test env to run the full authenticated golden path.",
  );

  test("signup to narrative-plan story seed flow", async ({ page }) => {
    const email = `builder-${Date.now()}@example.com`;
    const password = "correct-horse-battery-staple";

    await page.goto("/signup");
    await page.getByLabel("Name").fill("Trace Builder");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /Create account/i }).click();

    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { name: /onboarding/i }),
    ).toBeVisible();

    await page.goto("/weekly");
    await expect(
      page.getByRole("heading", { name: "Weekly check-in" }),
    ).toBeVisible();

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });
});
