import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";
import { Eyebrow } from "@/components/ui/Primitives";
import { hasGmailConfiguration } from "@/lib/gmail";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Share your product",
  description:
    "Share your product or prototype, who it is for and what you want to find out. Send a brief to Playground and join the early-access waitlist.",
  alternates: { canonical: "/run-a-test" },
};
export default async function RunATest({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  return (
    <main id="main" className="lead-page">
      <div className="container lead-layout">
        <div className="lead-copy">
          <Eyebrow>SHARE YOUR PRODUCT / EARLY ACCESS</Eyebrow>
          <h1>
            What are
            <br />
            <span className="blue-text">you building?</span>
          </h1>
          <p>
            Tell us who your pilot users should be and what you need to
            validate. We’re in early access, with paid tests underway.
          </p>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Tell us what you’re building</strong>
                <p>Your product, who it is for, and your question.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>We find your pilot users</strong>
                <p>We recruit your audience and test the product with them.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Get findings and next steps</strong>
                <p>Understand what happened and what to try next.</p>
              </div>
            </li>
          </ol>
          <p>
            We agree the test, price and timing with you before any paid work.
          </p>
          <div className="lead-sidebar-note">
            <span className="mono">NO PRODUCT LINK YET?</span>
            <Link href="/waitlist">Join the waitlist ↗</Link>
          </div>
          <div className="lead-sidebar-note">
            <span className="mono">WANT TO KNOW HOW IT WORKS?</span>
            <Link href="/how-it-works">See how we find and test with pilot users ↗</Link>
          </div>
        </div>
        <LeadForm
          focus={typeof focus === "string" ? focus.slice(0, 120) : ""}
          intakeAvailable={hasGmailConfiguration()}
        />
      </div>
    </main>
  );
}
