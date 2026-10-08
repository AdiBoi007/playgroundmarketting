import { test, expect } from "@playwright/test";
import {
  GmailNotificationError,
  hasGmailConfiguration,
  sendWaitlistNotification,
} from "../lib/gmail";
import type { WaitlistSignup } from "../lib/waitlist";

const tokenURL = "https://oauth2.googleapis.com/token";
const sendURL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const env: Partial<NodeJS.ProcessEnv> = {
  GOOGLE_CLIENT_ID: "mock-client-id",
  GOOGLE_CLIENT_SECRET: "mock-client-secret",
  GOOGLE_REFRESH_TOKEN: "mock-refresh-token",
  GMAIL_SENDER_EMAIL: "playground@example.com",
  WAITLIST_NOTIFY_EMAIL: "notify@example.com",
};
const signup: WaitlistSignup = {
  email: "founder@example.com",
  name: "Zoë Founder",
  productUrl: "https://example.com/prototype?cohort=beta",
  consent: true,
  source: "waitlist",
};
const requestId = "c020a330-0969-4d41-a7f5-02b358602fbb";

type HTTPCall = {
  url: string;
  method: string;
  headers: Headers;
  body: string;
  cache: RequestCache;
  redirect: RequestRedirect;
};

function mockMailTransport(options: { token?: Response; send?: Response } = {}) {
  const calls: HTTPCall[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    calls.push({
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: await request.text(),
      cache: request.cache,
      redirect: request.redirect,
    });
    if (request.url === tokenURL)
      return (
        options.token ??
        Response.json({
          access_token: "mock-access-token",
          token_type: "Bearer",
          scope: "https://www.googleapis.com/auth/gmail.send",
        })
      );
    if (request.url === sendURL)
      return options.send ?? Response.json({ id: "confirmed-google-message-id" });
    throw new Error(`Unexpected request in mocked transport: ${request.url}`);
  };
  return { fetch, calls };
}

async function expectGenericFailure(operation: Promise<unknown>) {
  const error: unknown = await operation.then(
    () => null,
    (failure: unknown) => failure,
  );
  expect(error).toBeInstanceOf(GmailNotificationError);
  expect((error as Error).message).toBe(
    "Gmail did not confirm the waitlist notification.",
  );
  for (const secret of [
    env.GOOGLE_CLIENT_SECRET!,
    env.GOOGLE_REFRESH_TOKEN!,
    "mock-access-token",
    "provider-secret-details",
  ])
    expect((error as Error).message).not.toContain(secret);
}

test("Gmail configuration requires all five valid server-side settings", () => {
  expect(hasGmailConfiguration(env)).toBe(true);
  expect(hasGmailConfiguration({})).toBe(false);
  for (const key of Object.keys(env))
    expect(hasGmailConfiguration({ ...env, [key]: undefined }), key).toBe(false);
  for (const key of [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
  ])
    expect(hasGmailConfiguration({ ...env, [key]: "   " }), key).toBe(false);
  expect(
    hasGmailConfiguration({
      ...env,
      GMAIL_SENDER_EMAIL: "sender@example.com\r\nBcc: attacker@example.com",
    }),
  ).toBe(false);
  expect(
    hasGmailConfiguration({ ...env, WAITLIST_NOTIFY_EMAIL: "not-an-email" }),
  ).toBe(false);
});

