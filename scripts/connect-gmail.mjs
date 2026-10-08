import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { constants } from "node:fs";
import { access, open, rename, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

export const CALLBACK_URI = "http://localhost:8739/oauth/callback";
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";
export const VERCEL_SCOPE = "adhirajs-projects-b084f0d3";
const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONNECTION_ERROR =
  "Gmail connection could not be completed. Run the helper again to retry.";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

function fail() {
  throw new Error(CONNECTION_ERROR);
}
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const privateToken = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 8192 &&
  /^[A-Za-z0-9._~+/=-]+$/.test(value);

export function readConfiguration(env = process.env) {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const sender = env.GMAIL_SENDER_EMAIL?.trim().toLowerCase();
  if (
    !clientId ||
    !clientSecret ||
    !sender ||
    /[\u0000-\u001f\u007f]/.test(clientId + clientSecret) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender)
  )
    throw new Error(
      "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GMAIL_SENDER_EMAIL in the ignored .env.local file first.",
    );
  return { clientId, clientSecret, sender };
}

export function createAuthorization(config) {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: CALLBACK_URI,
    response_type: "code",
    scope: `openid email ${GMAIL_SCOPE}`,
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    login_hint: config.sender,
    access_type: "offline",
    prompt: "consent",
  }).toString();
  return { state, verifier, authorizationUrl: url.href };
}

export function statesMatch(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string" || !expected)
    return false;
  // Fixed-size digests let even an incorrectly sized state use a constant-time comparison.
  return timingSafeEqual(
    createHash("sha256").update(received).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

export function readCallback(request, expectedState) {
  if (
    request.method !== "GET" ||
    request.socket.remoteAddress !== "127.0.0.1" ||
    request.headers.host?.toLowerCase() !== "localhost:8739"
  )
    fail();
  if (
    request.headers.origin &&
    request.headers.origin !== new URL(CALLBACK_URI).origin
  )
    fail();
  let url;
  try {
    url = new URL(request.url, CALLBACK_URI);
  } catch {
    fail();
  }
  if (
    url.origin !== new URL(CALLBACK_URI).origin ||
    url.pathname !== "/oauth/callback" ||
    url.hash ||
    url.searchParams.getAll("state").length !== 1 ||
    !statesMatch(url.searchParams.get("state"), expectedState)
  )
    fail();
  if (url.searchParams.has("error")) return { denied: true };
  const code = url.searchParams.get("code");
  if (
    url.searchParams.getAll("code").length !== 1 ||
    !code ||
    code.length > 4096 ||
    /[\u0000-\u0020\u007f]/.test(code)
  )
    fail();
  return { code };
}

export function validateGrant(grant) {
  if (
    !object(grant) ||
    !privateToken(grant.access_token) ||
    !privateToken(grant.refresh_token) ||
    grant.token_type?.toLowerCase() !== "bearer" ||
    typeof grant.scope !== "string" ||
    !grant.scope.split(/\s+/).includes(GMAIL_SCOPE)
  )
    fail();
  return { accessToken: grant.access_token, refreshToken: grant.refresh_token };
}

export function validateAccount(account, sender) {
  if (
    !object(account) ||
    account.email_verified !== true ||
    typeof account.email !== "string" ||
    account.email.trim().toLowerCase() !== sender.trim().toLowerCase()
  )
    fail();
}

export async function exchangeGrant(
  code,
  authorization,
  config,
  request = globalThis.fetch,
  cancellation,
) {
  const signal = AbortSignal.any([
    AbortSignal.timeout(15_000),
    ...(cancellation ? [cancellation] : []),
  ]);
  try {
    const response = await request(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        code_verifier: authorization.verifier,
        grant_type: "authorization_code",
        redirect_uri: CALLBACK_URI,
      }),
      cache: "no-store",
      redirect: "error",
      signal,
    });
    if (!response.ok) fail();
    const grant = validateGrant(await response.json());
    const user = await request(USERINFO_ENDPOINT, {
      method: "GET",
      headers: { Authorization: `Bearer ${grant.accessToken}` },
      cache: "no-store",
      redirect: "error",
      signal,
    });
    if (!user.ok) fail();
    validateAccount(await user.json(), config.sender);
    return grant;
  } catch {
    fail();
  }
}

