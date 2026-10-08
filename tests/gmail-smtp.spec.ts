import { test, expect } from "@playwright/test";
import {
  GmailNotificationError,
  hasGmailConfiguration,
  sendWaitlistNotification,
  type GmailSMTPMessage,
  type GmailSMTPOptions,
  type GmailSMTPResult,
  type GmailSMTPTransport,
  type GmailSMTPTransportFactory,
} from "../lib/gmail";
import type { WaitlistSignup } from "../lib/waitlist";

const env: Partial<NodeJS.ProcessEnv> = {
  GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop",
  GMAIL_SENDER_EMAIL: "playground@example.com",
  WAITLIST_NOTIFY_EMAIL: "notify@example.com",
};
const oauthEnv: Partial<NodeJS.ProcessEnv> = {
  GOOGLE_CLIENT_ID: "mock-client-id",
  GOOGLE_CLIENT_SECRET: "mock-client-secret",
  GOOGLE_REFRESH_TOKEN: "mock-refresh-token",
};
const signup: WaitlistSignup = {
  email: "founder@example.com",
  name: "Zoë Founder",
  productUrl: "https://example.com/prototype?cohort=beta",
  consent: true,
  source: "waitlist",
};
const requestId = "c020a330-0969-4d41-a7f5-02b358602fbb";
const confirmed: GmailSMTPResult = {
  messageId: "<mock-confirmed@example.com>",
  accepted: [env.WAITLIST_NOTIFY_EMAIL!],
  rejected: [],
  response: "250 2.0.0 OK mock-queue-id - gsmtp",
};

function mockSMTP(options: { result?: GmailSMTPResult; error?: Error; closeError?: Error } = {}) {
  const configurations: GmailSMTPOptions[] = [];
  const messages: GmailSMTPMessage[] = [];
  let closeCalls = 0;
  let googleCalls = 0;
  const transportFactory: GmailSMTPTransportFactory = (configuration) => {
    configurations.push(configuration);
    return {
      async sendMail(message) {
        messages.push(message);
        if (options.error) throw options.error;
        return options.result ?? confirmed;
      },
      close() {
        closeCalls += 1;
        if (options.closeError) throw options.closeError;
      },
    };
  };
  const fetch: typeof globalThis.fetch = async () => {
    googleCalls += 1;
    throw new Error("No Google request is allowed in this mocked SMTP test.");
  };
  return {
    transportFactory,
    fetch,
    configurations,
    messages,
    get closeCalls() { return closeCalls; },
    get googleCalls() { return googleCalls; },
  };
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
    env.GMAIL_APP_PASSWORD!,
    "abcdefghijklmnop",
    "mock-client-secret",
    "mock-refresh-token",
    "provider-secret-details",
  ]) expect((error as Error).message).not.toContain(secret);
}

async function withoutConsoleOutput(action: () => Promise<void>) {
  const methods = ["log", "info", "warn", "error", "debug"] as const;
  const originals = new Map(methods.map((method) => [method, console[method]]));
  const logs: unknown[][] = [];
  try {
    for (const method of methods) console[method] = (...values: unknown[]) => { logs.push(values); };
    await action();
  } finally {
    for (const [method, original] of originals) console[method] = original;
  }
  expect(logs).toEqual([]);
}

test("SMTP accepts 16-character app passwords, removes ordinary spaces and preserves case", async () => {
  for (const password of [
    "abcdefghijklmnop",
    "  abcd  efgh  ijkl  mnop  ",
    "AB12 CD34 EF56 GH78",
  ]) {
    const settings = { ...env, GMAIL_APP_PASSWORD: password };
    expect(hasGmailConfiguration(settings)).toBe(true);
    const transport = mockSMTP();
    await expect(
      sendWaitlistNotification(signup, requestId, { env: settings, ...transport }),
    ).resolves.toEqual({ messageId: confirmed.messageId });
    expect(transport.configurations[0].auth).toEqual({
      user: env.GMAIL_SENDER_EMAIL,
      pass: password.replace(/ /g, ""),
    });
    expect(transport.messages).toHaveLength(1);
    expect(transport.closeCalls).toBe(1);
    expect(transport.googleCalls).toBe(0);
  }
});

