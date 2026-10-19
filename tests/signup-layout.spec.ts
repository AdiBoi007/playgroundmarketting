import { test as base, expect, chromium, webkit, type Page } from "@playwright/test";

async function expectSignupLayout(page: Page, width: number) {
  const paths = page.getByRole("navigation", { name: "Choose your Playground path" });
  await expect(paths).toHaveCSS("display", "flex");
  const links = paths.getByRole("link");
  for (const link of await links.all()) {
    await expect(link).toHaveCSS("display", "flex");
    await expect(link).toHaveCSS("flex-direction", "column");
  }
  const choices = page.getByRole("radiogroup", { name: "Preferred contact method" });
  await expect(choices).toHaveCSS("display", "grid");
  const cards = choices.locator("label");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await expect(card).toHaveCSS("display", "flex");
    await expect(card).toHaveCSS("flex-direction", "column");
    const title = await card.locator(".contact-choice-title").boundingBox();
    const detail = await card.locator(".contact-choice-detail").boundingBox();
    expect(title).not.toBeNull();
    expect(detail).not.toBeNull();
    expect(detail!.y).toBeGreaterThanOrEqual(title!.y + title!.height + 3);
  }
  const [first, second, third] = await cards.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top };
  }));
  expect(second.left).toBeGreaterThanOrEqual(first.right + 8);
  expect(second.top).toBe(first.top);
  expect(third.left).toBeGreaterThanOrEqual(second.right + 8);
  expect(third.top).toBe(first.top);
  if (new URL(page.url()).pathname === "/become-a-tester")
    await expect(page.locator(".signup-promises")).toHaveCSS("list-style-type", "none");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

for (const browserName of ["chromium", "webkit"] as const) {
  const test = base.extend<{ auditPage: Page }>({
    auditPage: async ({ baseURL }, runTest) => {
      const browser = await (browserName === "webkit" ? webkit : chromium).launch();
      const context = await browser.newContext({ baseURL, reducedMotion: "reduce" });
      try { await runTest(await context.newPage()); }
      finally { await browser.close(); }
    },
  });
  test.describe(browserName, () => {
    test("signup styles are available before navigation and do not depend on a route-only stylesheet", async ({ auditPage: page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/");
      // Reproduce a missing route CSS asset while preserving the already loaded site stylesheet.
      await page.route("**/*.css", route => route.abort());
      await page.getByRole("link", { name: "Find my pilot users", exact: true }).first().click();
      await page.waitForURL("**/waitlist");
      await expectSignupLayout(page, 1440);
      await page.getByRole("navigation", { name: "Choose your Playground path" }).getByRole("link", { name: "Get paid to test" }).click();
      await page.waitForURL("**/become-a-tester");
      await expectSignupLayout(page, 1440);
    });

    for (const width of [375, 1440]) {
      test(`signup layouts survive direct entry, navigation and browser history at ${width}px`, async ({ auditPage: page }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 });
        const failedStyles: string[] = [];
        page.on("response", response => {
          if (response.request().resourceType() === "stylesheet" && response.status() >= 400) failedStyles.push(response.url());
        });
        await page.goto("/waitlist");
        await expectSignupLayout(page, width);
        await page.locator("main").screenshot({ path: testInfo.outputPath(`waitlist-${width}.png`) });
        const paths = page.getByRole("navigation", { name: "Choose your Playground path" });
        await paths.getByRole("link", { name: "Get paid to test" }).click();
        await page.waitForURL("**/become-a-tester");
        await expectSignupLayout(page, width);
        await page.getByRole("radio", { name: "Phone", exact: true }).check();
        await expect(page.getByLabel("Phone number", { exact: true })).toBeVisible();
        await expect(page.getByLabel("LinkedIn profile (optional)", { exact: true })).toBeVisible();
        await page.getByRole("radio", { name: "Email", exact: true }).check();
        await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
        await expect(page.getByLabel("Phone number", { exact: true })).toBeHidden();
        await expect(page.getByLabel("LinkedIn profile (optional)", { exact: true })).toBeVisible();
        await page.getByRole("radio", { name: "LinkedIn", exact: true }).check();
        await expect(page.getByLabel("Phone number", { exact: true })).toBeHidden();
        await expect(page.getByLabel("Résumé / CV (optional)")).toBeVisible();
        await page.locator("main").screenshot({ path: testInfo.outputPath(`tester-${width}.png`) });
        await page.goBack();
        await page.waitForURL("**/waitlist");
        await expectSignupLayout(page, width);
        await page.reload();
        await expectSignupLayout(page, width);
        expect(failedStyles).toEqual([]);
      });
    }
  });
}
