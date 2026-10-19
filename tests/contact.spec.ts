import { test, expect, type Page, type Route } from "@playwright/test";
import { NextRequest } from "next/server";
import { POST as joinWaitlist } from "../app/api/waitlist/route";
import { POST as applyAsTester } from "../app/api/testers/route";
import { POST as sendBrief } from "../app/api/lead/route";
import { sendTesterNotification, type GmailSMTPMessage } from "../lib/gmail";
import { validateTester } from "../lib/tester";
import { MAX_RESUME_BYTES, MAX_RESUME_BASE64_LENGTH, validateResume } from "../lib/resume";
import { docxFixture } from "./resume-fixtures";

const brief = {
  name: "Test Founder", email: "contact-test@example.com", productUrl: "https://example.com/product",
  targetUser: "Freelancers", testGoal: "Can they send an invoice?", consent: true,
};
const phone = "+61 412 345 678";
const socialProfile = "linkedin.com/in/test-founder";
const tester = { name: "Test Founder", role: "Product designer", company: "Example Co", expertise: "Business tools\nOnboarding", phone, consent: true, source: "become-tester" };
const gmailSettings = {
  GOOGLE_CLIENT_ID: "mock-client-id", GOOGLE_CLIENT_SECRET: "mock-client-secret",
  GOOGLE_REFRESH_TOKEN: "mock-refresh-token", GMAIL_SENDER_EMAIL: "playground@example.com", WAITLIST_NOTIFY_EMAIL: "notify@example.com",
};

async function mockedDelivery(route: Route, handler: (request: NextRequest) => Promise<Response>) {
  const originalFetch = globalThis.fetch;
  const previous = new Map([...Object.keys(gmailSettings), "GMAIL_APP_PASSWORD"].map((key) => [key, process.env[key]]));
  let mime = "";
  let response: Response;
  try {
    delete process.env.GMAIL_APP_PASSWORD;
    Object.assign(process.env, gmailSettings);
    globalThis.fetch = async (input, init) => {
      const outgoing = new Request(input, init);
      if (outgoing.url === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "mock-access-token" });
      if (outgoing.url === "https://gmail.googleapis.com/gmail/v1/users/me/messages/send") {
        const { raw } = await outgoing.json();
        mime = Buffer.from(raw, "base64url").toString("utf8");
        return Response.json({ id: "mock-contact-message" });
      }
      throw new Error("No real network request is allowed in this test.");
    };
    const request = route.request();
    response = await handler(new NextRequest(request.url(), { method: "POST", headers: request.headers(), body: request.postData()! }));
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of previous)
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
  await route.fulfill({ status: response.status, json: await response.json() });
  const [headers, encodedBody] = mime.split("\r\n\r\n");
  return { headers, body: Buffer.from(encodedBody || "", "base64").toString("utf8"), mime };
}

async function fillTester(page: Page) {
  await page.getByLabel("Name", { exact: true }).fill(tester.name);
  await page.getByLabel("What do you do?", { exact: true }).fill(tester.role);
  await page.getByLabel("Company (optional)", { exact: true }).fill(tester.company);
}

