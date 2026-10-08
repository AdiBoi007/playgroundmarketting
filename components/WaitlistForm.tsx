"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow, Mark } from "@/components/ui/Primitives";
import { validateWaitlist } from "@/lib/waitlist";
import { track } from "@/lib/analytics";

type Signup = {
  email: string;
  name: string;
  productUrl: string;
  website: string;
  consent: true;
  source: "waitlist";
};

const unconfirmed = "We couldn’t confirm your signup. Please try again.";

function readSignup(form: HTMLFormElement): Signup | { error: string } {
  const values = new FormData(form);
  const website = String(values.get("website") || "").trim();
  const validated = validateWaitlist({
    email: values.get("email"),
    name: values.get("name"),
    productUrl: values.get("productUrl"),
    consent: values.get("consent") === "yes",
    source: "waitlist",
  });
  if ("error" in validated) return validated;
  return {
    ...validated.signup,
    website,
    source: "waitlist",
  };
}

export function WaitlistForm({ available }: { available: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const success = useRef<HTMLDivElement>(null);
  const request = useRef<{ id: string; payload: string } | null>(null);
  const pending = useRef(false);
  const started = useRef(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "success") success.current?.focus();
  }, [status]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const signup = readSignup(event.currentTarget);
    if ("error" in signup) {
      setStatus("error");
      setMessage(signup.error);
      track("waitlist_form_error", { reason: "validation" });
      return;
    }
    const payload = JSON.stringify(signup);
    pending.current = true;
    setStatus("loading");
    setMessage("");
    try {
      if (!request.current || request.current.payload !== payload)
        request.current = { id: crypto.randomUUID(), payload };
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": request.current.id,
        },
        body: payload,
        signal: AbortSignal.timeout(20_000),
      });
      let result: { accepted?: unknown; error?: unknown } | null = null;
      try {
        result = await response.json();
      } catch {
        // An unreadable response cannot confirm that the signup was accepted.
      }
      if (!response.ok || result?.accepted !== true) {
        setStatus("error");
        setMessage(
          typeof result?.error === "string" ? result.error : unconfirmed,
        );
        track("waitlist_form_error", { reason: "delivery" });
        return;
      }
      setStatus("success");
      track("waitlist_form_submitted");
      request.current = null;
    } catch {
      setStatus("error");
      setMessage(unconfirmed);
      track("waitlist_form_error", { reason: "delivery" });
    } finally {
      pending.current = false;
    }
  }

  if (status === "success")
    return (
      <div
        className="waitlist-success"
        ref={success}
        tabIndex={-1}
        role="status"
      >
        <span className="waitlist-success-mark" aria-hidden="true">
          ✓
        </span>
        <span className="mono">SIGNUP CONFIRMED</span>
        <h2>You’re on the waitlist.</h2>
        <p>
          We’ll keep you posted about early access and the Playground launch.
        </p>
        <Link href="/sample-report" className="button">
          See example findings <Arrow />
        </Link>
      </div>
    );

  return (
    <form
      ref={form}
      className="waitlist-form"
      aria-label="Join the Playground waitlist"
      aria-busy={status === "loading"}
      onSubmit={submit}
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          track("waitlist_form_started");
        }
      }}
    >
      <div className="waitlist-form-top">
        <Mark />
        <span className="mono">PLAYGROUND / EARLY ACCESS</span>
      </div>
      <div className="waitlist-form-body">
        <h2>Get early-access updates.</h2>
        <p className="waitlist-form-intro">
          Leave your email for news about early access and the launch.
        </p>
        {!available && (
          <p className="waitlist-unavailable">
            Waitlist signup is temporarily unavailable. Please check back soon.
          </p>
        )}
        <fieldset disabled={status === "loading"}>
          <legend className="waitlist-sr-only">Your signup details</legend>
          <label className="waitlist-field">
            Email
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@yourcompany.com"
              required
              maxLength={254}
            />
          </label>
          <label className="waitlist-field">
            Name (optional)
            <input
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              maxLength={100}
            />
          </label>
          <label className="waitlist-field">
            Product link (optional)
            <input
              name="productUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://your-product.com"
              maxLength={2048}
            />
            <span className="waitlist-hint">
              A website or a rough version of your product, if you have one.
            </span>
          </label>
          <div className="waitlist-honeypot" aria-hidden="true">
            <label>
              Leave this field empty
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="waitlist-consent">
            <input type="checkbox" name="consent" value="yes" required />
            <span>
              I agree to receive early-access and product launch updates from
              Playground.
            </span>
          </label>
          <p className="waitlist-privacy">
            <Link href="/privacy">
              Privacy notice <span aria-hidden="true">↗</span>
            </Link>
          </p>
          <div className="waitlist-error" role="alert">
            {status === "error" && message}
          </div>
          <button
            className="button waitlist-submit"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "Joining the waitlist…"
              : "Join the waitlist"}
            {status === "loading" ? (
              <span className="loading-indicator" aria-hidden="true" />
            ) : (
              <Arrow />
            )}
          </button>
        </fieldset>
        <p className="waitlist-footer-note">
          Early-access and launch updates from Playground.
        </p>
      </div>
    </form>
  );
}
