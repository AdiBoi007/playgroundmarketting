import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
export const metadata: Metadata = { title: "Website terms", alternates: { canonical: "/terms" } };
export default function Terms() {
  return <main id="main" className="legal-page"><PageIntro eyebrow="USING THIS WEBSITE" title="Website terms." /><article className="legal-copy container">
    <p>This website explains Playground and lets you join the waitlist or share a product brief. We agree any paid test separately.</p>
    <h2>Examples show the format</h2><p>Content marked “Example”, including people, quotes, results, and suggested changes, is made up to show how Playground findings could look. It does not describe a completed customer test or promise the same results for your product.</p>
    <h2>Sending a brief</h2><p>A brief starts a conversation about your product. It does not book a test or agree a price or date. We agree what to test, the price, and the timing with you before any paid work starts. This website does not take payment.</p><p>Sending a brief also joins the waitlist with your agreement to receive early-access and launch updates. Saving a copy to your device sends nothing and creates no waitlist entry.</p>
    <h2>Joining the waitlist</h2><p>Joining tells us you are interested in early access. It does not guarantee a place, a launch date, or a booked test. You can ask us to stop updates by replying to a Playground email.</p>
    <h2>What you can share</h2><p>Share only products and rough versions you have permission to show. Do not send passwords, harmful content, or private information about other people. Do not interfere with the website or try to access other people’s information.</p>
    <h2>Making your decision</h2><p>A test can help you decide what to improve or launch. It cannot promise sales, success, or a product without problems. Read what was tested, who took part, and what still needs checking. You make the final decision.</p>
    <h2>Questions</h2><p>For questions about your brief or waitlist entry, reply to a Playground email.</p>
  </article></main>;
}
