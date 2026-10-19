import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/PageIntro";
import { Arrow, DemoLabel } from "@/components/ui/Primitives";
import { FinalCTA } from "@/components/home/Narrative";
export const metadata: Metadata = {
  title: "How it works",
  description:
    "Playground finds pilot users who fit your audience and tests your idea, prototype or product with them. Get feedback before your next build or launch.",
  alternates: { canonical: "/how-it-works" },
};
const steps = [
  {
    name: "Tell us",
    heading: "Tell us who you need to reach",
    copy: "Share your stage, your intended audience and the assumption you want to test. Start with an idea, a prototype, an MVP or a new feature. We work with you to define who your pilot users should be and what you need to learn.",
    output: "A target audience and a clear question",
    label: "EXAMPLE QUESTION",
    detail: "Will freelancers trust this tool to send an invoice?",
  },
  {
    name: "Match",
    heading: "We find your pilot users and run the test",
    copy: "We recruit people who fit your audience, plan the tasks and test with them. That could mean exploring a problem before you build or watching people try a product. We agree the audience, test, price and timing with you before paid work starts. AI and field experts can support questions that need them.",
    output: "Relevant pilot users and a test around your question",
    label: "EXAMPLE TEST",
    detail: "Ask freelancers to prepare and send a first invoice.",
    extra: "Watch where they stop and ask what they expected.",
  },
  {
    name: "Learn",
    heading: "Get findings and next steps",
    copy: "See what happened, what it means for your product, and what to try next. We explain the limits of the test alongside the findings. You can use them to improve an idea, change a feature, explore a new market or plan a release.",
    output: "Findings you can use in your next decision",
    label: "EXAMPLE NEXT STEP",
    detail: "Let people check the invoice before it sends.",
    extra: "Then test whether that change helps them finish.",
  },
];
export default function HowItWorks() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="HOW PLAYGROUND WORKS"
        title={
          <>
            Find your people.
            <br />
            <span className="blue-text">Test your product.</span>
          </>
        }
      >
        <p>
          Get access to pilot users who fit your audience.
          <br />
          We find them, test with them, and help you decide what comes next.
        </p>
        <Link href="/waitlist" className="text-link">
          Find my pilot users <Arrow />
        </Link>
      </PageIntro>
      <section
        className="process-section container"
        aria-label="The three steps of a Playground test"
      >
        {steps.map((step, i) => (
          <article className="process-step" key={step.name} data-reveal>
            <div className="process-marker">
              <span>0{i + 1}</span>
              <span>{step.name}</span>
            </div>
            <div className="process-copy">
              <h2>{step.heading}</h2>
              <p>{step.copy}</p>
              <span className="process-output">
                <span aria-hidden="true">↳</span> {step.output}
              </span>
            </div>
            <div className="process-art">
              <div className="process-art-top">
                <span className="mono">{step.label}</span>
                <DemoLabel>EXAMPLE</DemoLabel>
              </div>
              <strong>{step.detail}</strong>
              {step.extra && <p>{step.extra}</p>}
            </div>
          </article>
        ))}
      </section>
      <div className="process-note container">
        <span className="mono">PEOPLE AND AI</span>
        <p>
          AI can try likely situations.
          <br />
          <strong>People show what they actually do.</strong>
        </p>
        <Link className="text-link" href="/about">
          Read our approach <Arrow />
        </Link>
      </div>
      <FinalCTA />
    </main>
  );
}