test("missing app password or invalid sender/recipient cannot create an SMTP transport", async () => {
  const invalid = [
    { ...env, GMAIL_APP_PASSWORD: undefined },
    { ...env, GMAIL_APP_PASSWORD: "" },
    { ...env, GMAIL_APP_PASSWORD: " \t\n " },
    { ...env, GMAIL_SENDER_EMAIL: undefined },
    { ...env, WAITLIST_NOTIFY_EMAIL: "not-an-email" },
    { ...env, GMAIL_SENDER_EMAIL: "sender@example.com\r\nBcc: attacker@example.com" },
  ];
  for (const settings of invalid) {
    expect(hasGmailConfiguration(settings)).toBe(false);
    const transport = mockSMTP();
    await expectGenericFailure(
      sendWaitlistNotification(signup, requestId, { env: settings, ...transport }),
    );
    expect(transport.configurations).toHaveLength(0);
    expect(transport.messages).toHaveLength(0);
    expect(transport.googleCalls).toBe(0);
  }
});

test("invalid nonblank app passwords fail closed even when OAuth credentials are present", async () => {
  for (const password of [
    "abcdefghijklmno",
    "abcdefghijklmnopq",
    "abcd-efghijklmno",
    "abcd\tefgh ijkl mnop",
    "abcd\nefgh ijkl mnop",
    "abcd\u200befghijklmnop",
  ]) {
    const settings = { ...env, ...oauthEnv, GMAIL_APP_PASSWORD: password };
    expect(hasGmailConfiguration(settings)).toBe(false);
    const transport = mockSMTP();
    await expectGenericFailure(
      sendWaitlistNotification(signup, requestId, { env: settings, ...transport }),
    );
    expect(transport.configurations).toHaveLength(0);
    expect(transport.messages).toHaveLength(0);
    expect(transport.googleCalls).toBe(0);
  }
});

