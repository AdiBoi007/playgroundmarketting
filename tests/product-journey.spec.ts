import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the product journey supports keyboard navigation and carries the chosen question into a brief", async ({ page }) => {
  await page.goto("/");
  const journey = page.locator("#product-journey");
  const tabs = journey.getByRole("tab");
  await expect(tabs).toHaveCount(5);
  const idea = journey.getByRole("tab", { name: "Idea", exact: true });
  await expect(idea).toHaveAttribute("aria-selected", "true");
  await expect(journey.getByRole("tabpanel")).toHaveCount(1);
  await expect(journey.getByRole("link", { name: "Find pilot users for my idea" })).toHaveAttribute("href", "/waitlist");
  await idea.focus();
  for (const name of ["Prototype", "MVP", "Launch", "New features", "Idea"]) {
    await page.keyboard.press("ArrowRight");
    const selected = journey.getByRole("tab", { name, exact: true });
    await expect(selected).toBeFocused();
    await expect(selected).toHaveAttribute("aria-selected", "true");
    await expect(journey.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
    await expect(journey.getByRole("tabpanel")).toHaveAccessibleName(name);
    await expect(journey.getByRole("tabpanel")).toContainText("WHO WE FIND");
    await expect(journey.getByRole("tabpanel")).toContainText("WHAT WE TEST");
    await expect(journey.getByRole("tabpanel")).toContainText("WHAT YOU LEARN");
  }
  await page.keyboard.press("End");
  await expect(journey.getByRole("tab", { name: "New features" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(journey.getByRole("tab", { name: "Launch", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(idea).toBeFocused();
  await journey.getByRole("tab", { name: "Prototype", exact: true }).click();
  await journey.getByRole("link", { name: "Test my prototype with pilot users" }).click();
  await expect(page).toHaveURL(/\/run-a-test\?focus=/);
  await expect(page.getByLabel("What do you want to find out?")).toHaveValue("I want to find out: Can my pilot users complete the key task in my prototype?");
});

for (const width of [375, 768, 1440]) {
  test(`the horizontal product journey stays readable and accessible at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const journey = page.locator("#product-journey");
    await journey.getByRole("tab", { name: "New features", exact: true }).click();
    const positions = await journey.getByRole("tab").evaluateAll(tabs => tabs.map(tab => {
      const rect = tab.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right };
    }));
    expect(new Set(positions.map(position => position.top)).size).toBe(1);
    for (const position of positions) {
      expect(position.left).toBeGreaterThanOrEqual(0);
      expect(position.right).toBeLessThanOrEqual(width);
    }
    await journey.screenshot({ path: testInfo.outputPath(`product-journey-${width}.png`) });
    const audit = await new AxeBuilder({ page }).include("#product-journey").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(audit.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
    if (width === 375) {
      await page.addStyleTag({ content: "html{font-size:200%}" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await expect(journey.getByRole("tab", { name: "New features", exact: true })).toBeVisible();
      await expect(journey.getByRole("link", { name: "Find users to test my next feature" })).toBeVisible();
    }
  });
}
