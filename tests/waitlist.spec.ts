import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { NextRequest } from "next/server";
import { POST } from "../app/api/waitlist/route";
import { validateWaitlist } from "../lib/waitlist";

const consentLabel =
  "I agree to receive early-access and product launch updates from Playground.";
const signup = {
  email: "founder@example.com",
  name: "Test Founder",
  productUrl: "https://example.com/product",
  consent: true,
  source: "waitlist",
};
const gmailSettings: Partial<NodeJS.ProcessEnv> = {
  GOOGLE_CLIENT_ID: "mock-client-id",
  GOOGLE_CLIENT_SECRET: "mock-client-secret",
  GOOGLE_REFRESH_TOKEN: "mock-refresh-token",
  GMAIL_SENDER_EMAIL: "playground@example.com",
  WAITLIST_NOTIFY_EMAIL: "notify@example.com",
};

function waitlistRequest(body: unknown = signup, options: { id?: string; ip?: string } = {}) {
  return new NextRequest("http://localhost:3000/api/waitlist", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "content-type": "application/json",
      "x-forwarded-for": options.ip ?? `waitlist-api-${crypto.randomUUID()}`,
      "idempotency-key": options.id ?? crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
}

async function withMockedGmail(fetch: typeof globalThis.fetch, action: () => Promise<void>) {
  const previous = new Map([...Object.keys(gmailSettings), "GMAIL_APP_PASSWORD"].map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  try {
    delete process.env.GMAIL_APP_PASSWORD;
    Object.assign(process.env, gmailSettings);
    globalThis.fetch = fetch;
    await action();
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of previous)
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
}

async function fillWaitlist(page: Page) {
  await page.getByLabel("Email", { exact: true }).fill(signup.email);
  await page.getByLabel("Name (optional)", { exact: true }).fill(signup.name);
  await page
    .getByLabel("Product link (optional)")
    .fill(signup.productUrl);
  await page.getByRole("checkbox", { name: consentLabel }).check();
}

async function expectPreservedFields(page: Page) {
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    signup.email,
  );
  await expect(page.getByLabel("Name (optional)", { exact: true })).toHaveValue(
    signup.name,
  );
  await expect(
    page.getByLabel("Product link (optional)"),
  ).toHaveValue(signup.productUrl);
  await expect(page.getByRole("checkbox", { name: consentLabel })).toBeChecked();
  await expect(page.getByText("SIGNUP CONFIRMED", { exact: true })).toHaveCount(0);
}

test("waitlist keeps completed fields after failure and permits a confirmed retry", async ({
  page,
}) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/waitlist", async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill(
      bodies.length === 1
        ? {
            status: 503,
            json: {
              error:
                "Waitlist signup is temporarily unavailable. Please check back soon.",
            },
          }
        : { json: { accepted: true } },
    );
  });
  await page.goto("/waitlist");
  await fillWaitlist(page);
  await page.getByRole("button", { name: "Join the waitlist", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Waitlist signup is temporarily unavailable",
  );
  await expectPreservedFields(page);
  const submit = page.getByRole("button", {
    name: "Join the waitlist",
    exact: true,
  });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(
    page.getByRole("heading", { name: "You’re on the waitlist.", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("SIGNUP CONFIRMED", { exact: true })).toBeVisible();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toMatchObject(signup);
  expect(bodies[1]).toMatchObject(signup);
  expect(bodies[0].website ?? "").toBe("");
});

for (const { status, response } of [
  { status: 200, response: { accepted: false } },
  { status: 200, response: { delivered: true } },
  { status: 200, response: {} },
  { status: 502, response: { accepted: true } },
]) {
  test(`an unconfirmed ${status} response does not claim signup: ${JSON.stringify(response)}`, async ({
    page,
  }) => {
    await page.route("**/api/waitlist", (route) =>
      route.fulfill({ status, json: response }),
    );
    await page.goto("/waitlist");
    await fillWaitlist(page);
    await page.getByRole("button", { name: "Join the waitlist", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "We couldn’t confirm your signup. Please try again.",
    );
    await expectPreservedFields(page);
  });
}

test("network failure does not claim signup or clear fields", async ({ page }) => {
  await page.route("**/api/waitlist", (route) => route.abort("failed"));
  await page.goto("/waitlist");
  await fillWaitlist(page);
  await page.getByRole("button", { name: "Join the waitlist", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await expectPreservedFields(page);
});

test("confirmed waitlist signup stays successful when analytics throws", async ({ page }) => {
  await page.addInitScript(() => {
    window.playgroundAnalytics = () => {
      throw new Error("Analytics is unavailable.");
    };
  });
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ json: { accepted: true } }),
  );
  await page.goto("/waitlist");
  await fillWaitlist(page);
  await page.getByRole("button", { name: "Join the waitlist", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("SIGNUP CONFIRMED");
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
});

test("the mobile waitlist can be completed and submitted with a keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ json: { accepted: true } }),
  );
  await page.goto("/waitlist");
  await expect(
    page.getByRole("form", { name: "Join the Playground waitlist" }),
  ).toBeVisible();
  await page.getByLabel("Email", { exact: true }).focus();
  await page.keyboard.type(signup.email);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Name (optional)", { exact: true })).toBeFocused();
  await page.keyboard.type(signup.name);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Product link (optional)")).toBeFocused();
  await page.keyboard.type(signup.productUrl);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("checkbox", { name: consentLabel })).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Privacy notice", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Join the waitlist", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("SIGNUP CONFIRMED", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toBeFocused();
});

test("the waitlist is accessible at 375px and text at 200% stays within the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/waitlist");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await page.addStyleTag({ content: "html{font-size:200%}" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: consentLabel })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Join the waitlist", exact: true }),
  ).toBeVisible();
});