for (const { path, api, handler, isTester } of [
  { path: "/waitlist", api: "/api/waitlist", handler: joinWaitlist, isTester: false },
  { path: "/become-a-tester", api: "/api/testers", handler: applyAsTester, isTester: true },
]) {
  for (const method of ["linkedin", "phone", "email"] as const) {
    test(`${path} sends ${method}-only signup through the API to Gmail`, async ({ page }, testInfo) => {
      let delivered: { headers: string; body: string } | undefined;
      let payload: Record<string, unknown> | undefined;
      await page.route(`**${api}`, async (route) => {
        payload = route.request().postDataJSON();
        delivered = await mockedDelivery(route, handler);
      });
      await page.setViewportSize({ width: method === "phone" ? 1440 : 375, height: 1100 });
      await page.goto(path);
      const form = page.getByRole("form");
      await expect(form.getByRole("radio")).toHaveCount(3);
      await expect(form.getByRole("radio").nth(0)).toHaveAccessibleName("LinkedIn");
      await expect(form.getByRole("radio").nth(1)).toHaveAccessibleName("Phone");
      await expect(form.getByRole("radio").nth(2)).toHaveAccessibleName("Email");
      await expect(form.getByRole("radio", { name: "LinkedIn", exact: true })).toBeChecked();
      await expect(form.getByLabel("Phone number", { exact: true })).toBeHidden();
      if (isTester) await fillTester(page);
      if (method !== "linkedin") await form.getByRole("radio", { name: method === "phone" ? "Phone" : "Email", exact: true }).check();
      await page.getByLabel(method === "phone" ? "Phone number" : method === "email" ? "Email" : "LinkedIn profile", { exact: true })
        .fill(method === "phone" ? phone : method === "email" ? brief.email : socialProfile);
      if (method !== "email") await expect(form.getByLabel("Email", { exact: true })).toBeHidden();
      await form.getByRole("checkbox").check();
      await form.screenshot({ path: testInfo.outputPath(`${isTester ? "tester" : "waitlist"}-${method}-form.png`) });
      if (method === "phone") await page.locator("main").screenshot({ path: testInfo.outputPath("signup-page.png") });
      await form.getByRole("button", { name: isTester ? "Apply for paid tests" : "Join the waitlist", exact: true }).scrollIntoViewIfNeeded();
      await form.getByRole("button", { name: isTester ? "Apply for paid tests" : "Join the waitlist", exact: true }).click();
      await expect(page.getByRole("status")).toContainText(isTester ? "APPLICATION RECEIVED" : "SIGNUP CONFIRMED");
      await expect(page.getByRole("status")).toBeFocused();
      expect(payload).toMatchObject({ email: method === "email" ? brief.email : "", phone: method === "phone" ? phone : "", socialProfile: method === "linkedin" ? socialProfile : "", contactMethod: method, consent: true });
      expect(delivered?.headers).toContain(isTester ? "Subject: New Playground tester application" : "Subject: New Playground waitlist signup");
      if (method === "email") expect(delivered?.headers).toContain(`Reply-To: ${brief.email}`);
      else expect(delivered?.headers).not.toContain("Reply-To:");
      expect(delivered?.body).toContain(`Preferred contact: ${method === "linkedin" ? "LinkedIn / social" : method}`);
      expect(delivered?.body).toContain(method === "phone" ? phone : method === "email" ? brief.email : socialProfile);
      if (isTester) {
        expect(delivered?.body).toContain(`Role: ${tester.role}`);
        expect(delivered?.body).toContain(`Company: ${tester.company}`);
        expect(delivered?.body).toContain("Source: become-tester");
        expect(delivered?.body).toContain("tester opportunities");
        expect(delivered?.body).not.toContain("agreed to receive Playground early-access");
      }
    });
  }

  test(`${path} retains details on failure and retries with the same reference`, async ({ page }) => {
    const ids: (string | undefined)[] = [];
    await page.route(`**${api}`, async (route) => {
      ids.push(route.request().headers()["idempotency-key"]);
      await route.fulfill(ids.length === 1 ? { status: 502, json: { error: "Please try again shortly." } } : { json: { accepted: true } });
    });
    await page.goto(path);
    if (isTester) await fillTester(page);
    await page.getByRole("radio", { name: "Phone", exact: true }).check();
    await page.getByLabel("Phone number", { exact: true }).fill(phone);
    await page.getByRole("form").getByRole("checkbox").check();
    const submit = page.getByRole("button", { name: isTester ? "Apply for paid tests" : "Join the waitlist", exact: true });
    await submit.click();
    await expect(page.getByRole("form").getByRole("alert")).toContainText("Please try again shortly.");
    await expect(page.getByLabel("Phone number", { exact: true })).toHaveValue(phone);
    await expect(page.getByRole("form").getByRole("checkbox")).toBeChecked();
    await submit.click();
    await expect(page.getByRole("status")).toBeVisible();
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBeTruthy();
    expect(ids[0]).toBe(ids[1]);
  });

  test(`${api} rejects missing, invalid or mismatched contact details`, async () => {
    for (const invalid of [
      { phone: "", email: "", socialProfile: "" }, { phone: 12345678 }, { phone: "call me" },
      { phone: "+61\r\nBcc: attacker@example.com" }, { phone: "1".repeat(51) },
      { socialProfile: ["@someone"] }, { socialProfile: "handle\nextra line" }, { socialProfile: "x".repeat(501) },
      { socialProfile: "javascript:alert(1)" }, { socialProfile: "https://user:pass@linkedin.com/in/person" },
      { email: "bad email" }, { contactMethod: "email", email: "" }, { contactMethod: "linkedin", socialProfile: "" }, { contactMethod: "invalid" },
    ]) {
      const response = await handler(new NextRequest(`http://localhost:3000${api}`, {
        method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" },
        body: JSON.stringify({ ...(isTester ? tester : { phone, consent: true }), ...invalid }),
      }));
      expect(response.status).toBe(400);
    }
  });
}

