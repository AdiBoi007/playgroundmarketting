import { test, expect } from "@playwright/test";

const companies = ["IBM", "Canva", "Mastercard", "Zip", "Airtasker", "CommBank", "Amazon", "McDonald’s", "Deloitte", "EY", "PwC"];

for (const width of [375, 1440, 2560]) {
  test(`tester logos loop and can be paused by pointer and keyboard at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const marquee = page.getByRole("region", { name: "Real people from the world’s leading companies." });
    await marquee.scrollIntoViewIfNeeded();
    const list = marquee.getByRole("list", { name: "Companies our testers come from" });
    const track = list.locator("..");
    const viewport = track.locator("..");
    await expect(marquee.getByRole("img")).toHaveCount(11);
    for (const name of companies)
      await expect(marquee.getByRole("img", { name, exact: true })).toHaveCount(1);
    await expect.poll(() => marquee.locator("img").evaluateAll((images) =>
      images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
    )).toBe(true);
    const firstPosition = await track.evaluate((element) => getComputedStyle(element).transform);
    await expect.poll(() => track.evaluate((element) => getComputedStyle(element).transform)).not.toBe(firstPosition);
    await viewport.hover();
    await expect(track).toHaveCSS("animation-play-state", "paused");
    await page.mouse.move(0, 0);
    await expect(track).toHaveCSS("animation-play-state", "running");
    const pause = marquee.getByRole("checkbox", { name: "Pause logo animation" });
    await pause.check();
    await expect(track).toHaveCSS("animation-play-state", "paused");
    await marquee.screenshot({ path: testInfo.outputPath(`tester-marquee-${width}.png`) });
    await pause.focus();
    await page.keyboard.press("Space");
    await expect(pause).not.toBeChecked();
    await expect(track).toHaveCSS("animation-play-state", "running");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    // The two equal halves are the invariant that makes the CSS loop seamless.
    const sizes = await track.locator("ul").evaluateAll((lists) => lists.map((element) => element.getBoundingClientRect().width));
    expect(sizes[0]).toBeCloseTo(sizes[1], 2);
    expect(await track.evaluate((element) => element.getBoundingClientRect().width)).toBeCloseTo(sizes[0] * 2, 2);
    expect(sizes[0]).toBeGreaterThanOrEqual(width);
  });
}

test("reduced motion shows every company in a static mobile grid", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.goto("/");
  const marquee = page.getByRole("region", { name: "Real people from the world’s leading companies." });
  const list = marquee.getByRole("list", { name: "Companies our testers come from" });
  await marquee.scrollIntoViewIfNeeded();
  await expect(list.locator("..")).toHaveCSS("animation-name", "none");
  await expect(marquee.getByRole("checkbox", { name: "Pause logo animation" })).toBeHidden();
  for (const name of companies) {
    const logo = marquee.getByRole("img", { name, exact: true });
    await expect(logo).toBeVisible();
    const bounds = await logo.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  }
  await marquee.screenshot({ path: testInfo.outputPath("tester-marquee-reduced-motion.png") });
});