test("Gmail refreshes OAuth credentials and sends the exact MIME notification", async () => {
  const transport = mockMailTransport();
  await expect(
    sendWaitlistNotification(signup, requestId, { env, fetch: transport.fetch }),
  ).resolves.toEqual({ messageId: "confirmed-google-message-id" });
  expect(transport.calls.map((call) => call.url)).toEqual([tokenURL, sendURL]);
  const [token, send] = transport.calls;
  expect(token.method).toBe("POST");
  expect(token.headers.get("content-type")).toBe(
    "application/x-www-form-urlencoded",
  );
  const tokenFields = new URLSearchParams(token.body);
  expect(Object.fromEntries(tokenFields)).toEqual({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  expect(send.method).toBe("POST");
  expect(send.headers.get("authorization")).toBe("Bearer mock-access-token");
  expect(send.headers.get("content-type")).toBe("application/json");
  for (const call of transport.calls) {
    expect(call.cache).toBe("no-store");
    expect(call.redirect).toBe("error");
  }
  const payload = JSON.parse(send.body) as { raw: string };
  expect(Object.keys(payload)).toEqual(["raw"]);
  expect(payload.raw).toMatch(/^[A-Za-z0-9_-]+$/);
  const mime = Buffer.from(payload.raw, "base64url").toString("utf8");
  const [headerBlock, encodedBody] = mime.split("\r\n\r\n");
  const headers = headerBlock.split("\r\n");
  expect(headers).toEqual(
    expect.arrayContaining([
      `From: Playground <${env.GMAIL_SENDER_EMAIL}>`,
      `To: ${env.WAITLIST_NOTIFY_EMAIL}`,
      `Reply-To: ${signup.email}`,
      "Subject: New Playground waitlist signup",
      `Message-ID: <waitlist-${requestId}@example.com>`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
    ]),
  );
  expect(headers.filter((header) => header.startsWith("Reply-To:"))).toHaveLength(1);
  expect(headers.some((header) => /^Bcc:/i.test(header))).toBe(false);
  const body = Buffer.from(encodedBody, "base64").toString("utf8");
  expect(body).toContain(`Email: ${signup.email}`);
  expect(body).toContain(`Name: ${signup.name}`);
  expect(body).toContain(`Product: ${signup.productUrl}`);
  expect(body).toContain("Source: waitlist");
  expect(body).toContain(`Signup reference: ${requestId}`);
  expect(body).toContain("Consent: This person agreed");
  expect(mime).not.toContain(env.GOOGLE_CLIENT_SECRET!);
  expect(mime).not.toContain(env.GOOGLE_REFRESH_TOKEN!);
});

test("Gmail does not request a token for missing configuration or injected headers", async () => {
  const transport = mockMailTransport();
  await expectGenericFailure(
    sendWaitlistNotification(signup, requestId, { env: {}, fetch: transport.fetch }),
  );
  await expectGenericFailure(
    sendWaitlistNotification(
      { ...signup, email: "founder@example.com\r\nBcc: attacker@example.com" },
      requestId,
      { env, fetch: transport.fetch },
    ),
  );
  await expectGenericFailure(
    sendWaitlistNotification(signup, "unsafe\r\nreference", {
      env,
      fetch: transport.fetch,
    }),
  );
  expect(transport.calls).toHaveLength(0);
});

for (const [label, response] of [
  [
    "a rejected refresh grant",
    () =>
      Response.json(
        { error: "invalid_grant", error_description: "provider-secret-details" },
        { status: 400 },
      ),
  ],
  ["a missing access token", () => Response.json({ token_type: "Bearer" })],
  ["an empty access token", () => Response.json({ access_token: "" })],
  ["a non-string access token", () => Response.json({ access_token: 42 })],
  ["invalid token JSON", () => new Response("provider-secret-details")],
] as const) {
  test(`Gmail fails closed for ${label} and never attempts delivery`, async () => {
    const transport = mockMailTransport({ token: response() });
    await expectGenericFailure(
      sendWaitlistNotification(signup, requestId, { env, fetch: transport.fetch }),
    );
    expect(transport.calls.map((call) => call.url)).toEqual([tokenURL]);
  });
}

for (const [label, response] of [
  [
    "insufficient send permission",
    () =>
      Response.json(
        { error: { code: 403, message: "provider-secret-details" } },
        { status: 403 },
      ),
  ],
  ["a Google service failure", () => new Response("provider-secret-details", { status: 500 })],
  ["a missing message ID", () => Response.json({})],
  ["an empty message ID", () => Response.json({ id: "" })],
  ["a blank message ID", () => Response.json({ id: " " })],
  ["a non-string message ID", () => Response.json({ id: 42 })],
  ["invalid delivery JSON", () => new Response("provider-secret-details")],
] as const) {
  test(`Gmail does not confirm delivery for ${label}`, async () => {
    const transport = mockMailTransport({ send: response() });
    await expectGenericFailure(
      sendWaitlistNotification(signup, requestId, { env, fetch: transport.fetch }),
    );
    expect(transport.calls.map((call) => call.url)).toEqual([tokenURL, sendURL]);
  });
}

test("Gmail turns a transport failure into a generic error without retrying", async () => {
  let calls = 0;
  const fetch: typeof globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return Response.json({ access_token: "mock-access-token" });
    throw new Error(`provider-secret-details ${env.GOOGLE_CLIENT_SECRET}`);
  };
  await expectGenericFailure(
    sendWaitlistNotification(signup, requestId, { env, fetch }),
  );
  expect(calls).toBe(2);
});