for (const includeContact of [false, true]) {
  test(`product briefs still deliver with optional contact details ${includeContact ? "included" : "blank"}`, async ({ page }) => {
    let body = "";
    await page.route("**/api/lead", async (route) => { body = (await mockedDelivery(route, sendBrief)).body; });
    await page.goto("/run-a-test");
    for (const [label, value] of [["Name", brief.name], ["Email", brief.email], ["Product or prototype link", brief.productUrl], ["Who is it for?", brief.targetUser], ["What do you want to find out?", brief.testGoal]])
      await page.getByLabel(label, { exact: label === "Name" || label === "Email" }).fill(value);
    if (includeContact) {
      await page.getByLabel("Phone number (optional)", { exact: true }).fill(phone);
      await page.getByLabel("LinkedIn or social profile (optional)", { exact: true }).fill(socialProfile);
    }
    await page.getByRole("form").getByRole("checkbox").check();
    await page.getByRole("button", { name: "Request a test", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("REQUEST RECEIVED / WAITLIST CONFIRMED");
    expect(body).toContain(`Phone: ${includeContact ? phone : "Not provided"}`);
  });
}

test("tester SMTP notifications support a phone-only application and preserve expertise", async () => {
  const validation = validateTester(tester);
  expect(validation).toHaveProperty("signup");
  if ("error" in validation) throw new Error(validation.error);
  const messages: GmailSMTPMessage[] = [];
  await sendTesterNotification(validation.signup, crypto.randomUUID(), {
    env: { ...gmailSettings, GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" },
    transportFactory() {
      return {
        async sendMail(message) { messages.push(message); return { messageId: "mock", accepted: [gmailSettings.WAITLIST_NOTIFY_EMAIL], rejected: [], response: "250 OK" }; },
        close() {},
      };
    },
  });
  const [headers, encodedBody] = messages[0].raw.toString("utf8").split("\r\n\r\n");
  expect(headers).not.toContain("Reply-To:");
  const body = Buffer.from(encodedBody, "base64").toString("utf8");
  expect(body).toContain(tester.expertise);
  expect(messages[0].envelope.to).toEqual([gmailSettings.WAITLIST_NOTIFY_EMAIL]);
});

test("tester applications require background and separate consent", async () => {
  for (const invalid of [{ name: "" }, { role: "" }, { consent: false }, { consent: "true" }, { source: "waitlist" }, { company: "x".repeat(151) }, { name: "name\nheader" }])
    expect(validateTester({ ...tester, ...invalid })).toHaveProperty("error");
});

const pdfFixture = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n");
const docxType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function attachmentParts(mime: string) {
  const boundary = mime.match(/boundary="([^"]+)"/)?.[1];
  expect(boundary).toBeTruthy();
  return mime.split(`--${boundary}`).slice(1, -1).map((part) => {
    const separator = part.indexOf("\r\n\r\n");
    return { headers: part.slice(0, separator).trim(), content: Buffer.from(part.slice(separator + 4).trim(), "base64") };
  });
}

for (const file of [
  { name: "Example CV.pdf", mimeType: "application/pdf", buffer: pdfFixture },
  { name: "Example CV.docx", mimeType: docxType, buffer: docxFixture },
]) {
  test(`tester application delivers ${file.name} and LinkedIn while phone remains preferred`, async ({ page }, testInfo) => {
    let deliveredMime = "";
    let payload: Record<string, unknown> | undefined;
    await page.route("**/api/testers", async (route) => {
      payload = route.request().postDataJSON();
      deliveredMime = (await mockedDelivery(route, applyAsTester)).mime;
    });
    await page.setViewportSize({ width: file.mimeType === "application/pdf" ? 375 : 1440, height: 1100 });
    await page.goto("/become-a-tester");
    await fillTester(page);
    await page.getByRole("radio", { name: "Phone", exact: true }).check();
    await page.getByLabel("LinkedIn profile (optional)", { exact: true }).fill(socialProfile);
    await page.getByLabel("Phone number", { exact: true }).fill(phone);
    await page.getByLabel("Résumé / CV (optional)", { exact: true }).setInputFiles(file);
    await page.getByRole("form").getByRole("checkbox").check();
    await page.getByRole("form").screenshot({ path: testInfo.outputPath("tester-with-cv.png") });
    await page.getByRole("button", { name: "Apply for paid tests", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("APPLICATION RECEIVED");
    expect(payload).toMatchObject({ contactMethod: "phone", phone, socialProfile, email: "", resume: { name: file.name, contentType: file.mimeType, base64: file.buffer.toString("base64") } });
    expect(deliveredMime.split("\r\n\r\n")[0]).not.toContain("Reply-To:");
    const parts = attachmentParts(deliveredMime);
    expect(parts).toHaveLength(2);
    expect(parts[0].content.toString("utf8")).toContain(socialProfile);
    expect(parts[0].content.toString("utf8")).toContain("Preferred contact: phone");
    expect(parts[1].headers).toContain(`Content-Type: ${file.mimeType}`);
    expect(parts[1].headers).toContain(`filename="${file.name}"`);
    expect(parts[1].content).toEqual(file.buffer);
  });
}

test("résumé selection can be removed, survives delivery failure, and updates the retry reference when changed", async ({ page }) => {
  const requests: { id: string | undefined; resume: { base64: string } }[] = [];
  await page.route("**/api/testers", async route => {
    requests.push({ id: route.request().headers()["idempotency-key"], resume: route.request().postDataJSON().resume });
    await route.fulfill(requests.length < 3 ? { status: 502, json: { error: "Please try again shortly." } } : { json: { accepted: true } });
  });
  await page.goto("/become-a-tester");
  await fillTester(page);
  await page.getByRole("radio", { name: "Phone", exact: true }).check();
  await page.getByLabel("Phone number", { exact: true }).fill(phone);
  const upload = page.getByLabel("Résumé / CV (optional)", { exact: true });
  const submit = page.getByRole("button", { name: "Apply for paid tests", exact: true });
  await page.getByRole("form").getByRole("checkbox").check();
  await upload.setInputFiles({ name: "resume.txt", mimeType: "text/plain", buffer: Buffer.from("Not a supported CV") });
  await submit.click();
  await expect(page.getByRole("form").getByRole("alert")).toContainText("PDF or DOCX");
  expect(requests).toHaveLength(0);
  await page.getByRole("button", { name: "Remove attachment" }).click();
  expect(await upload.evaluate(input => (input as HTMLInputElement).files?.length)).toBe(0);
  await upload.setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(MAX_RESUME_BYTES + 1) });
  await submit.click();
  await expect(page.getByRole("form").getByRole("alert")).toContainText("2 MB");
  expect(requests).toHaveLength(0);
  await upload.setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer: pdfFixture });
  await submit.click();
  await expect(page.getByRole("form").getByRole("alert")).toContainText("try again");
  expect(await upload.evaluate(input => (input as HTMLInputElement).files?.[0]?.name)).toBe("resume.pdf");
  await submit.click();
  await expect(page.getByRole("form").getByRole("alert")).toContainText("try again");
  expect(requests[0].id).toBe(requests[1].id);
  const changed = Buffer.concat([pdfFixture, Buffer.from("\nUpdated experience\n")]);
  await upload.setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer: changed });
  await submit.click();
  await expect(page.getByRole("status")).toContainText("APPLICATION RECEIVED");
  expect(requests[2].id).not.toBe(requests[1].id);
  expect(Buffer.from(requests[2].resume.base64, "base64")).toEqual(changed);
});

