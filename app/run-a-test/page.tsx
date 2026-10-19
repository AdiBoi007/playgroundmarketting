import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";
import { Eyebrow } from "@/components/ui/Primitives";
import { hasGmailConfiguration } from "@/lib/gmail";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Request a test",
  description:
    "Share your product or prototype, who it is for and what you want to find out. Request a test with pilot customers and join Playground early access.",
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
            Tell us who you want to reach and what you want to find out. We’ll review your request and get in touch about a test.
          </p>
          <p>
            We agree the test, price and timing with you before any paid work.
          </p>
          <div className="lead-sidebar-note">
            <span className="mono">NO PRODUCT LINK YET?</span>
            <Link href="/waitlist">Join the waitlist ↗</Link>
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
