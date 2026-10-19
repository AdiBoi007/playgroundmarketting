import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SignupPaths } from "@/components/SignupPaths";
import { Arrow, Eyebrow } from "@/components/ui/Primitives";
import { hasGmailConfiguration } from "@/lib/gmail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Get early access",
  description: "Get early access to pilot customers for your idea, prototype or next feature. Choose LinkedIn, phone or email so we can get in touch.",
  alternates: { canonical: "/waitlist" },
};

export default function WaitlistPage() {
  return (
    <main id="main" className="waitlist-page signup-page">
      <SignupPaths active="waitlist" />
      <div className="container waitlist-layout">
        <div className="waitlist-copy">
          <Eyebrow>YOUR PILOT CUSTOMERS START HERE</Eyebrow>
          <h1>Find your<br /><span>pilot customers.</span></h1>
          <p>Reach people who face the problem you’re solving. We find them and test with them.</p>
          <Link className="text-link waitlist-preview-link" href="/run-a-test">Have a product link? Request a test <Arrow /></Link>
        </div>
        <WaitlistForm available={hasGmailConfiguration()} />
      </div>
    </main>
  );
}
