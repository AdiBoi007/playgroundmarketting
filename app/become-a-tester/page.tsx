import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";
import { SignupPaths } from "@/components/SignupPaths";
import { Arrow, Eyebrow } from "@/components/ui/Primitives";
import { hasGmailConfiguration } from "@/lib/gmail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Get paid to test",
  description: "Get paid to try new products and share your honest feedback. Apply for Playground testing opportunities with your LinkedIn profile or phone number.",
  alternates: { canonical: "/become-a-tester" },
};

export default function BecomeATester() {
  return (
    <main id="main" className="waitlist-page signup-page tester-page">
      <SignupPaths active="tester" />
      <div className="container waitlist-layout">
        <div className="waitlist-copy">
          <Eyebrow>PLAYGROUND / PAID PRODUCT TESTING</Eyebrow>
          <h1>Get paid<br /><span>to test.</span></h1>
          <p>Try new products. Share your honest take. Earn for your time. Help teams build something better, using the experience you already have.</p>
          <ol className="signup-promises">
            <li><div><strong>Tell us a little about yourself.</strong><p>What you do, what you use, and how to reach you.</p></div></li>
            <li><div><strong>Choose a paid test that fits.</strong><p>We’ll share the task, session length and payment before you decide.</p></div></li>
            <li><div><strong>Test it. Tell it like it is. Get paid.</strong><p>Share what works and what doesn’t. Earn for your time and feedback.</p></div></li>
          </ol>
          <div className="signup-editorial"><span className="mono">YOUR OPINION HAS VALUE</span><p>New products.<br />Honest feedback.<br /><strong>Paid for your time.</strong></p></div>
          <Link className="text-link waitlist-preview-link" href="/how-it-works">See how Playground works <Arrow /></Link>
        </div>
        <SignupForm available={hasGmailConfiguration()} kind="tester" />
      </div>
      <section className="tester-questions container" aria-labelledby="tester-questions-title">
        <div><Eyebrow>LET’S TALK DETAILS</Eyebrow><h2 id="tester-questions-title">The tests.<br /><span className="blue-text">The pay. The fit.</span></h2></div>
        <div className="home-faq-list">
          <details><summary>How much can I earn?<span aria-hidden="true">+</span></summary><p>Payment varies by test. We share the amount, session length and payment details before you accept, so you can decide whether it works for you.</p></details>
          <details><summary>Do I need testing experience?<span aria-hidden="true">+</span></summary><p>No. Some tests need specialist knowledge; others need people who use a product in everyday life. Your experience and honest feedback are what count.</p></details>
          <details><summary>What will I actually do?<span aria-hidden="true">+</span></summary><p>Try a product, work through a task, and talk us through what makes sense or gets in your way. We’ll explain what’s involved before you agree to a session.</p></details>
          <details><summary>What happens after I apply?<span aria-hidden="true">+</span></summary><p>We review your profile and contact you when a paid test fits your background. You choose which invitations to accept. Opportunities depend on what teams need to test and who they need to hear from.</p></details>
        </div>
      </section>
    </main>
  );
}
