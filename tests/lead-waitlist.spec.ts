import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { NextRequest } from "next/server";
import { POST } from "../app/api/lead/route";
import {
  sendTestRequestNotification,
  type GmailSMTPMessage,
  type GmailSMTPOptions,
} from "../lib/gmail";

const consentLabel =
  "Add me to the Playground waitlist for early-access and launch updates.";
const confirmation = "BRIEF RECEIVED / WAITLIST CONFIRMED";
const unconfirmed =
  "We couldn’t confirm your brief or waitlist signup. Please try again.";
const brief = {
  name: "Zoë Founder",
  email: "founder@example.com",
  productUrl: "https://example.com/prototype?cohort=beta",
  phone: "+44 (0)20 7946 0958 ext. 12",
  socialProfile: "Instagram: @testfounder",
  targetUser: "Freelance illustrators managing recurring invoices.",
  testGoal:
    "Do users trust automatic sending?\nDo they review the preview first?",
};
const submission = { ...brief, website: "", consent: true };
const gmailSettings: Partial<NodeJS.ProcessEnv> = {
  GOOGLE_CLIENT_ID: "mock-client-id",
  GOOGLE_CLIENT_SECRET: "mock-client-secret",
  GOOGLE_REFRESH_TOKEN: "mock-refresh-token",
  GMAIL_SENDER_EMAIL: "playground@example.com",
  WAITLIST_NOTIFY_EMAIL: "notify@example.com",
};
const environmentKeys = [
  ...Object.keys(gmailSettings),
  "GMAIL_APP_PASSWORD",
  "LEAD_WEBHOOK_URL",
];

async function fillBrief(page: Page, consent = true) {
  await page.getByLabel("Name", { exact: true }).fill(brief.name);
  await page.getByLabel("Email", { exact: true }).fill(brief.email);
  await page.getByLabel("Product or prototype link").fill(brief.productUrl);
  await page.getByLabel("Who is it for?").fill(brief.targetUser);
  await page.getByLabel("What do you want to find out?").fill(brief.testGoal);
  await page.getByLabel("Phone number (optional)", { exact: true }).fill(brief.phone);
  await page.getByLabel("LinkedIn or social profile (optional)", { exact: true }).fill(brief.socialProfile);
  if (consent) await page.getByRole("checkbox", { name: consentLabel }).check();
}

async function expectPreservedBrief(page: Page) {
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(brief.name);
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(brief.email);
  await expect(page.getByLabel("Product or prototype link")).toHaveValue(brief.productUrl);
  await expect(page.getByLabel("Who is it for?")).toHaveValue(brief.targetUser);
  await expect(page.getByLabel("What do you want to find out?")).toHaveValue(brief.testGoal);
  await expect(page.getByLabel("Phone number (optional)", { exact: true })).toHaveValue(brief.phone);
  await expect(page.getByLabel("LinkedIn or social profile (optional)", { exact: true })).toHaveValue(brief.socialProfile);
  await expect(page.getByRole("checkbox", { name: consentLabel })).toBeChecked();
  await expect(page.getByText(confirmation, { exact: true })).toHaveCount(0);
}

