import { isValidWaitlistEmail, type WaitlistSignup } from "@/lib/waitlist";
import { validateLead, type Lead } from "@/lib/lead";
import type { TLSSocket } from "node:tls";

export type TestRequestSignup = Lead & {
  consent: true;
  source: "run-a-test";
};
type NotificationSignup = WaitlistSignup | TestRequestSignup;

export type GmailSMTPOptions = {
  host: "smtp.gmail.com";
  port: 465;
  secure: true;
  pool: false;
  auth: { user: string; pass: string };
  tls: { servername: "smtp.gmail.com"; rejectUnauthorized: true };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
  dnsTimeout: number;
  disableFileAccess: true;
  disableUrlAccess: true;
  logger: false;
  debug: false;
  transactionLog: false;
};

export type GmailSMTPMessage = {
  raw: Buffer;
  envelope: { from: string; to: string[] };
  disableFileAccess: true;
  disableUrlAccess: true;
};

export type GmailSMTPResult = {
  messageId?: unknown;
  accepted?: unknown;
  rejected?: unknown;
  response?: unknown;
};

export type GmailSMTPTransport = {
  sendMail(message: GmailSMTPMessage): Promise<GmailSMTPResult>;
  close(): void;
};

export type GmailSMTPTransportFactory = (
  options: GmailSMTPOptions,
) => GmailSMTPTransport | Promise<GmailSMTPTransport>;

export type GmailOptions = {
  fetch?: typeof globalThis.fetch;
  env?: Partial<NodeJS.ProcessEnv>;
  transportFactory?: GmailSMTPTransportFactory;
  // Allows fast mocked deadline checks. Production can never exceed 14 seconds.
  smtpTimeoutMs?: number;
};

const NOTIFICATION_TIMEOUT_MS = 14_000;

function appPassword(env: Partial<NodeJS.ProcessEnv>) {
  if (!env.GMAIL_APP_PASSWORD?.trim()) return undefined;
  // Google displays its app passwords in groups separated by ordinary spaces.
  const password = env.GMAIL_APP_PASSWORD.replace(/ /g, "");
  return /^[a-zA-Z0-9]{16}$/.test(password) ? password : null;
}

export class GmailNotificationError extends Error {
  constructor() {
    super("Gmail did not confirm the waitlist notification.");
    this.name = "GmailNotificationError";
  }
}

export function hasGmailConfiguration(
  env: Partial<NodeJS.ProcessEnv> = process.env,
) {
  if (
    !env.GMAIL_SENDER_EMAIL ||
    !isValidWaitlistEmail(env.GMAIL_SENDER_EMAIL) ||
    !env.WAITLIST_NOTIFY_EMAIL ||
    !isValidWaitlistEmail(env.WAITLIST_NOTIFY_EMAIL)
  )
    return false;
  const password = appPassword(env);
  if (password !== undefined) return password !== null;
  return Boolean(
    env.GOOGLE_CLIENT_ID?.trim() &&
    env.GOOGLE_CLIENT_SECRET?.trim() &&
    env.GOOGLE_REFRESH_TOKEN?.trim(),
  );
}

