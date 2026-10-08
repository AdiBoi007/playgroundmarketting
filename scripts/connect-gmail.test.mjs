import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { request as httpRequest } from "node:http";
import {
  mkdtemp,
  readFile,
  readdir,
  stat,
  symlink,
  writeFile,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  CALLBACK_URI,
  GMAIL_SCOPE,
  createAuthorization,
  statesMatch,
  readCallback,
  validateGrant,
  validateAccount,
  exchangeGrant,
  saveRefreshToken,
  redactOutput,
  completeAuthorization,
  startConnector,
} from "./connect-gmail.mjs";

const config = {
  clientId: "test-client.apps.googleusercontent.com",
  clientSecret: "private-client-secret",
  sender: "owner@example.com",
};
const grant = {
  access_token: "private-access-token",
  refresh_token: "private-refresh-token",
  token_type: "Bearer",
  scope: `openid email ${GMAIL_SCOPE}`,
};
const account = { email: config.sender, email_verified: true };
const response = (body, ok = true) => ({ ok, json: async () => body });
const callback = (url, headers = {}) => ({
  method: "GET",
  url,
  socket: { remoteAddress: "127.0.0.1" },
  headers: { host: "localhost:8739", ...headers },
});

test("authorization uses random state, PKCE S256, minimal scopes and offline consent", () => {
  const flow = createAuthorization(config);
  const params = new URL(flow.authorizationUrl).searchParams;
  assert.equal(params.get("redirect_uri"), CALLBACK_URI);
  assert.equal(params.get("scope"), `openid email ${GMAIL_SCOPE}`);
  assert.equal(params.get("access_type"), "offline");
  assert.equal(params.get("prompt"), "consent");
  assert.equal(params.get("login_hint"), config.sender);
  assert.equal(params.get("code_challenge_method"), "S256");
  assert.equal(
    params.get("code_challenge"),
    createHash("sha256").update(flow.verifier).digest("base64url"),
  );
  assert.notEqual(flow.state, createAuthorization(config).state);
  assert(!flow.authorizationUrl.includes(config.clientSecret));
  assert(!flow.authorizationUrl.includes(flow.verifier));
});

test("callback rejects foreign hosts, origins, peers, methods and malformed or missing state", () => {
  const state = "random-test-state";
  assert(statesMatch(state, state));
  assert(!statesMatch("wrong", state));
  assert(!statesMatch(null, state));
  assert.deepEqual(
    readCallback(
      callback(`/oauth/callback?state=${state}&code=private-code`),
      state,
    ),
    { code: "private-code" },
  );
  for (const req of [
    callback("/oauth/callback?code=private-code"),
    callback("/oauth/callback?state=wrong&code=private-code"),
    callback(`/oauth/callback?state=${state}&state=${state}&code=private-code`),
    callback(`/oauth/callback?state=${state}&code=a&code=b`),
    callback(`/oauth/callback?state=${state}`),
    callback(`/oauth/callback?state=${state}&code=%0A`),
    callback(`/wrong?state=${state}&code=private-code`),
    callback(`/oauth/callback?state=${state}&code=private-code`, {
      host: "foreign.example",
    }),
    callback(`/oauth/callback?state=${state}&code=private-code`, {
      origin: "https://foreign.example",
    }),
    {
      ...callback(`/oauth/callback?state=${state}&code=private-code`),
      method: "POST",
    },
    {
      ...callback(`/oauth/callback?state=${state}&code=private-code`),
      socket: { remoteAddress: "192.0.2.1" },
    },
  ])
    assert.throws(() => readCallback(req, state));
  assert.deepEqual(
    readCallback(
      callback(`/oauth/callback?state=${state}&error=access_denied`),
      state,
    ),
    { denied: true },
  );
});