test.describe("waitlist input validation", () => {
  test("normalizes email and optional fields and supplies the default source", () => {
    const result = validateWaitlist({
      email: "  Founder@Example.COM  ",
      name: "  Test Founder  ",
      productUrl: "  https://example.com/product  ",
      consent: true,
    });
    expect(result).toMatchObject({ signup });
    const minimal = validateWaitlist({ email: signup.email, consent: true });
    expect(minimal).toMatchObject({
      signup: { email: signup.email, consent: true, source: "waitlist" },
    });
  });

  test("requires literal consent and a permitted source", () => {
    for (const consent of [undefined, false, "true", 1])
      expect(validateWaitlist({ ...signup, consent })).toHaveProperty("error");
    for (const source of ["waitlist", "hero", "footer"])
      expect(validateWaitlist({ ...signup, source })).toHaveProperty("signup");
    for (const source of ["another-site", "", 1, null])
      expect(validateWaitlist({ ...signup, source })).toHaveProperty("error");
  });

  test("rejects malformed addresses, controls and unsafe URLs", () => {
    const invalidFields: Record<string, unknown>[] = [
      { email: "invalid" },
      { email: "tést@example.com" },
      { email: "first@example.com,second@example.com" },
      { email: "founder@example.com\r\nBcc: attacker@example.com" },
      { email: "\nfounder@example.com" },
      { email: "a".repeat(255) + "@example.com" },
      { name: "Founder\nBcc: attacker@example.com" },
      { name: 42 },
      { name: "x".repeat(101) },
      { productUrl: "javascript:alert(1)" },
      { productUrl: "https://user:password@example.com" },
      { productUrl: "not-a-url" },
      { productUrl: 42 },
      { productUrl: "https://example.com/" + "x".repeat(2048) },
    ];
    for (const fields of invalidFields)
      expect(validateWaitlist({ ...signup, ...fields }), JSON.stringify(fields)).toHaveProperty(
        "error",
      );
  });
});

test("waitlist API rejects missing or foreign Origin before processing a signup", async ({
  request,
  baseURL,
}) => {
  for (const origin of [undefined, "https://foreign.example", "null"])
    expect(
      (
        await request.post("/api/waitlist", {
          headers: origin ? { origin } : {},
          data: {},
        })
      ).status(),
      `Origin ${origin ?? "absent"} against ${baseURL}`,
    ).toBe(403);
});

test("waitlist API rejects unsupported, oversized and malformed bodies", async ({
  request,
  baseURL,
}) => {
  const cases = [
    { body: "email=founder@example.com", contentType: "text/plain", status: 415 },
    { body: "{}", contentType: "application/jsonp", status: 415 },
    { body: JSON.stringify({ name: "x".repeat(5000) }), contentType: "application/json", status: 413 },
    { body: "{", contentType: "application/json", status: 400 },
    { body: "[]", contentType: "application/json", status: 400 },
    { body: "null", contentType: "application/json", status: 400 },
  ];
  for (const { body, contentType, status } of cases)
    expect(
      (
        await request.post("/api/waitlist", {
          headers: {
            origin: baseURL!,
            "content-type": contentType,
            "x-forwarded-for": `waitlist-body-${crypto.randomUUID()}`,
          },
          data: body,
        })
      ).status(),
    ).toBe(status);
});

