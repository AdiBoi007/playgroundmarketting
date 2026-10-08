import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/PageIntro";
import { Arrow, DemoLabel } from "@/components/ui/Primitives";
import { FinalCTA } from "@/components/home/Narrative";
export const metadata: Metadata = {
  title: "How it works",
  description:
    "Tell us what you’re building. Playground chooses the right test with people, AI or relevant experts, then shares findings and next steps.",
  alternates: { canonical: "/how-it-works" },
};
const steps = [
  {
    name: "Tell us",
    heading: "Tell us what you’re building",
    copy: "Share your idea, product or prototype (a rough version people can try). Tell us who it is for and what you want to find out. You can come to us before you build, while you develop a feature, or when you’re ready to release it.",
    output: "A clear question to answer",
    label: "EXAMPLE QUESTION",
    detail: "Will freelancers trust this tool to send an invoice?",
  },
  {
    name: "Choose",
    heading: "We choose the right test",
    copy: "We work out what to test, how to test it, and who should take part. That may mean people trying your product, AI trying likely situations, a review by a qualified expert, or a combination. We agree the test, price and timing with you before any paid work.",
    output: "A test that fits your question",
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
            Find the part
            <br />
            <span className="blue-text">worth fixing.</span>
          </>
        }
      >
        <p>
          Bring us the question holding up your next move.
          <br />
          We help work out what to test, how, and who should try it.
        </p>
        <Link href="/sample-report" className="text-link">
          See example findings <Arrow />
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
