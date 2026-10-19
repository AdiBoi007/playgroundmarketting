"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow, Mark } from "@/components/ui/Primitives";
import { validateWaitlist } from "@/lib/waitlist";
import { track } from "@/lib/analytics";
import { ContactChoice } from "@/components/ContactChoice";
import { validateTester } from "@/lib/tester";
import { RESUME_ACCEPT, resumeFileError } from "@/lib/resume";

const unconfirmed = "We couldn’t confirm your signup. Please try again.";

async function readResume(file: File) {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result.slice(reader.result.indexOf(",") + 1))
      : reject(new Error("Could not read file"));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
  return { name: file.name, contentType: file.type, base64 };
}

export function SignupForm({ available, kind = "waitlist" }: { available: boolean; kind?: "waitlist" | "tester" }) {
  const isTester = kind === "tester";
  const form = useRef<HTMLFormElement>(null);
  const success = useRef<HTMLDivElement>(null);
  const request = useRef<{ id: string; payload: string } | null>(null);
  const pending = useRef(false);
  const started = useRef(false);
  const resumeInput = useRef<HTMLInputElement>(null);
  const [resumeName, setResumeName] = useState("");
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
    const values = new FormData(event.currentTarget);
    const input = {
      ...Object.fromEntries(values.entries()),
      consent: values.get("consent") === "yes",
      source: isTester ? "become-tester" : "waitlist",
    };
    const validation = isTester ? validateTester(input) : validateWaitlist(input);
    if ("error" in validation) {
      setStatus("error");
      setMessage(validation.error);
      track(isTester ? "tester_form_error" : "waitlist_form_error", { reason: "validation" });
      return;
    }
    const file = isTester ? values.get("resumeFile") : null;
    if (file instanceof File && file.name) {
      const error = resumeFileError(file.name, file.size);
      if (error) { setStatus("error"); setMessage(error); return; }
    }
    pending.current = true;
    setStatus("loading");
    setMessage("");
    try {
      let signup = validation.signup;
      if (isTester && file instanceof File && file.name) {
        const attached = validateTester({ ...signup, resume: await readResume(file) });
        if ("error" in attached) { setStatus("error"); setMessage(attached.error); return; }
        signup = attached.signup;
      }
      const payload = JSON.stringify({ ...signup, website: String(values.get("website") || "").trim() });
      if (!request.current || request.current.payload !== payload)
        request.current = { id: crypto.randomUUID(), payload };
      const response = await fetch(isTester ? "/api/testers" : "/api/waitlist", {
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
        track(isTester ? "tester_form_error" : "waitlist_form_error", { reason: "delivery" });
        return;
      }
      setStatus("success");
      track(isTester ? "tester_form_submitted" : "waitlist_form_submitted");
      request.current = null;
    } catch {
      setStatus("error");
      setMessage(unconfirmed);
      track(isTester ? "tester_form_error" : "waitlist_form_error", { reason: "delivery" });
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
        <span className="mono">{isTester ? "APPLICATION RECEIVED" : "SIGNUP CONFIRMED"}</span>
        <h2>{isTester ? "Your tester application is in." : "You’re on the waitlist."}</h2>
        <p>
          {isTester ? "We’ll contact you when a paid test fits your experience, with the task, session length and payment details. You decide whether to take part." : "We’ll contact you about early access to pilot customers and product testing using the details you shared."}
        </p>
        <Link href="/#how-it-works" className="button">
          See how testing works <Arrow />
        </Link>
      </div>
    );

  return (
    <form
      ref={form}
      className="waitlist-form"
      method="post"
      action={isTester ? "/api/testers" : "/api/waitlist"}
      aria-label={isTester ? "Become a Playground tester" : "Join the Playground waitlist"}
      aria-busy={status === "loading"}
      onSubmit={submit}
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          track(isTester ? "tester_form_started" : "waitlist_form_started");
        }
      }}
    >
      <div className="waitlist-form-top">
        <Mark />
        <span className="mono">{isTester ? "PLAYGROUND / PAID TESTER COMMUNITY" : "PLAYGROUND / EARLY ACCESS"}</span>
      </div>
      <div className="waitlist-form-body">
        <noscript><p className="waitlist-unavailable">Enable JavaScript to complete this signup.</p></noscript>
        <h2>{isTester ? "Apply for paid tests." : "Get early access."}</h2>
        <p className="waitlist-form-intro">
          {isTester ? "Share your experience and how to reach you." : "Leave one contact method. We’ll get in touch."}
        </p>
        {!available && (
          <p className="waitlist-unavailable">
            {isTester ? "Tester applications are temporarily unavailable. Please check back soon." : "Waitlist signup is temporarily unavailable. Please check back soon."}
          </p>
        )}
        <fieldset disabled={status === "loading"}>
          <legend className="waitlist-sr-only">Your signup details</legend>
          <label className="waitlist-field">
            {isTester ? "Name" : "Name (optional)"}
            <input name="name" autoComplete="name" placeholder="Your name" maxLength={100} required={isTester} />
          </label>
          {isTester && (
            <div className="signup-background">
              <label className="waitlist-field">What do you do?
                <input name="role" placeholder="e.g. Product designer, accountant, student" maxLength={150} required />
              </label>
              <label className="waitlist-field">Company (optional)
                <input name="company" autoComplete="organization" placeholder="Where you work or study" maxLength={150} />
              </label>
            </div>
          )}
          <ContactChoice disabled={status === "loading"} backgroundProfile={isTester} />
          {isTester && (
            <div className="signup-resume">
              <label className="waitlist-field" htmlFor="tester-resume">Résumé / CV (optional)</label>
              <input ref={resumeInput} id="tester-resume" className="signup-resume-input" type="file" name="resumeFile"
                accept={RESUME_ACCEPT} aria-describedby="tester-resume-note"
                onChange={event => setResumeName(event.target.files?.[0]?.name || "")} />
              <p className="signup-field-note" id="tester-resume-note">PDF or DOCX, up to 2 MB. Sent privately with your application.</p>
              {resumeName && <button className="signup-resume-remove" type="button" onClick={() => {
                if (resumeInput.current) resumeInput.current.value = "";
                setResumeName("");
              }}>Remove attachment</button>}
            </div>
          )}
          {isTester ? (
            <details className="signup-extra">
              <summary>Add your testing interests <span>(optional)</span></summary>
              <label className="waitlist-field">What would you like to test?
                <textarea name="expertise" placeholder="Industries, products or tasks you know well" maxLength={1000} rows={3} />
              </label>
            </details>
          ) : (
            <details className="signup-extra">
              <summary>Add your product <span>(optional)</span></summary>
              <label className="waitlist-field">Product link (optional)
                <input name="productUrl" type="url" inputMode="url" autoComplete="url" placeholder="https://your-product.com" maxLength={2048} />
              </label>
            </details>
          )}
          <div className="waitlist-honeypot" aria-hidden="true">
            <label>
              Leave this field empty
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="waitlist-consent">
            <input type="checkbox" name="consent" value="yes" required />
            <span>
              {isTester ? "I agree to be contacted about paid Playground testing opportunities." : "I agree to be contacted about Playground early access and launch updates."}
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
              ? (isTester ? "Sending your application…" : "Joining the waitlist…")
              : (isTester ? "Apply for paid tests" : "Join the waitlist")}
            {status === "loading" ? (
              <span className="loading-indicator" aria-hidden="true" />
            ) : (
              <Arrow />
            )}
          </button>
        </fieldset>
        <p className="waitlist-footer-note">
          {isTester ? "See the task and payment before you accept a test." : "We’ll contact you through the method you chose."}
        </p>
      </div>
    </form>
  );
}