test("grant requires both private tokens, Bearer and exact Gmail send scope", () => {
  assert.equal(validateGrant(grant).refreshToken, grant.refresh_token);
  for (const invalid of [
    null,
    {},
    { ...grant, refresh_token: "" },
    { ...grant, access_token: "" },
    { ...grant, token_type: "Basic" },
    { ...grant, scope: `${GMAIL_SCOPE}.extra` },
    { ...grant, refresh_token: "bad\nTOKEN=leak" },
  ])
    assert.throws(() => validateGrant(invalid));
});

test("account must be verified and match the configured sender", () => {
  validateAccount({ ...account, email: "OWNER@example.com" }, config.sender);
  for (const invalid of [
    null,
    {},
    { ...account, email_verified: false },
    { ...account, email_verified: "true" },
    { ...account, email: "other@example.com" },
  ])
    assert.throws(() => validateAccount(invalid, config.sender));
});

test("token exchange uses private POST and authorized userinfo with bounded nonredirecting requests", async () => {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return response(calls.length === 1 ? grant : account);
  };
  const flow = createAuthorization(config);
  await exchangeGrant("private-code", flow, config, fetch);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://oauth2.googleapis.com/token");
  assert.equal(calls[0].options.body.get("code_verifier"), flow.verifier);
  assert.equal(calls[0].options.body.get("client_secret"), config.clientSecret);
  assert.equal(
    calls[1].url,
    "https://openidconnect.googleapis.com/v1/userinfo",
  );
  assert.equal(
    calls[1].options.headers.Authorization,
    `Bearer ${grant.access_token}`,
  );
  for (const { options } of calls) {
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    assert(options.signal instanceof AbortSignal);
  }
});

test("provider failures, missing grant and wrong account never write or deploy and never leak errors", async () => {
  for (const bodies of [
    [response({ error: "private-provider-body" }, false)],
    [response({ ...grant, refresh_token: "" })],
    [response({ ...grant, scope: "openid email" })],
    [response(grant), response({ ...account, email_verified: false })],
    [response(grant), response({ ...account, email: "other@example.com" })],
  ]) {
    let calls = 0;
    const writes = [];
    const logs = [];
    await assert.rejects(
      completeAuthorization(
        "private-code",
        createAuthorization(config),
        config,
        {
          fetch: async () => bodies[calls++],
          save: async (...values) => writes.push(values),
          publish: async () => writes.push("publish"),
          deploy: async () => writes.push("deploy"),
          status: (value) => logs.push(value),
        },
      ),
      (error) => {
        assert(!error.message.includes("private-"));
        return true;
      },
    );
    assert.deepEqual(writes, []);
    assert.deepEqual(logs, []);
  }
});

test("verified grant saves privately then publishes then deploys; failure prevents deployment", async () => {
  const events = [];
  const logs = [];
  let call = 0;
  const options = {
    fetch: async () => response(call++ === 0 ? grant : account),
    save: async (value) => {
      assert.equal(value, grant.refresh_token);
      events.push("save");
    },
    publish: async (value) => {
      assert.equal(value, grant.refresh_token);
      events.push("publish");
    },
    deploy: async () => events.push("deploy"),
    status: (value) => logs.push(value),
  };
  await completeAuthorization(
    "private-code",
    createAuthorization(config),
    config,
    options,
  );
  assert.deepEqual(events, ["save", "publish", "deploy"]);
  for (const secret of [
    config.clientSecret,
    grant.access_token,
    grant.refresh_token,
    "private-code",
  ])
    assert(!logs.join("\n").includes(secret));
  events.length = 0;
  call = 0;
  await assert.rejects(
    completeAuthorization("private-code", createAuthorization(config), config, {
      ...options,
      publish: async () => {
        events.push("publish");
        throw new Error("private-provider-body");
      },
    }),
  );
  assert.deepEqual(events, ["save", "publish"]);
});

