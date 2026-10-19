import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/PageIntro";
import { Arrow, DemoLabel } from "@/components/ui/Primitives";
import { FinalCTA } from "@/components/home/Narrative";
export const metadata: Metadata = {
  title: "For startups",
  description:
    "Find pilot users for your idea, prototype or next feature. Playground recruits your audience and runs tests to help you validate before you build or launch.",
  alternates: { canonical: "/startups" },
};
const examples = [
  {
    stage: "An idea",
    question: "Is this a problem people need help with?",
    href: "/waitlist",
  },
  {
    stage: "A rough version",
    question: "Can someone understand it and use it without help?",
  },
  {
    stage: "A new feature",
    question: "Does this make the task easier for the people using it?",
  },
  {
    stage: "A new market",
    question: "Does this product fit how these customers work?",
  },
  {
    stage: "A release",
    question: "What needs to change before we put this in people’s hands?",
  },
];
export default function Startups() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="FOR FOUNDERS & PRODUCT TEAMS"
        title={
          <>
            Before another
            <br />
            <span className="blue-text">weekend of building.</span>
          </>
        }
      >
        <p>
          Find the people your product is built for. We recruit relevant pilot
          users and test your idea, prototype or next feature with them, so you
          can validate the next move before you spend another sprint building.
        </p>
        <Link className="button" href="/waitlist">
          Find my pilot users <Arrow />
        </Link>
      </PageIntro>
      <section className="startup-manifesto">
        <div className="container">
          <span className="mono">YOUR AUDIENCE. YOUR ASSUMPTIONS. A REAL TEST.</span>
          <h2>
            “They’ll get it.”
            <br />
            Let’s find out.
          </h2>
          <div className="startup-principles">
            <div>
              <span className="mono">01 / REAL PEOPLE</span>
              <h3>Meet your pilot users.</h3>
              <p>
                We find people who fit your intended audience, recruit them
                for a focused test, and learn from how they respond. From
                exploring the problem to trying the product, you hear from
                people who could actually use what you’re building.
              </p>
            </div>
            <div>
              <span className="mono">02 / AI</span>
              <h3>Try likely situations.</h3>
              <p>
                AI can help explore different situations and questions before
                or alongside a test with people. It gives us things to check;
                people show what they actually do.
              </p>
            </div>
            <div>
              <span className="mono">03 / RELEVANT EXPERTS</span>
              <h3>Ask someone who knows the job.</h3>
              <p>
                Some questions need a recruiter, finance professional or
                qualified security reviewer. We discuss who is needed and what
                they can review when we plan the test.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="startup-example section container">
        <div>
          <span className="mono">EXAMPLE TEST QUESTIONS</span>
          <h2>
            What do you need
            <br />
            to find out?
          </h2>
          <DemoLabel>EXAMPLE QUESTIONS</DemoLabel>
        </div>
        <div>
          {examples.map((item, i) => (
            <Link
              key={item.stage}
              href={
                item.href ||
                `/run-a-test?focus=${encodeURIComponent(item.question)}`
              }
            >
              <span className="mono">
                0{i + 1} / {item.stage.toUpperCase()}
              </span>
              <strong>{item.question}</strong>
              <Arrow diagonal />
            </Link>
          ))}
        </div>
      </section>
      <FinalCTA />
    </main>
  );
}