test("tester API rejects invalid, oversized, mismatched and injected résumé uploads", async () => {
  const valid = { name: "resume.pdf", contentType: "application/pdf", base64: pdfFixture.toString("base64") };
  const limitFile = Buffer.alloc(MAX_RESUME_BYTES, 32);
  pdfFixture.copy(limitFile);
  expect(validateResume({ ...valid, base64: limitFile.toString("base64") })).toHaveProperty("resume");
  for (const invalid of [
    null, "not-a-file", { ...valid, name: "../resume.pdf" }, { ...valid, name: "resume.pdf\r\nBcc: injected@example.com" },
    { ...valid, name: "resume.exe" }, { ...valid, contentType: "text/html" }, { ...valid, base64: "not valid base64!" },
    { ...valid, base64: Buffer.from("<html>fake pdf</html>").toString("base64") },
    { ...valid, name: "resume.docx", contentType: docxType },
    { ...valid, base64: Buffer.alloc(MAX_RESUME_BYTES + 1, 32).toString("base64") },
  ]) {
    const response = await applyAsTester(new NextRequest("http://localhost:3000/api/testers", {
      method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" },
      body: JSON.stringify({ ...tester, resume: invalid }),
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  }
  const oversized = await applyAsTester(new NextRequest("http://localhost:3000/api/testers", {
    method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" },
    body: "x".repeat(MAX_RESUME_BASE64_LENGTH + 16_385),
  }));
  expect(oversized.status).toBe(413);
});

test("SMTP sends the original résumé bytes with a safe Unicode filename", async () => {
  const resume = { name: 'Zoë "CV".pdf', contentType: "application/pdf", base64: pdfFixture.toString("base64") };
  const application = validateTester({ ...tester, socialProfile, resume });
  if ("error" in application) throw new Error(application.error);
  let mime = "";
  await sendTesterNotification(application.signup, crypto.randomUUID(), {
    env: { ...gmailSettings, GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" },
    transportFactory: () => ({
      async sendMail(message) { mime = message.raw.toString("utf8"); return { messageId: "mock", accepted: [gmailSettings.WAITLIST_NOTIFY_EMAIL], rejected: [], response: "250 OK" }; },
      close() {},
    }),
  });
  const parts = attachmentParts(mime);
  expect(parts[1].headers).toContain('filename="Zo_ _CV_.pdf"');
  expect(parts[1].headers).toContain("filename*=UTF-8''Zo%C3%AB%20%22CV%22.pdf");
  expect(parts[1].content).toEqual(pdfFixture);
});
