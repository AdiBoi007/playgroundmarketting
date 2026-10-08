import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
export const metadata: Metadata = { title: "Privacy notice", alternates: { canonical: "/privacy" } };
export default function Privacy() {
  return <main id="main" className="legal-page"><PageIntro eyebrow="YOUR INFORMATION" title="Privacy notice." /><article className="legal-copy container">
    <p>This notice covers the Playground website and its waitlist and product-brief forms. Any paid test has its own agreement about how information is used.</p>
    <h2>What you share with us</h2><p>The product-brief form asks for your name, email, product link, who it is for, and what you want to find out. The waitlist asks for your email; a name and product link are optional. Both forms ask you to agree to early-access and launch updates.</p>
    <h2>Where your details go</h2><p>When you submit either form, we use Google’s Gmail service to email your details to the Playground team. These emails are our record of your entry. This website does not keep a separate list in a database or send you an automatic email.</p><p>We use your details to review your request, reply to you, and send the updates you agreed to receive. Email records stay in our mailbox until we remove them. To ask us to stop updates or remove an entry, reply to a Playground email.</p>
    <h2>Saving a copy</h2><p>“Save a copy of your brief” downloads a text file to your device. It does not send the brief to us or add you to the waitlist. Leaving the page before sending also does not submit the form.</p>
    <h2>The examples on this site</h2><p>The sample report and its people, quotes, and results are made-up examples. They show how findings could be presented. They are not real customer records.</p>
    <h2>When you visit the website</h2><p>The website can record button clicks inside your browser. It does not send those clicks to another company, and your form details are never included in those records. The company hosting this website may process connection details to load pages and prevent misuse. This includes your IP address, which identifies your internet connection.</p>
    <h2>Keep private information out of the forms</h2><p>Please do not send passwords, payment details, or private information about other people. We agree what access is needed before a product test starts.</p>
    <h2>Questions</h2><p>For questions about information you shared, reply to a Playground email.</p>
  </article></main>;
}