test("waitlist API rejects invalid input, missing consent and the honeypot", async ({
  request,
  baseURL,
}) => {
  for (const data of [
    {},
    { ...signup, email: "invalid" },
    { ...signup, consent: false },
    { ...signup, source: "another-site" },
    { ...signup, productUrl: "javascript:alert(1)" },
    { ...signup, website: "filled-by-a-bot" },
  ]) {
    const response = await request.post("/api/waitlist", {
      headers: {
        origin: baseURL!,
        "x-forwarded-for": `waitlist-invalid-${crypto.randomUUID()}`,
      },
      data,
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).not.toHaveProperty("accepted", true);
  }
});

test("waitlist API fails closed without Gmail configuration and makes no network call", async () => {
  const keys = [
    "GMAIL_APP_PASSWORD",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "GMAIL_SENDER_EMAIL",
    "WAITLIST_NOTIFY_EMAIL",
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  try {
    for (const key of keys) delete process.env[key];
    globalThis.fetch = async () => {
      networkCalls += 1;
      throw new Error("No real network request is allowed in this test.");
    };
    const response = await POST(
      new NextRequest("http://localhost:3000/api/waitlist", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          host: "localhost:3000",
          "content-type": "application/json",
          "x-forwarded-for": `waitlist-unconfigured-${crypto.randomUUID()}`,
        },
        body: JSON.stringify(signup),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("accepted", true);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(networkCalls).toBe(0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of previous)
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
});

test("waitlist API enforces its byte limit without a Content-Length header", async () => {
  const response = await POST(
    new NextRequest("http://localhost:3000/api/waitlist", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000",
        "content-type": "application/json",
        "x-forwarded-for": `waitlist-stream-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({ name: "x".repeat(5000) }),
    }),
  );
  expect(response.status).toBe(413);
  expect(await response.json()).not.toHaveProperty("accepted", true);
});

for (const { label, result, status, accepted } of [
  { label: "a confirmed Google message ID", result: { id: "mock-message-id" }, status: 200, accepted: true },
  { label: "a Google response missing its message ID", result: {}, status: 502, accepted: false },
]) {
  test(`waitlist API handles ${label} without a false confirmation`, async () => {
    const urls: string[] = [];
    await withMockedGmail(
      async (input, init) => {
        const url = new Request(input, init).url;
        urls.push(url);
        if (url === "https://oauth2.googleapis.com/token")
          return Response.json({ access_token: "mock-access-token" });
        if (url === "https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
          return Response.json(result);
        throw new Error("No real network request is allowed in this test.");
      },
      async () => {
        const response = await POST(waitlistRequest());
        expect(response.status).toBe(status);
        const body = await response.json();
        if (accepted) expect(body).toEqual({ accepted: true });
        else expect(body).not.toHaveProperty("accepted", true);
        expect(urls).toEqual([
          "https://oauth2.googleapis.com/token",
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        ]);
      },
    );
  });
}

test("simultaneous identical waitlist requests send one notification; changing the same reference fails", async () => {
  let tokenCalls = 0;
  let sendCalls = 0;
  let confirmDelivery!: () => void;
  const pendingDelivery = new Promise<void>((resolve) => {
    confirmDelivery = resolve;
  });
  const id = crypto.randomUUID();
  const ip = `waitlist-dedup-${crypto.randomUUID()}`;
  await withMockedGmail(
    async (input, init) => {
      const url = new Request(input, init).url;
      if (url === "https://oauth2.googleapis.com/token") {
        tokenCalls += 1;
        return Response.json({ access_token: "mock-access-token" });
      }
      if (url === "https://gmail.googleapis.com/gmail/v1/users/me/messages/send") {
        sendCalls += 1;
        await pendingDelivery;
        return Response.json({ id: "mock-deduplicated-message-id" });
      }
      throw new Error("No real network request is allowed in this test.");
    },
    async () => {
      const first = POST(waitlistRequest(signup, { id, ip }));
      const second = POST(waitlistRequest(signup, { id, ip }));
      try {
        await expect.poll(() => sendCalls).toBe(1);
      } finally {
        confirmDelivery();
      }
      const responses = await Promise.all([first, second]);
      for (const response of responses) {
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ accepted: true });
      }
      const changed = await POST(
        waitlistRequest({ ...signup, name: "Updated Founder" }, { id, ip }),
      );
      expect(changed.status).toBe(409);
      expect(await changed.json()).not.toHaveProperty("accepted", true);
      expect(tokenCalls).toBe(1);
      expect(sendCalls).toBe(1);
    },
  );
});

test("the seventh waitlist attempt from one IP is rate limited before Gmail", async () => {
  let tokenCalls = 0;
  let sendCalls = 0;
  const ip = `waitlist-rate-${crypto.randomUUID()}`;
  await withMockedGmail(
    async (input, init) => {
      const url = new Request(input, init).url;
      if (url === "https://oauth2.googleapis.com/token") {
        tokenCalls += 1;
        return Response.json({ access_token: "mock-access-token" });
      }
      if (url === "https://gmail.googleapis.com/gmail/v1/users/me/messages/send") {
        sendCalls += 1;
        return Response.json({ id: `mock-message-${sendCalls}` });
      }
      throw new Error("No real network request is allowed in this test.");
    },
    async () => {
      for (let attempt = 0; attempt < 6; attempt++) {
        const response = await POST(waitlistRequest(signup, { ip }));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ accepted: true });
      }
      const limited = await POST(waitlistRequest(signup, { ip }));
      expect(limited.status).toBe(429);
      expect(await limited.json()).not.toHaveProperty("accepted", true);
      expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
      expect(tokenCalls).toBe(6);
      expect(sendCalls).toBe(6);
    },
  );
});
