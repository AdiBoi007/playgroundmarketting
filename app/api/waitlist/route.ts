import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { hasGmailConfiguration, sendWaitlistNotification } from "@/lib/gmail";
import { validateWaitlist } from "@/lib/waitlist";
import { siteOrigin } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 30;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; expires: number }>();
const submissions = new Map<
  string,
  {
    hash: string;
    expires: number;
    pending: Promise<{ messageId: string }>;
  }
>();

function error(
  message: string,
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store", ...headers },
    },
  );
}

async function readBody(request: NextRequest) {
  if (!request.body) throw new Error("invalid");
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > 4096) {
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
    const url = new URL(origin || "");
    trusted =
      ["https:", "http:"].includes(url.protocol) &&
      (url.origin === new URL(request.url).origin ||
        url.origin === siteOrigin ||
        url.host === request.headers.get("host"));
  } catch {
    /* Malformed/missing browser origins are rejected. */
  }
  if (!trusted || request.headers.get("sec-fetch-site") === "cross-site")
    return error("Please join from the Playground website.", 403);
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return error("Please submit the signup as JSON.", 415);
  if (Number(request.headers.get("content-length")) > 4096)
    return error("This signup is too long. Please shorten it.", 413);
  let input: unknown;
  try {
    input = await readBody(request);
  } catch (e) {
    return error(
      "This signup could not be read. Please try again.",
      e instanceof Error && e.message === "large" ? 413 : 400,
    );
  }
  if (!input || typeof input !== "object" || Array.isArray(input))
    return error("Please complete a valid waitlist signup.", 400);
  const record = input as Record<string, unknown>;
  if (record.website) return error("This signup could not be verified.", 400);
  const validation = validateWaitlist(record);
  if ("error" in validation) return error(validation.error, 400);
  const providedId = request.headers.get("idempotency-key");
  if (providedId && !/^[a-zA-Z0-9-]{16,80}$/.test(providedId))
    return error("Please refresh the page and try again.", 400);

  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.expires <= now) attempts.delete(key);
  for (const [key, value] of submissions)
    if (value.expires <= now) submissions.delete(key);
  const id = providedId || randomUUID();
  const hash = createHash("sha256")
    .update(JSON.stringify(validation.signup))
    .digest("hex");
  const previous = submissions.get(id);
  if (previous && previous.hash !== hash)
    return error(
      "This signup changed. Please submit it again with a new reference.",
      409,
    );

  if (!previous) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "shared";
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const bucket = attempts.get(ipHash) || {
      count: 0,
      expires: now + WINDOW_MS,
    };
    if (bucket.count >= 6 || (attempts.size >= 10_000 && !attempts.has(ipHash)))
      return error(
        "Too many attempts. Please try again in a few minutes.",
        429,
        {
          "Retry-After": String(
            Math.max(1, Math.ceil((bucket.expires - now) / 1000)),
          ),
        },
      );
    attempts.set(ipHash, { count: bucket.count + 1, expires: bucket.expires });
    if (!hasGmailConfiguration())
      return error(
        "Waitlist signups aren’t open yet. Please check back soon.",
        503,
      );
    if (submissions.size >= 2000)
      return error(
        "Signups are temporarily busy. Please try again shortly.",
        503,
      );
    const pending = sendWaitlistNotification(validation.signup, id);
    submissions.set(id, { hash, expires: now + 30 * 60 * 1000, pending });
  }
  const submission = submissions.get(id)!;
  try {
    await submission.pending;
    return NextResponse.json(
      { accepted: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    if (submissions.get(id) === submission) submissions.delete(id);
    return error(
      "Your signup could not be confirmed. Please try again shortly.",
      502,
    );
  }
}
