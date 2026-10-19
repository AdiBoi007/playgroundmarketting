import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import { Arrow, Mark } from "@/components/ui/Primitives";
import { PilotProcess } from "@/components/PilotProcess";

export function Assumptions() {
  const notes = [
    "They need this.",
    "They’ll get it.",
    "They’ll sign up.",
    "They’ll pay.",
    "They’ll use it.",
    "They’ll come back.",
  ];
  return (
    <section id="product" className="assumptions home-assumptions home-section" aria-labelledby="assumptions-title">
      <div className="container">
        <div className="assumptions-heading" data-reveal>
          <h2 id="assumptions-title">Your product is full<br />of <span className="underlined">assumptions.</span></h2>
          <p>Test the big guesses before they become expensive builds.</p>
        </div>
        <div className="assumption-wall" data-reveal>
          {notes.map((text, index) => (
            <div className={`assumption-note note-${index}`} key={text}>
              <span className="note-tack" aria-hidden="true" />
              <span className="mono">ASSUMPTION 0{index + 1}</span>
              <p>“{text}”</p>
              <span className="note-unverified">UNTESTED <span aria-hidden="true">↗</span></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EnterPlayground() {
  return <PilotProcess />;
}

const questions = [
  { question: "Can I start with just an idea?", answer: "Yes. No finished product needed. Join early access and tell us what you’re working on when we get in touch." },
  { question: "What am I paying for?", answer: "Finding your pilot customers, planning and running the test, and findings with recommended next steps. We agree the price and timing before paid work starts." },
  { question: "Will pilot customers become paying customers?", answer: "Pilot customers fit your audience and could use your product. Taking part in a test doesn’t mean they’ll buy. Sales aren’t guaranteed." },
  { question: "Can I request a test now?", answer: "Yes. Early paid tests are underway. Send a test request if you have a product link, or join early access with an idea. We review your request and agree the plan before booking a test." },
];

export function WhyPlayground() {
  return (
    <section className="home-questions home-section" aria-labelledby="questions-title">
      <div className="container home-faq-layout">
        <div className="home-faq-copy" data-reveal><h2 id="questions-title">Before<br /><span className="blue-text">you start.</span></h2></div>
        <div className="home-faq-list" data-reveal>{questions.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="closing-section">
      <div className="container closing-layout" data-reveal>
        <Mark className="closing-mark" />
        <h2>Before your next build,<br /><span>find your next customers.</span></h2>
        <div className="home-actions">
          <TrackedLink href="/waitlist" className="button button-light" event="final_cta_click">Get early access <Arrow /></TrackedLink>
          <Link href="/run-a-test" className="closing-link">Have a product? Request a test <Arrow /></Link>
        </div>
      </div>
    </section>
  );
}