function notificationMime(
  signup: NotificationSignup,
  requestId: string,
  sender: string,
  recipient: string,
) {
  const submittedAt = new Date().toISOString();
  const body = [
    "A new person joined the Playground waitlist.",
    "",
    `Email: ${signup.email}`,
    `Name: ${signup.name || "Not provided"}`,
    `Product: ${signup.productUrl || "Not provided"}`,
    ...(signup.source === "run-a-test"
      ? [
          "",
          "Target customer:",
          signup.targetUser,
          "",
          "What to test:",
          signup.testGoal,
          "",
        ]
      : []),
    `Source: ${signup.source}`,
    `Submitted at: ${submittedAt}`,
    `Signup reference: ${requestId}`,
    "",
    "Consent: This person agreed to receive Playground early-access and launch updates.",
    "Reply to this email to contact the person who signed up.",
  ].join("\r\n");
  return [
    `From: Playground <${sender}>`,
    `To: ${recipient}`,
    `Reply-To: ${signup.email}`,
    "Subject: New Playground waitlist signup",
    `Date: ${new Date(submittedAt).toUTCString()}`,
    `Message-ID: <waitlist-${requestId}@${sender.split("@")[1]}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body, "utf8")
      .toString("base64")
      .match(/.{1,76}/g)!
      .join("\r\n"),
    "",
  ].join("\r\n");
}

const createSMTPTransport: GmailSMTPTransportFactory = async (options) => {
  // Load mail/TLS dependencies only in this server-side delivery path.
  const [nodemailer, tls] = await Promise.all([
    import("nodemailer"),
    import("node:tls"),
  ]);
  let socket: TLSSocket | undefined;
  let closed = false;
  const transport = nodemailer.default.createTransport({
    ...options,
    getSocket(_options, callback) {
      if (closed) return callback(new GmailNotificationError());
      // Nodemailer's non-pooled close() does not abort an active send. Own the
      // TLS socket so the shared deadline can stop every phase of delivery.
      socket = tls.connect({
        host: options.host,
        port: options.port,
        ...options.tls,
      });
      const connection = socket;
      const failed = () => {
        connection.destroy();
        callback(new GmailNotificationError());
      };
      connection.once("error", failed);
      connection.once("secureConnect", () => {
        connection.removeListener("error", failed);
        if (closed) {
          connection.destroy();
          return callback(new GmailNotificationError());
        }
        callback(null, { connection, secured: true });
      });
    },
  });
  return {
    sendMail: (message) => transport.sendMail(message),
    close() {
      closed = true;
      socket?.destroy();
      transport.close();
    },
  };
};

async function sendSMTPNotification(
  mime: string,
  env: Partial<NodeJS.ProcessEnv>,
  password: string,
  options: GmailOptions,
): Promise<{ messageId: string }> {
  const requestedTimeout = options.smtpTimeoutMs ?? NOTIFICATION_TIMEOUT_MS;
  if (!Number.isFinite(requestedTimeout) || requestedTimeout <= 0)
    throw new GmailNotificationError();
  const timeoutMs = Math.min(requestedTimeout, NOTIFICATION_TIMEOUT_MS);
  let transport: GmailSMTPTransport | undefined;
  let expired = false;
  let closed = false;
  const close = () => {
    if (!transport || closed) return;
    closed = true;
    try {
      transport.close();
    } catch {
      // Closing failures must never expose provider details or credentials.
    }
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      expired = true;
      close();
      reject(new GmailNotificationError());
    }, timeoutMs);
  });
  const delivery = async () => {
    transport = await (options.transportFactory ?? createSMTPTransport)({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: false,
      auth: { user: env.GMAIL_SENDER_EMAIL!, pass: password },
      tls: { servername: "smtp.gmail.com", rejectUnauthorized: true },
      connectionTimeout: timeoutMs,
      greetingTimeout: timeoutMs,
      socketTimeout: timeoutMs,
      dnsTimeout: timeoutMs,
      disableFileAccess: true,
      disableUrlAccess: true,
      logger: false,
      debug: false,
      transactionLog: false,
    });
    if (expired) {
      close();
      throw new GmailNotificationError();
    }
    return transport.sendMail({
      raw: Buffer.from(mime, "utf8"),
      envelope: {
        from: env.GMAIL_SENDER_EMAIL!,
        to: [env.WAITLIST_NOTIFY_EMAIL!],
      },
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  };
  try {
    const result = await Promise.race([delivery(), deadline]);
    if (
      !result ||
      typeof result.messageId !== "string" ||
      !result.messageId.trim() ||
      typeof result.response !== "string" ||
      !/^250(?:[ \t]|$)[^\r\n]*$/.test(result.response) ||
      !Array.isArray(result.accepted) ||
      result.accepted.length !== 1 ||
      result.accepted[0] !== env.WAITLIST_NOTIFY_EMAIL ||
      !Array.isArray(result.rejected) ||
      result.rejected.length !== 0
    )
      throw new GmailNotificationError();
    return { messageId: result.messageId };
  } finally {
    clearTimeout(timer);
    close();
  }
}

async function sendNotification(
  signup: NotificationSignup,
  requestId: string,
  options: GmailOptions = {},
): Promise<{ messageId: string }> {
  const env = options.env ?? process.env;
  if (
    !hasGmailConfiguration(env) ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(requestId) ||
    !isValidWaitlistEmail(signup.email)
  )
    throw new GmailNotificationError();
  try {
    const mime = notificationMime(
      signup,
      requestId,
      env.GMAIL_SENDER_EMAIL!,
      env.WAITLIST_NOTIFY_EMAIL!,
    );
    const password = appPassword(env);
    if (password)
      return await sendSMTPNotification(mime, env, password, options);
    const request = options.fetch ?? globalThis.fetch;
    const signal = AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS);
    const tokenResponse = await request("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        refresh_token: env.GOOGLE_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
      redirect: "error",
      signal,
    });
    if (!tokenResponse.ok) throw new GmailNotificationError();
    const token: unknown = await tokenResponse.json();
    if (
      !token ||
      typeof token !== "object" ||
      !("access_token" in token) ||
      typeof token.access_token !== "string" ||
      !token.access_token
    )
      throw new GmailNotificationError();

    const response = await request(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: Buffer.from(mime, "utf8").toString("base64url"),
        }),
        cache: "no-store",
        redirect: "error",
        signal,
      },
    );
    if (!response.ok) throw new GmailNotificationError();
    const result: unknown = await response.json();
    if (
      !result ||
      typeof result !== "object" ||
      !("id" in result) ||
      typeof result.id !== "string" ||
      !result.id.trim()
    )
      throw new GmailNotificationError();
    return { messageId: result.id };
  } catch {
    // Do not expose Google responses, bearer tokens, or credentials to the client/logs.
    throw new GmailNotificationError();
  }
}

// Imported only by server routes/pages. Google credentials never enter browser code.
export async function sendWaitlistNotification(
  signup: WaitlistSignup,
  requestId: string,
  options: GmailOptions = {},
): Promise<{ messageId: string }> {
  return sendNotification(signup, requestId, options);
}

export async function sendTestRequestNotification(
  signup: TestRequestSignup,
  requestId: string,
  options: GmailOptions = {},
): Promise<{ messageId: string }> {
  const validation = validateLead(signup);
  if (
    "error" in validation ||
    signup.consent !== true ||
    signup.source !== "run-a-test"
  )
    throw new GmailNotificationError();
  return sendNotification(
    { ...validation.lead, consent: true, source: "run-a-test" },
    requestId,
    options,
  );
}
