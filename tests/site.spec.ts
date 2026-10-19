import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/how-it-works",
  "/startups",
  "/about",
  "/run-a-test",
  "/waitlist",
  "/become-a-tester",
  "/privacy",
  "/terms",
];
const widths = [375, 390, 430, 768, 1024, 1440, 1728];
const assumptionNotes = [
  "They’ll know how to get started.",
  "They’ll trust it to send.",
  "They’ll pay $49.",
  "They’ll find that feature.",
  "They’ll know what to do next.",
  "They’ll come back.",
];
for (const width of widths) {
  test(`home layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    expect((await page.goto("/"))?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Find your pilot users. Test before you launch." }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
    await expect(page.locator(".world-art")).toBeVisible();
    await expect(page.locator(".hero-report-card")).toHaveCount(0);
    await expect(page.locator(".home-hero").getByRole("link", { name: "Find my pilot users" })).toHaveAttribute("href", "/waitlist");
    await expect(page.locator(".home-hero").getByRole("link", { name: "See how it works" })).toHaveAttribute("href", "/how-it-works");
    await expect(page.getByRole("heading", { name: "Your product is full of assumptions." })).toBeVisible();
    const notes = page.locator(".home-assumptions .assumption-note");
    await expect(notes).toHaveCount(6);
    for (const [index, text] of assumptionNotes.entries()) {
      await expect(notes.nth(index)).toContainText(text);
      await expect(notes.nth(index)).toContainText("UNTESTED");
    }
    await expect(page.getByRole("heading", { name: "Where do we go from here?" })).toBeVisible();
    await expect(page.getByRole("region", { name: "What this path means" })).toContainText("Keep the idea. Fix this part.");
    const clippedCopy = await page.locator(".assumption-note p, #crossroads button, #crossroads h3").evaluateAll((elements) =>
      elements.filter((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left < -2 || bounds.right > innerWidth + 2;
      }).map((element) => element.textContent),
    );
    expect(clippedCopy).toEqual([]);
    const alignment = await page.locator(".home-hero h1, .home-hero-lead, .home-hero .home-actions").evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return Math.abs((bounds.left + bounds.right) / 2 - innerWidth / 2);
      }),
    );
    for (const offset of alignment) expect(offset).toBeLessThan(1);
    if (width === 375 || width === 1440)
      await page.locator(".home-hero").screenshot({ path: testInfo.outputPath(`centered-hero-${width}.png`) });
  });
}
for (const route of routes) {
  test(`route and accessibility: ${route}`, async ({ page, request }) => {
    expect((await page.goto(route))?.status()).toBe(200);
    await expect(page).toHaveTitle(/Playground/);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    const links = await page.locator("a[href]").evaluateAll((anchors) =>
      [...new Set(anchors.map((anchor) => anchor.getAttribute("href")!))],
    );
    for (const href of links) {
      expect(href.trim(), "A link must have a destination").not.toBe("");
      expect(href, "A link must have a real destination").not.toBe("#");
      expect(href).not.toMatch(/^javascript:/i);
      const target = new URL(href, page.url());
      if (target.origin !== new URL(page.url()).origin) continue;
      const response = await request.get(`${target.pathname}${target.search}`);
      expect(response.status(), href).toBeLessThan(400);
      if (target.hash) {
        const html = await response.text();
        const hasTarget = await page.evaluate(({ html, id }) =>
          new DOMParser().parseFromString(html, "text/html").getElementById(id) !== null,
          { html, id: decodeURIComponent(target.hash.slice(1)) },
        );
        expect(hasTarget, `Missing anchor target: ${href}`).toBe(true);
      }
    }
  });
}
for (const route of [
  "/how-it-works",
  "/startups",
  "/about",
  "/run-a-test",
  "/waitlist",
  "/become-a-tester",
]) {
  for (const width of [375, 768, 1440]) {
    test(`${route} fits ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const overflowing = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        viewport: innerWidth,
        elements: [...document.querySelectorAll("main *")]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.width > 0 && (b.right > innerWidth + 2 || b.left < -2);
          })
          .map((el) => el.className)
          .slice(0, 8),
      }));
      expect(overflowing.doc, JSON.stringify(overflowing)).toBeLessThanOrEqual(
        width,
      );
    });
  }
}
test("mobile navigation works with keyboard and escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "How it works" })
    .click();
  await expect(page).toHaveURL(/how-it-works/);
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
});
test("the product question picker works by keyboard and carries the question into a brief", async ({
  page,
}) => {
  await page.goto("/");
  const options = page.locator(".question-picker-options").getByRole("button");
  await expect(options).toHaveCount(5);
  await expect(options.first()).toHaveAttribute("aria-pressed", "true");
  const pricing = page.getByRole("button", { name: "03 Pricing" });
  await pricing.focus();
  await page.keyboard.press("Enter");
  await expect(pricing).toHaveAttribute("aria-pressed", "true");
  await expect(options.first()).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("heading", { name: "Would people pay for it?" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ask this about your product" }).click();
  await expect(page).toHaveURL(/focus=Pricing/);
  await expect(page.getByLabel("What do you want to find out?")).toHaveValue(
    "I want to find out: Pricing",
  );
  await expect(page.getByRole("checkbox", {
    name: "Add me to the Playground waitlist for early-access and launch updates.",
  })).not.toBeChecked();
});

test("crossroads choices explain real next steps without changing the example findings", async ({ page }) => {
  await page.goto("/");
  const crossroads = page.locator("#crossroads");
  const choices = crossroads.getByRole("group", { name: "Explore the next move" });
  const details = crossroads.getByRole("region", { name: "What this path means" });
  await expect(choices.getByRole("button")).toHaveCount(3);
  await expect(choices.getByRole("button", { name: "Make a change", exact: true })).toHaveAttribute("aria-pressed", "true");
  const paths = [
    { label: "Launch", heading: "Take the next step.", reminder: "needs a change first" },
    { label: "Rethink it", heading: "Find a better starting point.", reminder: "does not show that the whole idea needs replacing" },
    { label: "Make a change", heading: "Keep the idea. Fix this part.", reminder: "Let people review before sending" },
  ];
  for (const path of paths) {
    const button = choices.getByRole("button", { name: path.label, exact: true });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(choices.locator('button[aria-pressed="true"]')).toHaveCount(1);
    await expect(details.getByRole("heading", { name: path.heading })).toBeVisible();
    await expect(details).toContainText(path.reminder);
    await expect(crossroads).toContainText("EXAMPLE");
    await expect(crossroads).toContainText("A made-up example");
    await expect(crossroads).toContainText("2 of 5");
  }
  const plan = crossroads.getByRole("link", { name: "Plan a test for my product" });
  await expect(plan).toHaveAttribute("href", "/run-a-test");
  await plan.click();
  await expect(page).toHaveURL(/\/run-a-test$/);
  await expect(page.getByRole("form", { name: "Share your product" })).toBeVisible();
});
async function fillBrief(page: import("@playwright/test").Page) {
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `e2e-${crypto.randomUUID()}`,
  });
  await page.getByLabel("Name").fill("Test Founder");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Product or prototype link").fill("https://example.com");
  await page
    .getByLabel("Who is it for?")
    .fill("Freelancers managing invoicing");
  await page
    .getByLabel("What do you want to find out?")
    .fill("Do users trust automatic sending?");
  await page.getByRole("checkbox", {
    name: "Add me to the Playground waitlist for early-access and launch updates.",
  }).check();
}
test("unconfigured intake preserves the brief and never claims delivery", async ({
  page,
}) => {
  await page.route("**/api/lead", (route) =>
    route.fulfill({ status: 503, json: { error: "Test requests aren’t open here yet." } }),
  );
  await page.goto("/run-a-test");
  await fillBrief(page);
  await page.getByRole("button", { name: "Send your brief" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "We couldn’t confirm your brief or waitlist signup. Please try again.",
  );
  await expect(page.getByLabel("Name")).toHaveValue("Test Founder");
  await expect(page.getByText("BRIEF RECEIVED / WAITLIST CONFIRMED", { exact: true })).toHaveCount(
    0,
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save a copy of your brief" }).click();
  expect((await download).suggestedFilename()).toBe(
    "playground-test-brief.txt",
  );
});
test("confirmed delivery stays successful even when analytics fails", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.playgroundAnalytics = () => {
      throw new Error("provider unavailable");
    };
  });
  await page.route("**/api/lead", async (route) => {
    await route.fulfill({ json: { delivered: true, waitlisted: true } });
  });
  await page.goto("/run-a-test");
  await fillBrief(page);
  await page.getByRole("button", { name: "Send your brief" }).click();
  await expect(
    page.getByText("BRIEF RECEIVED / WAITLIST CONFIRMED", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
});
test("changed retries get a new key; unchanged retries keep the key", async ({
  page,
}) => {
  const keys: string[] = [];
  await page.route("**/api/lead", async (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    await route.fulfill({ status: 502, json: { error: "Not delivered" } });
  });
  await page.goto("/run-a-test");
  await fillBrief(page);
  await page.getByRole("button", { name: "Send your brief" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "We couldn’t confirm your brief or waitlist signup. Please try again.",
  );
  await page.getByRole("button", { name: "Send your brief" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "We couldn’t confirm your brief or waitlist signup. Please try again.",
  );
  await page
    .getByLabel("What do you want to find out?")
    .fill("An updated test question");
  await page.getByRole("button", { name: "Send your brief" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "We couldn’t confirm your brief or waitlist signup. Please try again.",
  );
  expect(keys).toHaveLength(3);
  expect(keys[0]).toBe(keys[1]);
  expect(keys[1]).not.toBe(keys[2]);
});
test("lead API rejects foreign origins and invalid data", async ({
  request,
  baseURL,
}) => {
  expect(
    (
      await request.post("/api/lead", {
        headers: { origin: "https://foreign.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/lead", {
        headers: {
          origin: baseURL!,
          "x-forwarded-for": `validation-${crypto.randomUUID()}`,
        },
        data: {
          name: "Founder",
          email: "bad",
          productUrl: "javascript:alert(1)",
          targetUser: "People",
          testGoal: "Trust",
          consent: true,
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/lead", {
        headers: { origin: baseURL! },
        data: "too long",
        maxRedirects: 0,
      })
    ).status(),
  ).toBe(415);
});
test("home remains readable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(
    page.getByRole("heading", { name: "Find your pilot users. Test before you launch." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your audience. Found. Matched. Tested." })).toBeVisible();
  await expect(page.getByText("Playground finds pilot users at every stage:", { exact: true }).locator("..").getByRole("listitem")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "Your product is full of assumptions." })).toBeVisible();
  await expect(page.locator(".home-assumptions .assumption-note")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: "Where do we go from here?" })).toBeVisible();
  await expect(page.getByRole("region", { name: "What this path means" })).toContainText("Keep the idea. Fix this part.");
  await expect(page.locator("#crossroads").getByRole("link", { name: "Plan a test for my product" })).toHaveAttribute("href", "/run-a-test");
  await expect(page.locator("#crossroads")).toContainText("A made-up example");
  await expect(page.locator(".home-method-card")).toHaveCount(3);
  const testerMarquee = page.getByRole("region", { name: "Real people from the world’s leading companies." });
  await expect(testerMarquee.getByRole("img")).toHaveCount(11);
  const pauseLogos = testerMarquee.getByRole("checkbox", { name: "Pause logo animation" });
  if (await pauseLogos.isVisible()) {
    await pauseLogos.check();
    await expect(pauseLogos).toBeChecked();
  }
  await expect(page.locator(".home-stage-note")).toContainText("Paid tests underway.");
  await expect(page.locator(".home-stage-note")).toContainText("Public launch coming next.");
  await expect(page.locator(".hero-report-card")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Join the waitlist" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Join the waitlist" }).first(),
  ).toHaveAttribute("href", "/waitlist");
  const question = page.locator("summary", { hasText: "Do I need a finished product?" });
  await question.click();
  await expect(question.locator("..")).toHaveAttribute("open", "");
  await expect(question.locator("..")).toContainText("join the waitlist");
  await context.close();
});
test("mobile pages and forms pass accessibility checks", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["/", "/run-a-test", "/waitlist", "/become-a-tester"]) {
    await page.goto(route);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
});

for (const route of [
  "/",
  "/how-it-works",
  "/startups",
  "/about",
  "/run-a-test",
  "/waitlist",
  "/become-a-tester",
]) {
  test(`text at 200% remains within the mobile page: ${route}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route);
    await page.addStyleTag({ content: "html{font-size:200%}" });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(375);
    if (route === "/") {
      for (const name of ["Launch", "Rethink it", "Make a change"]) {
        const choice = page.locator("#crossroads").getByRole("button", { name, exact: true });
        await choice.click();
        await expect(choice).toHaveAttribute("aria-pressed", "true");
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
        const clippedCopy = await page.locator(".assumption-note p, #crossroads button, #crossroads h3, #crossroads p").evaluateAll((elements) =>
          elements.filter((element) => {
            const bounds = element.getBoundingClientRect();
            return bounds.left < -2 || bounds.right > innerWidth + 2;
          }).map((element) => element.textContent),
        );
        expect(clippedCopy, `Enlarged copy on ${name} path`).toEqual([]);
      }
    }
  });
}

test("native FAQs explain test limits and work with a keyboard", async ({ page }) => {
  await page.goto("/");
  const buying = page.locator("summary", { hasText: "Can a test prove that people will buy?" });
  await buying.focus();
  await page.keyboard.press("Enter");
  await expect(buying.locator("..")).toHaveAttribute("open", "");
  await expect(buying.locator("..")).toContainText("cannot promise sales");
  await page.keyboard.press("Space");
  await expect(buying.locator("..")).not.toHaveAttribute("open", "");
  const access = page.locator("summary", { hasText: "Can I use Playground now?" });
  await access.click();
  await expect(access.locator("..")).toContainText("does not book a test");
});

test("the removed sample report redirects and is absent from navigation and the sitemap", async ({ page, request }) => {
  const response = await request.get("/sample-report", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/how-it-works");
  await page.goto("/");
  await expect(page.locator('a[href*="sample-report"]')).toHaveCount(0);
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain("sample-report");
});

test("reduced motion keeps the full story visible and disables scroll progress", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".site-reading-progress")).toBeHidden();
  await expect.poll(() => page.locator("[data-reveal]").evaluateAll((elements) =>
    elements.filter((element) => {
      const style = getComputedStyle(element);
      return style.opacity !== "1" || style.visibility === "hidden";
    }).length,
  )).toBe(0);
  await expect(page.getByRole("heading", { name: "Find your people. Test your next move." })).toBeVisible();
  await expect(page.getByRole("region", { name: "What this path means" })).toBeVisible();
});