function leadRequest(body: unknown = submission, options: { id?: string; ip?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest("http://localhost:3000/api/lead", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "content-type": "application/json",
      "x-forwarded-for": options.ip ?? `lead-test-${crypto.randomUUID()}`,
      "idempotency-key": options.id ?? crypto.randomUUID(),
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

async function withMockedGmail(fetch: typeof globalThis.fetch, action: () => Promise<void>, configured = true) {
  const previous = new Map(environmentKeys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  try {
    for (const key of environmentKeys) delete process.env[key];
    if (configured) Object.assign(process.env, gmailSettings);
    // The retired webhook must never enable intake or receive a full brief.
    process.env.LEAD_WEBHOOK_URL = "https://legacy-webhook.example/retired";
    globalThis.fetch = fetch;
    await action();
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of previous)
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
}

function mockGoogle(options: { token?: () => Response; send?: () => Response } = {}) {
  const calls: { url: string; headers: Headers; body: string }[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    calls.push({ url: request.url, headers: request.headers, body: await request.text() });
    if (request.url === "https://oauth2.googleapis.com/token")
      return options.token?.() ?? Response.json({ access_token: "mock-access-token" });
    if (request.url === "https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
      return options.send?.() ?? Response.json({ id: "mock-confirmed-message-id" });
    throw new Error("No real network request is allowed in this test.");
  };
  return { fetch, calls };
}

test("a failed test request keeps the full brief and explicit waitlist consent", async ({ page }) => {
  let payload: unknown;
  await page.route("**/api/lead", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 502, json: { error: "Google delivery was not confirmed." } });
  });
  await page.goto("/run-a-test");
  await fillBrief(page);
  await page.getByRole("button", { name: "Send your brief", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(unconfirmed);
  await expectPreservedBrief(page);
  await expect(page.getByRole("button", { name: "Send your brief", exact: true })).toBeEnabled();
  expect(payload).toMatchObject(submission);
});

for (const { status, body } of [
  { status: 200, body: { delivered: true } },
  { status: 200, body: { waitlisted: true } },
  { status: 200, body: { delivered: true, waitlisted: "true" } },
  { status: 200, body: { delivered: "true", waitlisted: true } },
  { status: 502, body: { delivered: true, waitlisted: true } },
]) {
  test(`test-request UI rejects unconfirmed ${status} response ${JSON.stringify(body)}`, async ({ page }) => {
    await page.route("**/api/lead", (route) => route.fulfill({ status, json: body }));
    await page.goto("/run-a-test");
    await fillBrief(page);
    await page.getByRole("button", { name: "Send your brief", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText(unconfirmed);
    await expectPreservedBrief(page);
  });
}

test("saving a complete brief works without waitlist consent and never posts it", async ({ page }) => {
  let posts = 0;
  await page.route("**/api/lead", (route) => {
    posts += 1;
    return route.abort();
  });
  await page.goto("/run-a-test");
  await fillBrief(page, false);
  await expect(page.getByRole("checkbox", { name: consentLabel })).not.toBeChecked();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save a copy of your brief" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("playground-test-brief.txt");
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const saved = Buffer.concat(chunks).toString("utf8");
  for (const value of Object.values(brief)) expect(saved).toContain(value);
  expect(saved).toContain("It has not been sent to Playground.");
  expect(posts).toBe(0);
  await expect(page.getByRole("checkbox", { name: consentLabel })).not.toBeChecked();
});

test("mobile test-request confirmation is focused and preserves success when analytics throws", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.addInitScript(() => {
    window.playgroundAnalytics = () => { throw new Error("Analytics unavailable."); };
  });
  await page.route("**/api/lead", (route) =>
    route.fulfill({ json: { delivered: true, waitlisted: true } }),
  );
  await page.goto("/run-a-test");
  await fillBrief(page);
  await page.getByRole("button", { name: "Send your brief", exact: true }).focus();
  await page.keyboard.press("Enter");
  const success = page.getByRole("status", { name: "You’re on the waitlist." });
  await expect(success).toContainText(confirmation);
  await expect(success).toBeFocused();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map((violation) => violation.id)).toEqual([]);
});

test("the mobile form and its error remain accessible with text at 200%", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.route("**/api/lead", (route) => route.fulfill({ status: 502, json: { error: unconfirmed } }));
  await page.goto("/run-a-test");
  await fillBrief(page);
  await page.addStyleTag({ content: "html{font-size:200%}" });
  await page.getByRole("button", { name: "Send your brief", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(unconfirmed);
  await expectPreservedBrief(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) }))).toEqual([]);
});

test("lead API sends all five brief fields, source and consent before returning both confirmations", async () => {
  const google = mockGoogle();
  const id = crypto.randomUUID();
  await withMockedGmail(google.fetch, async () => {
    const response = await POST(leadRequest(submission, { id }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ delivered: true, waitlisted: true });
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(google.calls.map((call) => call.url)).toEqual([
      "https://oauth2.googleapis.com/token",
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    ]);
    const send = google.calls[1];
    expect(send.headers.get("authorization")).toBe("Bearer mock-access-token");
    const payload = JSON.parse(send.body) as { raw: string };
    const mime = Buffer.from(payload.raw, "base64url").toString("utf8");
    const [headerBlock, encodedBody] = mime.split("\r\n\r\n");
    expect(headerBlock.split("\r\n")).toEqual(expect.arrayContaining([
      `From: Playground <${gmailSettings.GMAIL_SENDER_EMAIL}>`,
      `To: ${gmailSettings.WAITLIST_NOTIFY_EMAIL}`,
      `Reply-To: ${brief.email}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
    ]));
    const body = Buffer.from(encodedBody, "base64").toString("utf8");
    for (const value of Object.values(brief))
      expect(body.replace(/\r\n/g, "\n")).toContain(value.replace(/\r\n/g, "\n"));
    expect(body).toContain("Target customer:");
    expect(body).toContain("What to test:");
    expect(body).toContain("Source: run-a-test");
    expect(body).toContain(`Signup reference: ${id}`);
    expect(body).toContain("Consent:");
    expect(body).toContain("early-access and launch updates");
    expect(mime).not.toContain(gmailSettings.GOOGLE_CLIENT_SECRET!);
    expect(mime).not.toContain(gmailSettings.GOOGLE_REFRESH_TOKEN!);
  });
});

test("lead API requires literal waitlist consent and rejects invalid email before calling Google", async () => {
  const google = mockGoogle();
  await withMockedGmail(google.fetch, async () => {
    for (const body of [
      { ...submission, consent: undefined },
      { ...submission, consent: false },
      { ...submission, consent: "true" },
      { ...submission, consent: 1 },
      { ...submission, email: "invalid" },
      { ...submission, email: "founder@example.com\r\nBcc: attacker@example.com" },
    ]) {
      const response = await POST(leadRequest(body));
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result).not.toHaveProperty("delivered", true);
      expect(result).not.toHaveProperty("waitlisted", true);
    }
    expect(google.calls).toHaveLength(0);
  });
});

test("lead API protects its origin, content type, honeypot, body limit and request reference", async () => {
  const google = mockGoogle();
  await withMockedGmail(google.fetch, async () => {
    const cases: { body: unknown; headers: Record<string, string>; status: number }[] = [
      { body: submission, headers: { origin: "" }, status: 403 },
      { body: submission, headers: { origin: "https://foreign.example" }, status: 403 },
      { body: submission, headers: { "sec-fetch-site": "cross-site" }, status: 403 },
      { body: submission, headers: { "content-type": "text/plain" }, status: 415 },
      { body: { ...submission, website: "bot-filled" }, headers: {}, status: 400 },
      { body: { name: "x".repeat(17_000) }, headers: {}, status: 413 },
      { body: submission, headers: { "idempotency-key": "short" }, status: 400 },
    ];
    for (const { body, headers, status } of cases) {
      const response = await POST(leadRequest(body, { headers }));
      expect(response.status).toBe(status);
      expect(await response.json()).not.toHaveProperty("delivered", true);
    }
    expect(google.calls).toHaveLength(0);
  });
});

for (const [label, options] of [
  ["a missing Google message ID", { send: () => Response.json({}) }],
  ["a failed Google send", { send: () => Response.json({ error: "provider-secret-details" }, { status: 403 }) }],
  ["a failed refresh grant", { token: () => Response.json({ error: "provider-secret-details" }, { status: 400 }) }],
] as const) {
  test(`lead API never claims delivery or waitlisting after ${label}`, async () => {
    const google = mockGoogle(options);
    await withMockedGmail(google.fetch, async () => {
      const response = await POST(leadRequest());
      expect(response.status).toBe(502);
      const body = await response.json();
      expect(body).not.toHaveProperty("delivered", true);
      expect(body).not.toHaveProperty("waitlisted", true);
      expect(JSON.stringify(body)).not.toContain("provider-secret-details");
      expect(JSON.stringify(body)).not.toContain(gmailSettings.GOOGLE_REFRESH_TOKEN!);
    });
  });
}

test("a legacy webhook cannot enable lead intake without Gmail configuration", async () => {
  const google = mockGoogle();
  await withMockedGmail(google.fetch, async () => {
    const response = await POST(leadRequest());
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).not.toHaveProperty("delivered", true);
    expect(body).not.toHaveProperty("waitlisted", true);
    expect(google.calls).toHaveLength(0);
  }, false);
});

test("concurrent identical briefs and unchanged retries deliver once; changing the same reference is rejected", async () => {
  let tokenCalls = 0;
  let sendCalls = 0;
  let confirmDelivery!: () => void;
  const pendingDelivery = new Promise<void>((resolve) => { confirmDelivery = resolve; });
  const id = crypto.randomUUID();
  const ip = `lead-dedup-${crypto.randomUUID()}`;
  const fetch: typeof globalThis.fetch = async (input, init) => {
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
  };
  await withMockedGmail(fetch, async () => {
    const first = POST(leadRequest(submission, { id, ip }));
    const second = POST(leadRequest(submission, { id, ip }));
    try { await expect.poll(() => sendCalls).toBe(1); }
    finally { confirmDelivery(); }
    for (const response of await Promise.all([first, second])) {
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ delivered: true, waitlisted: true });
    }
    const retry = await POST(leadRequest(submission, { id, ip }));
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({ delivered: true, waitlisted: true });
    const changed = await POST(leadRequest({ ...submission, testGoal: "An updated mission." }, { id, ip }));
    expect(changed.status).toBe(409);
    expect(await changed.json()).not.toHaveProperty("waitlisted", true);
    expect(tokenCalls).toBe(1);
    expect(sendCalls).toBe(1);
  });
});

test("a failed Google confirmation can retry the unchanged brief with its original reference", async () => {
  let sendCalls = 0;
  const google = mockGoogle({ send: () => Response.json(++sendCalls === 1 ? {} : { id: "mock-retry-confirmed-id" }) });
  const id = crypto.randomUUID();
  const ip = `lead-retry-${crypto.randomUUID()}`;
  await withMockedGmail(google.fetch, async () => {
    const failure = await POST(leadRequest(submission, { id, ip }));
    expect(failure.status).toBe(502);
    expect(await failure.json()).not.toHaveProperty("waitlisted", true);
    const retry = await POST(leadRequest(submission, { id, ip }));
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({ delivered: true, waitlisted: true });
    expect(sendCalls).toBe(2);
    expect(google.calls).toHaveLength(4);
  });
});

test("the full brief over mocked SMTP notifies only the owner and preserves Unicode, multiline details and consent", async () => {
  const messages: GmailSMTPMessage[] = [];
  const configurations: GmailSMTPOptions[] = [];
  let googleCalls = 0;
  let closeCalls = 0;
  const id = crypto.randomUUID();
  const sender = gmailSettings.GMAIL_SENDER_EMAIL!;
  const owner = gmailSettings.WAITLIST_NOTIFY_EMAIL!;
  await expect(
    sendTestRequestNotification(
      { ...brief, consent: true, source: "run-a-test" },
      id,
      {
        env: { ...gmailSettings, GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" },
        fetch: async () => {
          googleCalls += 1;
          throw new Error("No Google request is allowed in this mocked SMTP test.");
        },
        transportFactory(options) {
          configurations.push(options);
          return {
            async sendMail(message) {
              messages.push(message);
              return {
                messageId: "<mock-test-brief@example.com>",
                accepted: [owner],
                rejected: [],
                response: "250 2.0.0 OK mock-queue-id - gsmtp",
              };
            },
            close() { closeCalls += 1; },
          };
        },
      },
    ),
  ).resolves.toEqual({ messageId: "<mock-test-brief@example.com>" });
  expect(configurations).toHaveLength(1);
  expect(configurations[0].auth).toEqual({ user: sender, pass: "abcdefghijklmnop" });
  expect(messages).toHaveLength(1);
  expect(messages[0].envelope).toEqual({ from: sender, to: [owner] });
  const [headerBlock, encodedBody] = messages[0].raw.toString("utf8").split("\r\n\r\n");
  const headers = headerBlock.split("\r\n");
  expect(headers).toEqual(expect.arrayContaining([
    `From: Playground <${sender}>`,
    `To: ${owner}`,
    `Reply-To: ${brief.email}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ]));
  expect(headers.some((header) => /^Bcc:/i.test(header))).toBe(false);
  const body = Buffer.from(encodedBody, "base64").toString("utf8").replace(/\r\n/g, "\n");
  for (const value of Object.values(brief)) expect(body).toContain(value);
  expect(body).toContain("Target customer:");
  expect(body).toContain("What to test:");
  expect(body).toContain("Source: run-a-test");
  expect(body).toContain(`Signup reference: ${id}`);
  expect(body).toContain("Consent: This person agreed");
  expect(body).toContain("early-access and launch updates");
  expect(body).not.toContain("abcdefghijklmnop");
  expect(closeCalls).toBe(1);
  expect(googleCalls).toBe(0);
});