test("atomic local save replaces all old tokens, preserves config and produces a0600 file", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "playground-gmail-test-"));
  try {
    const path = resolve(directory, ".env.local");
    await writeFile(
      path,
      "# owner config\nGOOGLE_CLIENT_ID=keep-me\nGOOGLE_REFRESH_TOKEN=old-one\nexport GOOGLE_REFRESH_TOKEN=old-two\nGMAIL_SENDER_EMAIL=owner@example.com\n",
      { mode: 0o644 },
    );
    await saveRefreshToken(grant.refresh_token, directory);
    const text = await readFile(path, "utf8");
    assert(text.includes("GOOGLE_CLIENT_ID=keep-me"));
    assert(text.includes(`GOOGLE_REFRESH_TOKEN=${grant.refresh_token}\n`));
    assert.equal(text.match(/GOOGLE_REFRESH_TOKEN=/g).length, 1);
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    assert.deepEqual(await readdir(directory), [".env.local"]);
    await assert.rejects(saveRefreshToken("unsafe\nOTHER=secret", directory));
    assert.equal(await readFile(path, "utf8"), text);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("local save rejects symlinked owner configuration", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "playground-gmail-test-"));
  try {
    await writeFile(resolve(directory, "target"), "UNCHANGED=true\n");
    await symlink("target", resolve(directory, ".env.local"));
    await assert.rejects(saveRefreshToken(grant.refresh_token, directory));
    assert.equal(
      await readFile(resolve(directory, "target"), "utf8"),
      "UNCHANGED=true\n",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI output redacts raw and encoded credentials and suppresses provider-field lines", () => {
  const output = `Build completed\n${grant.refresh_token}\n${encodeURIComponent("private/code")}\naccess_token=unknown-secret\nDeployment ready`;
  const safe = redactOutput(output, [grant.refresh_token, "private/code"]);
  assert(!safe.includes(grant.refresh_token));
  assert(!safe.includes("private%2Fcode"));
  assert(!safe.includes("unknown-secret"));
  assert(safe.includes("Build completed"));
});

test("local listener times out and closes without contacting Google or writing tokens", async () => {
  const logs = [];
  let contacted = false;
  const connector = await startConnector(config, {
    port: 0,
    waitTimeout: 30,
    status: (value) => logs.push(value),
    fetch: async () => {
      contacted = true;
      throw new Error("not allowed");
    },
    save: async () => assert.fail("no token write expected"),
    publish: async () => assert.fail("no deployment expected"),
    deploy: async () => assert.fail("no deployment expected"),
  });
  assert.equal(await connector.done, false);
  assert.equal(contacted, false);
  assert.equal(connector.server.listening, false);
  assert(logs[0].includes("timed out"));
});

test("a closed callback browser cannot keep the connector alive after deployment", async () => {
  let releaseDeployment;
  let startedDeployment;
  const deploymentStarted = new Promise((resolve) => {
    startedDeployment = resolve;
  });
  const deployment = new Promise((resolve) => {
    releaseDeployment = resolve;
  });
  const events = [];
  let calls = 0;
  const connector = await startConnector(config, {
    port: 0,
    waitTimeout: 1000,
    status: () => {},
    fetch: async () => response(calls++ === 0 ? grant : account),
    save: async () => {
      events.push("save");
    },
    publish: async () => {
      events.push("publish");
    },
    deploy: async () => {
      startedDeployment();
      await deployment;
      events.push("deploy");
    },
  });
  const state = new URL(connector.authorizationUrl).searchParams.get("state");
  const browser = httpRequest({
    host: "127.0.0.1",
    port: connector.server.address().port,
    path: `/oauth/callback?state=${state}&code=private-code`,
    headers: { Host: "localhost:8739" },
  });
  browser.on("error", () => {});
  try {
    browser.end();
    await deploymentStarted;
    browser.destroy();
    await new Promise((resolve) => setTimeout(resolve, 10));
    releaseDeployment();
    const timeout = setTimeout(() => connector.stop(false), 1000);
    assert.equal(await connector.done, true);
    clearTimeout(timeout);
    assert.equal(connector.server.listening, false);
    assert.deepEqual(events, ["save", "publish", "deploy"]);
    assert.equal(calls, 2);
  } finally {
    browser.destroy();
    connector.stop(false);
  }
});
