import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { validateLead } from "@/lib/lead";
import { hasGmailConfiguration, sendTestRequestNotification } from "@/lib/gmail";
import { siteOrigin } from "@/lib/site";
export const runtime = "nodejs";
export const maxDuration = 30;
const attempts = new Map<string, { count: number; expires: number }>();
const submissions = new Map<
  string,
  {
    hash: string;
    expires: number;
    pending: Promise<{ messageId: string }>;
  }
>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_BODY_BYTES = 16_384;
function error(
  message: string,
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}
async function readBody(request: NextRequest) {
  if (!request.body) throw new Error("empty");
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("large");
    }
    chunks.push(result.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let trusted = false;
  try {
    const parsed = new URL(origin || "");
    trusted =
      ["http:", "https:"].includes(parsed.protocol) &&
      (parsed.origin === new URL(request.url).origin ||
        parsed.origin === siteOrigin ||
        parsed.host === request.headers.get("host"));
  } catch {
    /* Invalid/missing browser origins are rejected below. */
  }
  if (!trusted || request.headers.get("sec-fetch-site") === "cross-site")
    return error(
      "This request could not be verified. Please submit from the Playground website.",
      403,
    );
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return error("Please submit the test brief as JSON.", 415);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    return error(
      "This brief is too long. Please shorten it and try again.",
      413,
    );
  let input: unknown;
  try {
    input = await readBody(request);
  } catch (e) {
    return error(
      e instanceof Error && e.message === "large"
        ? "This brief is too long."
        : "The test brief could not be read. Please try again.",
      e instanceof Error && e.message === "large" ? 413 : 400,
    );
  }
  if (!input || typeof input !== "object" || Array.isArray(input))
    return error("Please complete a valid test brief.", 400);
  const record = input as Record<string, unknown>;
  if (record.website) return error("This request could not be verified.", 400);
  const validated = validateLead(record);
  if ("error" in validated) return error(validated.error, 400);
  if (record.consent !== true)
    return error(
      "Please agree to join the waitlist for early-access and launch updates.",
      400,
    );
  const suppliedId = request.headers.get("idempotency-key");
  if (suppliedId && !/^[a-zA-Z0-9-]{16,80}$/.test(suppliedId))
    return error("Please refresh the page and try again.", 400);

  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.expires <= now) attempts.delete(key);
  for (const [key, value] of submissions)
    if (value.expires <= now) submissions.delete(key);
  const signup = {
    ...validated.lead,
    consent: true as const,
    source: "run-a-test" as const,
  };
  const id = suppliedId || randomUUID();
  const hash = createHash("sha256").update(JSON.stringify(signup)).digest("hex");
  const previous = submissions.get(id);
  if (previous && previous.hash !== hash)
    return error(
      "This brief changed. Please submit it again with a new reference.",
      409,
    );
  if (!previous) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "shared";
    const key = createHash("sha256").update(ip).digest("hex");
    const bucket = attempts.get(key) || {
      count: 0,
      expires: now + WINDOW_MS,
    };
    if (bucket.count >= 6 || (attempts.size >= 10_000 && !attempts.has(key)))
      return error("Too many requests. Please try again in a few minutes.", 429, {
        "Retry-After": String(Math.max(1, Math.ceil((bucket.expires - now) / 1000))),
      });
    attempts.set(key, { count: bucket.count + 1, expires: bucket.expires });
    if (!hasGmailConfiguration())
      return error(
        "Brief submissions and waitlist signups are temporarily unavailable. You can still save a copy of your brief.",
        503,
      );
    if (submissions.size >= 2000)
      return error("Requests are temporarily busy. Please try again shortly.", 503);
    const pending = sendTestRequestNotification(signup, id);
    submissions.set(id, { hash, expires: now + 30 * 60 * 1000, pending });
  }
  const submission = submissions.get(id)!;
  try {
    await submission.pending;
    return NextResponse.json(
      { delivered: true, waitlisted: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    if (submissions.get(id) === submission) submissions.delete(id);
    return error(
      "Your brief and waitlist signup could not be confirmed. Please try again, or save a copy below.",
      502,
    );
  }
}