test("absent or whitespace-only app passwords preserve the existing mocked OAuth path", async () => {
  for (const password of [undefined, "", " \t\n "]) {
    const settings = { ...env, ...oauthEnv, GMAIL_APP_PASSWORD: password };
    expect(hasGmailConfiguration(settings)).toBe(true);
    const transport = mockSMTP();
    const urls: string[] = [];
    const fetch: typeof globalThis.fetch = async (input, init) => {
      const url = new Request(input, init).url;
      urls.push(url);
      if (url === "https://oauth2.googleapis.com/token")
        return Response.json({ access_token: "mock-access-token" });
      if (url === "https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
        return Response.json({ id: "mock-google-message-id" });
      throw new Error("No real network request is allowed in this test.");
    };
    await expect(
      sendWaitlistNotification(signup, requestId, {
        env: settings,
        transportFactory: transport.transportFactory,
        fetch,
      }),
    ).resolves.toEqual({ messageId: "mock-google-message-id" });
    expect(urls).toEqual([
      "https://oauth2.googleapis.com/token",
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    ]);
    expect(transport.configurations).toHaveLength(0);
  }
});

test("SMTP uses verified Gmail TLS on port 465 and sends only a fixed raw notification envelope", async () => {
  const transport = mockSMTP();
  await withoutConsoleOutput(async () => {
    await expect(
      sendWaitlistNotification(signup, requestId, {
        env: { ...env, ...oauthEnv },
        ...transport,
      }),
    ).resolves.toEqual({ messageId: confirmed.messageId });
  });
  expect(transport.configurations).toHaveLength(1);
  const settings = transport.configurations[0];
  expect(settings).toMatchObject({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: false,
    tls: { servername: "smtp.gmail.com", rejectUnauthorized: true },
    logger: false,
    debug: false,
    transactionLog: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  for (const timeout of [settings.connectionTimeout, settings.greetingTimeout, settings.socketTimeout, settings.dnsTimeout]) {
    expect(timeout).toBeGreaterThan(0);
    expect(timeout).toBeLessThanOrEqual(14_000);
  }
  expect(settings).not.toHaveProperty("url");
  expect(settings).not.toHaveProperty("service");
  expect(transport.messages).toHaveLength(1);
  const message = transport.messages[0];
  expect(message.envelope).toEqual({
    from: env.GMAIL_SENDER_EMAIL,
    to: [env.WAITLIST_NOTIFY_EMAIL],
  });
  expect(message.disableFileAccess).toBe(true);
  expect(message.disableUrlAccess).toBe(true);
  expect(Buffer.isBuffer(message.raw)).toBe(true);
  const mime = message.raw.toString("utf8");
  const [headerBlock, encodedBody] = mime.split("\r\n\r\n");
  const headers = headerBlock.split("\r\n");
  expect(headers).toEqual(expect.arrayContaining([
    `From: Playground <${env.GMAIL_SENDER_EMAIL}>`,
    `To: ${env.WAITLIST_NOTIFY_EMAIL}`,
    `Reply-To: ${signup.email}`,
    "Subject: New Playground waitlist signup",
    `Message-ID: <waitlist-${requestId}@example.com>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ]));
  expect(headers.filter((header) => /^Reply-To:/i.test(header))).toHaveLength(1);
  expect(headers.some((header) => /^Bcc:/i.test(header))).toBe(false);
  const body = Buffer.from(encodedBody, "base64").toString("utf8");
  for (const line of [
    `Email: ${signup.email}`,
    `Name: ${signup.name}`,
    `Product: ${signup.productUrl}`,
    "Source: waitlist",
    `Signup reference: ${requestId}`,
    "Consent: This person agreed",
  ]) expect(body).toContain(line);
  expect(mime).not.toContain("abcdefghijklmnop");
  expect(mime).not.toContain(oauthEnv.GOOGLE_CLIENT_SECRET!);
  expect(transport.closeCalls).toBe(1);
  expect(transport.googleCalls).toBe(0);
});

for (const [label, fields] of [
  ["an intermediate 250 reply", { response: "250-2.0.0 Still processing" }],
  ["a non-250 reply", { response: "354 Start mail input" }],
  ["a misleading 250 prefix", { response: "2500 Not a final SMTP result" }],
  ["multiple response lines", { response: "250 OK\r\n550 Rejected" }],
  ["a missing response", { response: undefined }],
  ["no accepted recipient", { accepted: [] }],
  ["the wrong accepted recipient", { accepted: ["other@example.com"] }],
  ["an extra accepted recipient", { accepted: [env.WAITLIST_NOTIFY_EMAIL, "other@example.com"] }],
  ["a rejected recipient", { rejected: ["other@example.com"] }],
  ["a missing rejected list", { rejected: undefined }],
  ["a missing message ID", { messageId: undefined }],
  ["a blank message ID", { messageId: " " }],
  ["a non-string message ID", { messageId: 42 }],
] as const) {
  test(`SMTP cannot confirm signup with ${label}`, async () => {
    const transport = mockSMTP({ result: { ...confirmed, ...fields } });
    await withoutConsoleOutput(async () => {
      await expectGenericFailure(
        sendWaitlistNotification(signup, requestId, {
          env: { ...env, ...oauthEnv },
          ...transport,
        }),
      );
    });
    expect(transport.configurations).toHaveLength(1);
    expect(transport.messages).toHaveLength(1);
    expect(transport.closeCalls).toBe(1);
    expect(transport.googleCalls).toBe(0);
  });
}

for (const code of ["EAUTH", "ECONNECTION", "ETIMEDOUT"]) {
  test(`SMTP ${code} failures remain generic and close without retrying or using OAuth`, async () => {
    const transport = mockSMTP({
      error: Object.assign(new Error("provider-secret-details abcdefghijklmnop"), {
        code,
        response: "535 provider-secret-details",
      }),
    });
    await withoutConsoleOutput(async () => {
      await expectGenericFailure(
        sendWaitlistNotification(signup, requestId, {
          env: { ...env, ...oauthEnv },
          ...transport,
        }),
      );
    });
    expect(transport.configurations).toHaveLength(1);
    expect(transport.messages).toHaveLength(1);
    expect(transport.closeCalls).toBe(1);
    expect(transport.googleCalls).toBe(0);
  });
}

test("SMTP factory failures do not expose credentials or fall through to OAuth", async () => {
  for (const asynchronous of [false, true]) {
    let factoryCalls = 0;
    const transport = mockSMTP();
    const transportFactory: GmailSMTPTransportFactory = () => {
      factoryCalls += 1;
      const failure = new Error("provider-secret-details abcdefghijklmnop");
      if (asynchronous) return Promise.reject(failure);
      throw failure;
    };
    await withoutConsoleOutput(async () => {
      await expectGenericFailure(
        sendWaitlistNotification(signup, requestId, {
          env: { ...env, ...oauthEnv },
          transportFactory,
          fetch: transport.fetch,
        }),
      );
    });
    expect(factoryCalls).toBe(1);
    expect(transport.googleCalls).toBe(0);
  }
});

test("SMTP deadline closes an in-flight send exactly once and does not confirm late completion", async () => {
  let sendCalls = 0;
  let closeCalls = 0;
  let completeSend!: (value: GmailSMTPResult) => void;
  const transport = mockSMTP();
  const transportFactory: GmailSMTPTransportFactory = () => ({
    sendMail() {
      sendCalls += 1;
      return new Promise((resolve) => { completeSend = resolve; });
    },
    close() { closeCalls += 1; },
  });
  await withoutConsoleOutput(async () => {
    await expectGenericFailure(
      sendWaitlistNotification(signup, requestId, {
        env: { ...env, ...oauthEnv },
        transportFactory,
        fetch: transport.fetch,
        smtpTimeoutMs: 20,
      }),
    );
    completeSend(confirmed);
    await Promise.resolve();
  });
  expect(sendCalls).toBe(1);
  expect(closeCalls).toBe(1);
  expect(transport.googleCalls).toBe(0);
});

test("a transport created after the SMTP deadline is closed without sending", async () => {
  let provideTransport!: (transport: GmailSMTPTransport) => void;
  let sendCalls = 0;
  let closeCalls = 0;
  const transport = mockSMTP();
  const transportFactory: GmailSMTPTransportFactory = () =>
    new Promise((resolve) => { provideTransport = resolve; });
  await withoutConsoleOutput(async () => {
    await expectGenericFailure(
      sendWaitlistNotification(signup, requestId, {
        env: { ...env, ...oauthEnv },
        transportFactory,
        fetch: transport.fetch,
        smtpTimeoutMs: 20,
      }),
    );
    provideTransport({
      async sendMail() { sendCalls += 1; return confirmed; },
      close() { closeCalls += 1; },
    });
    await expect.poll(() => closeCalls).toBe(1);
  });
  expect(sendCalls).toBe(0);
  expect(transport.googleCalls).toBe(0);
});

test("SMTP never exceeds its production deadline and rejects invalid deadlines before opening transport", async () => {
  const capped = mockSMTP();
  await sendWaitlistNotification(signup, requestId, {
    env,
    ...capped,
    smtpTimeoutMs: 60_000,
  });
  const settings = capped.configurations[0];
  for (const timeout of [settings.connectionTimeout, settings.greetingTimeout, settings.socketTimeout, settings.dnsTimeout])
    expect(timeout).toBe(14_000);
  expect(capped.closeCalls).toBe(1);
  for (const smtpTimeoutMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const transport = mockSMTP();
    await expectGenericFailure(
      sendWaitlistNotification(signup, requestId, { env, ...transport, smtpTimeoutMs }),
    );
    expect(transport.configurations).toHaveLength(0);
    expect(transport.googleCalls).toBe(0);
  }
});

test("confirmed SMTP delivery remains confirmed when transport cleanup throws", async () => {
  const transport = mockSMTP({
    closeError: new Error("provider-secret-details abcdefghijklmnop"),
  });
  await withoutConsoleOutput(async () => {
    await expect(
      sendWaitlistNotification(signup, requestId, { env, ...transport }),
    ).resolves.toEqual({ messageId: confirmed.messageId });
  });
  expect(transport.closeCalls).toBe(1);
  expect(transport.messages).toHaveLength(1);
  expect(transport.googleCalls).toBe(0);
});