export async function saveRefreshToken(token, directory = PROJECT_DIR, signal) {
  signal?.throwIfAborted();
  if (!privateToken(token)) fail();
  const destination = resolve(directory, ".env.local");
  const source = await open(
    destination,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  let existing;
  try {
    const stat = await source.stat();
    if (!stat.isFile() || stat.size > 131_072) fail();
    existing = await source.readFile("utf8");
  } finally {
    await source.close();
  }
  const remaining = existing.replace(
    /^[ \t]*(?:export[ \t]+)?GOOGLE_REFRESH_TOKEN[ \t]*=.*(?:\r?\n|$)/gm,
    "",
  );
  const contents = `${remaining}${remaining.endsWith("\n") || !remaining ? "" : "\n"}GOOGLE_REFRESH_TOKEN=${token}\n`;
  const temporary = resolve(
    directory,
    `.env.local.connect-gmail-${randomBytes(12).toString("hex")}.tmp`,
  );
  let handle;
  try {
    signal?.throwIfAborted();
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(contents, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    signal?.throwIfAborted();
    await rename(temporary, destination);
  } finally {
    if (handle) await handle.close();
    await unlink(temporary).catch(() => {});
  }
}

export function redactOutput(output, secrets) {
  let safe = output;
  for (const secret of secrets.filter(Boolean)) {
    for (const value of new Set([secret, encodeURIComponent(secret)]))
      safe = safe.split(value).join("[redacted]");
  }
  return safe
    .split("\n")
    .filter(
      (line) =>
        !/access_token|refresh_token|client_secret|authorization_code/i.test(
          line,
        ),
    )
    .join("\n");
}

export function runCommand(
  command,
  args,
  {
    directory = PROJECT_DIR,
    input = "",
    showOutput = false,
    secrets = [],
    timeout = 600_000,
    log = console.log,
    signal,
  } = {},
) {
  if (signal?.aborted) return Promise.reject(new Error(CONNECTION_ERROR));
  return new Promise((done, reject) => {
    const child = spawn(command, args, {
      cwd: directory,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let omitted = false;
    let timedOut = false;
    const collect = (chunk) => {
      if (output.length + chunk.length <= 2_000_000) output += chunk.toString();
      else omitted = true;
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.stdin.on("error", () => {});
    child.stdin.end(input);
    const terminate = () => {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000).unref();
    };
    signal?.addEventListener("abort", terminate, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      terminate();
    }, timeout);
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", terminate);
    };
    child.once("error", () => {
      cleanup();
      reject(new Error(CONNECTION_ERROR));
    });
    child.once("close", (code) => {
      cleanup();
      if (showOutput && omitted)
        log("Vercel output omitted because it was too long.");
      else if (showOutput && output) log(redactOutput(output, secrets));
      if (code !== 0 || timedOut || signal?.aborted)
        reject(new Error(CONNECTION_ERROR));
      else done();
    });
  });
}

export async function completeAuthorization(
  code,
  authorization,
  config,
  options = {},
) {
  const status = options.status ?? console.log;
  options.signal?.throwIfAborted();
  const grant = await exchangeGrant(
    code,
    authorization,
    config,
    options.fetch,
    options.signal,
  );
  options.signal?.throwIfAborted();
  status("Google account and Gmail send permission verified.");
  await (
    options.save ??
    ((token) => saveRefreshToken(token, PROJECT_DIR, options.signal))
  )(grant.refreshToken);
  options.signal?.throwIfAborted();
  status("Gmail connection saved privately on this computer.");
  const secrets = [
    config.clientSecret,
    grant.refreshToken,
    grant.accessToken,
    code,
    authorization.verifier,
  ];
  const publish =
    options.publish ??
    ((token) =>
      runCommand(
        "vercel",
        [
          "env",
          "add",
          "GOOGLE_REFRESH_TOKEN",
          "production",
          "--force",
          "--sensitive",
          "--yes",
          "--scope",
          VERCEL_SCOPE,
        ],
        { input: token, secrets, timeout: 90_000, signal: options.signal },
      ));
  await publish(grant.refreshToken);
  options.signal?.throwIfAborted();
  status(
    "Gmail connection stored in Vercel Production. Deploying the website…",
  );
  const deploy =
    options.deploy ??
    (() =>
      runCommand(
        "vercel",
        ["deploy", "--prod", "--yes", "--scope", VERCEL_SCOPE],
        { showOutput: true, secrets, signal: options.signal },
      ));
  await deploy();
  options.signal?.throwIfAborted();
  status("Production deployment complete. You can close this helper.");
}

function html(response, status, message) {
  response.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy":
      "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    Connection: "close",
  });
  response.end(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Playground Gmail connection</title><body><h1>Playground Gmail connection</h1><p>${message}</p></body></html>`,
  );
}

export async function startConnector(config, options = {}) {
  const authorization = createAuthorization(config);
  const status = options.status ?? console.log;
  const controller = new AbortController();
  let processing = false;
  let finished = false;
  let resolveDone;
  const done = new Promise((resolve) => {
    resolveDone = resolve;
  });
  const stop = (success) => {
    if (finished) return;
    finished = true;
    controller.abort();
    clearTimeout(timer);
    server.close();
    server.closeAllConnections();
    resolveDone(success);
  };
  const finishResponse = (response, success, statusCode, message) => {
    if (response.destroyed || response.writableEnded) {
      stop(success);
      return;
    }
    // Workflow completion must not depend on the browser keeping its socket open.
    const flushTimeout = setTimeout(() => stop(success), 1000);
    const close = () => {
      clearTimeout(flushTimeout);
      stop(success);
    };
    response.once("finish", close);
    response.once("close", close);
    html(response, statusCode, message);
  };
  const server = createServer(
    { maxHeaderSize: 16_384 },
    async (request, response) => {
      if (processing || finished) {
        html(
          response,
          409,
          "A connection is already being processed. Check the terminal.",
        );
        return;
      }
      let callback;
      try {
        callback = readCallback(request, authorization.state);
      } catch {
        html(
          response,
          400,
          "This callback could not be verified. Use the Google approval link from the helper.",
        );
        return;
      }
      processing = true;
      clearTimeout(timer);
      if (callback.denied) {
        finishResponse(
          response,
          false,
          400,
          "Google approval was not completed. Run the helper again to retry.",
        );
        status(
          "Google approval was not completed. Run the helper again to retry.",
        );
        return;
      }
      try {
        await completeAuthorization(callback.code, authorization, config, {
          ...options,
          status,
          signal: controller.signal,
        });
        finishResponse(
          response,
          true,
          200,
          "Gmail is connected and the website is deployed. You can close this page.",
        );
      } catch {
        if (finished) return;
        finishResponse(
          response,
          false,
          500,
          "The connection or deployment could not be completed. Check the terminal and run the helper again to retry.",
        );
        status(CONNECTION_ERROR);
      }
    },
  );
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  const timer = setTimeout(
    () => {
      status(
        "Google approval timed out. Run the helper again when you are ready.",
      );
      stop(false);
    },
    options.waitTimeout ?? 15 * 60_000,
  );
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(options.port ?? 8739, "127.0.0.1", resolve);
    });
  } catch {
    clearTimeout(timer);
    throw new Error(
      "The local Gmail connector could not start. Ensure port 8739 is available.",
    );
  }
  return {
    authorizationUrl: authorization.authorizationUrl,
    done,
    stop,
    server,
  };
}

async function main() {
  if (process.argv.length > 2)
    throw new Error("This helper takes no command-line arguments.");
  process.chdir(PROJECT_DIR);
  await access(".env.local");
  process.loadEnvFile(".env.local");
  await runCommand("git", ["check-ignore", "--quiet", ".env.local"], {
    timeout: 10_000,
  });
  const connector = await startConnector(readConfiguration());
  console.log(
    "Open this Google approval URL in your browser. The local connector will wait for up to 15 minutes:",
  );
  console.log(connector.authorizationUrl);
  const cancel = () => {
    console.log("Gmail connection stopped. Run the helper again to retry.");
    connector.stop(false);
  };
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  const success = await connector.done;
  process.removeListener("SIGINT", cancel);
  process.removeListener("SIGTERM", cancel);
  if (!success) process.exitCode = 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(() => {
    console.error(
      "The Gmail helper could not complete. Check the local configuration, port 8739 and Vercel login, then retry.",
    );
    process.exitCode = 1;
  });
}
