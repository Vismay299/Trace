import { expect, test } from "@playwright/test";

test.describe("Trace marketing site", () => {
  test("renders the full home journey and primary navigation", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Content from proof, not prompts." }),
    ).toBeVisible();
    await expect(
      page.getByText("Every public idea has a private origin."),
    ).toBeVisible();
    await expect(
      page.getByText("Based on commit to auth-service"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Start with positioning/ }),
    ).toBeVisible();

    await page.goto("/story");
    await expect(
      page.getByRole("heading", { name: "The blank box problem." }),
    ).toBeVisible();

    await page.goto("/product");
    await expect(
      page.getByRole("heading", {
        name: "The content engine starts before the content.",
      }),
    ).toBeVisible();

    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: /The tiers are split/ }),
    ).toBeVisible();
  });

  test("handles waitlist validation and success", async ({ page }) => {
    await page.route("**/api/waitlist", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, created: true }),
      });
    });

    await page.goto("/waitlist?tier=pro");

    await expect(page.getByText("Selected: Pro")).toBeVisible();
    await page.getByRole("button", { name: "Join Waitlist" }).click();
    await expect(page.getByText("Enter a real email address.")).toBeVisible();
    await expect(page.getByText("Enter a real email address.")).toContainText(
      "Enter a real email address.",
    );

    await page.getByLabel("Email address").fill("builder@example.com");
    await page
      .getByLabel("What are you building?")
      .fill("A source-backed content engine for builders.");
    await page.getByText("LinkedIn").click();
    await page.getByRole("button", { name: "Join Waitlist" }).click();

    await expect(
      page.getByText("You're in. Watch your inbox for the strategy preview."),
    ).toBeVisible();
  });

  test("opens and closes the mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(
      page.getByLabel("Primary").getByRole("link", { name: "Product" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Open navigation menu" }),
    ).toBeVisible();
  });

  test("serves SEO support routes", async ({ page }) => {
    const robots = await page.request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Allow: /");

    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapXml = await sitemap.text();
    expect(sitemapXml).toContain("/product");
    expect(sitemapXml).toContain("/legal/privacy");

    const og = await page.request.get("/opengraph-image");
    expect(og.ok()).toBeTruthy();
    expect(og.headers()["content-type"]).toContain("image/png");
  });

  test("surfaces launch legal and data-use pages", async ({ page }) => {
    await page.goto("/signup");
    const main = page.getByRole("main");

    await expect(main.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    await expect(
      main.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/legal/privacy");
    await expect(
      main.getByRole("link", { name: "Data-Use Disclosure" }),
    ).toHaveAttribute("href", "/legal/data-use");

    await page.goto("/legal/terms");
    await expect(
      page.getByRole("heading", { name: "Terms of Service" }),
    ).toBeVisible();
    await expect(page.getByText("Stripe is the billing system")).toBeVisible();

    await page.goto("/legal/privacy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeVisible();
    await expect(
      page.getByText("Trace does not use your private sources"),
    ).toBeVisible();

    await page.goto("/legal/data-use");
    await expect(
      page.getByRole("heading", { name: "Data-Use Disclosure" }),
    ).toBeVisible();
    await expect(page.getByText("GitHub OAuth Scopes")).toBeVisible();
  });
});
