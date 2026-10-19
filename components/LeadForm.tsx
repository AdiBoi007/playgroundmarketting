"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Arrow } from "@/components/ui/Primitives";
import { track } from "@/lib/analytics";
import { validateLead } from "@/lib/lead";
import { ContactFields } from "@/components/ContactFields";

const unconfirmed =
  "We couldn’t confirm your brief or waitlist signup. Please try again.";
const briefFields = [
  "name",
  "email",
  "productUrl",
  "targetUser",
  "testGoal",
] as const;

export function LeadForm({
  focus = "",
  intakeAvailable,
}: {
  focus?: string;
  intakeAvailable: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const success = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const started = useRef(false);
  const requestId = useRef<{ id: string; payload: string } | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (status === "success") success.current?.focus();
  }, [status]);
  const values = (): Record<string, unknown> & { consent: boolean } => {
    const data = new FormData(form.current!);
    return {
      ...Object.fromEntries(data.entries()),
      consent: data.get("consent") === "yes",
    };
  };
  const start = () => {
    if (!started.current) {
      track("lead_form_started");
      started.current = true;
    }
  };
  const saveBrief = () => {
    if (!form.current) return;
    for (const name of briefFields) {
      const field = form.current.elements.namedItem(name);
      if (
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement
        ) ||
        !field.reportValidity()
      )
        return;
    }
    const result = validateLead(values());
    if ("error" in result) {
      setMessage(result.error);
      setStatus("error");
      return;
    }
    const lead = result.lead;
    const content = `PLAYGROUND / PRODUCT TEST BRIEF\n\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || "Not provided"}\nSocial profile: ${lead.socialProfile || "Not provided"}\nProduct: ${lead.productUrl}\n\nWHO IT IS FOR\n${lead.targetUser}\n\nWHAT TO FIND OUT\n${lead.testGoal}\n\nThis brief is saved on your device. It has not been sent to Playground.\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "playground-test-brief.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending.current) return;
    const input = values();
    const validation = validateLead(input);
    if ("error" in validation) {
      setStatus("error");
      setMessage(validation.error);
      track("lead_form_error", { reason: "validation" });
      return;
    }
    if (!input.consent) {
      setStatus("error");
      setMessage(
        "Please agree to join the waitlist before sending your brief.",
      );
      track("lead_form_error", { reason: "validation" });
      return;
    }
    const payload = JSON.stringify({
      ...validation.lead,
      website: typeof input.website === "string" ? input.website : "",
      consent: input.consent,
    });
    pending.current = true;
    setStatus("loading");
    setMessage("");
    try {
      if (!requestId.current || requestId.current.payload !== payload)
        requestId.current = { id: crypto.randomUUID(), payload };
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestId.current.id,
        },
        body: payload,
        signal: AbortSignal.timeout(20_000),
      });
      let result: { delivered?: unknown; waitlisted?: unknown } | null = null;
      try {
        result = await response.json();
      } catch {
        // An unreadable response cannot confirm delivery or waitlist signup.
      }
      if (
        !response.ok ||
        result?.delivered !== true ||
        result?.waitlisted !== true
      )
        throw new Error(unconfirmed);
      setStatus("success");
      track("lead_form_submitted");
      requestId.current = null;
    } catch {
      setStatus("error");
      setMessage(unconfirmed);
      track("lead_form_error", { reason: "delivery" });
    } finally {
      pending.current = false;
    }
  }
  if (status === "success")
    return (
      <div
        className="lead-success"
        role="status"
        ref={success}
        tabIndex={-1}
        aria-labelledby="lead-success-title"
      >
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <span className="mono">BRIEF RECEIVED / WAITLIST CONFIRMED</span>
        <h2 id="lead-success-title">You’re on the waitlist.</h2>
        <p>
          We’ve received your brief. We’ll keep you posted about early access
          and launch updates.
        </p>
        <Link className="button" href="/sample-report">
          See example findings <Arrow />
        </Link>
      </div>
    );
  return (
    <form
      ref={form}
      className="lead-form"
      onSubmit={submit}
      onFocus={start}
      aria-busy={status === "loading"}
      aria-label="Share your product and join the Playground waitlist"
    >
      <div className="form-top">
        <span className="mono">YOUR TEST BRIEF</span>
        <span className="mono">EARLY ACCESS</span>
      </div>
      <div className="form-fields">
        <p className="lead-waitlist-intro">
          Sending a brief also joins the waitlist. We’ll review what you’re
          building and share early-access and launch updates.
        </p>
        <div className="form-two">
          <label>
            Name
            <input
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              required
              maxLength={100}
              disabled={status === "loading"}
            />
          </label>
          <label>
            Email
            <input
              name="email"
              autoComplete="email"
              type="email"
              placeholder="ada@yourcompany.com"
              required
              maxLength={254}
              disabled={status === "loading"}
            />
          </label>
        </div>
        <label>
          Product or prototype link
          <input
            name="productUrl"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://your-product.com"
            required
            maxLength={2048}
            disabled={status === "loading"}
          />
          <span className="form-hint">
            A website or a rough version of your product that we can try.
          </span>
        </label>
        <label>
          Who is it for?
          <textarea
            name="targetUser"
            placeholder="e.g. Freelancers who manage their own invoices"
            required
            maxLength={1000}
            rows={2}
            disabled={status === "loading"}
          />
        </label>
        <label>
          What do you want to find out?
          <textarea
            name="testGoal"
            placeholder="e.g. Will people trust this tool to send an invoice?"
            required
            maxLength={2000}
            rows={3}
            defaultValue={focus ? `I want to find out: ${focus}` : ""}
            disabled={status === "loading"}
          />
          <span className="form-hint">
            Describe the question that matters most to you right now.
          </span>
        </label>
        <ContactFields disabled={status === "loading"} />
        <div className="form-honeypot" aria-hidden="true">
          <label>
            Leave this field empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="lead-waitlist-consent">
          <input
            type="checkbox"
            name="consent"
            value="yes"
            required
            disabled={status === "loading"}
          />
          <span>
            Add me to the Playground waitlist for early-access and launch
            updates.
          </span>
        </label>
        {!intakeAvailable && (
          <div className="intake-note">
            <p>
              Brief submissions and waitlist signups are temporarily
              unavailable. You can still save a copy of your brief.
            </p>
          </div>
        )}
        <div className="form-error" role="alert">
          {status === "error" && message}
        </div>
        <button
          className="button form-submit"
          type="submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Sending your brief…" : "Send your brief"}
          {status === "loading" ? (
            <span className="loading-indicator" aria-hidden="true" />
          ) : (
            <Arrow />
          )}
        </button>
        <p className="form-privacy">
          We use your brief to review your request and send the updates you’ve
          agreed to receive. <Link href="/privacy">Privacy notice</Link>
        </p>
        <button
          className="save-brief"
          type="button"
          onClick={saveBrief}
          disabled={status === "loading"}
        >
          Save a copy of your brief <span aria-hidden="true">↓</span>
        </button>
      </div>
    </form>
  );
}
