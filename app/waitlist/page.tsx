import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SignupPaths } from "@/components/SignupPaths";
import { Arrow, Eyebrow } from "@/components/ui/Primitives";
import { hasGmailConfiguration } from "@/lib/gmail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Get early access",
  description: "Get early access to pilot users and product testing with Playground. Validate your idea, prototype or next feature with the right people.",
  alternates: { canonical: "/waitlist" },
};

export default function WaitlistPage() {
  return (
    <main id="main" className="waitlist-page signup-page">
      <SignupPaths active="waitlist" />
      <div className="container waitlist-layout">
        <div className="waitlist-copy">
          <Eyebrow>PILOT USERS + PRODUCT VALIDATION</Eyebrow>
          <h1>Find your<br /><span>pilot users.</span></h1>
          <p>Reach people who fit your audience. We find your pilot users, test your assumptions with them, and help you decide what to build or change next.</p>
          <ol className="signup-promises">
            <li><div><strong>Tell us who you need.</strong><p>Your stage, your audience, and the assumption you want to test.</p></div></li>
            <li><div><strong>We find them and test with them.</strong><p>Relevant pilot users and a test built around your question.</p></div></li>
            <li><div><strong>Build on what you learn.</strong><p>Validate your next move before another build, launch or feature release.</p></div></li>
          </ol>
          <div className="signup-editorial"><span className="mono">BUILD WITH BETTER ANSWERS</span><p>Real people.<br />Useful feedback.<br /><strong>A clearer next move.</strong></p></div>
          <Link className="text-link waitlist-preview-link" href="/run-a-test">Have a product ready? Send a brief <Arrow /></Link>
        </div>
        <WaitlistForm available={hasGmailConfiguration()} />
      </div>
    </main>
  );
}
