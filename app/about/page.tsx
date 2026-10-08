import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageIntro } from "@/components/PageIntro";
import { Arrow, Eyebrow } from "@/components/ui/Primitives";
export const metadata: Metadata = {
  title: "Our approach",
  description:
    "Playground helps teams find out whether people need and can use what they’re building, with tests chosen for the question and honest limits on the findings.",
  alternates: { canonical: "/about" },
};
export default function About() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="WHY PLAYGROUND EXISTS"
        title={
          <>
            Good products deserve
            <br />
            a <span className="blue-text">reality check.</span>
          </>
        }
      >
        <p>
          It’s easier to make a product than to know whether anyone wants it.
          <br />
          Playground helps you find out before you invest more in it.
        </p>
      </PageIntro>
      <div className="about-world">
        <Image
          src="/brand/playground-landscape.png"
          width={1672}
          height={941}
          sizes="100vw"
          alt="A sunlit coastal trail winding toward a hilltop"
        />
      </div>
      <section className="about-editorial section container">
        <div>
          <Eyebrow>OUR POINT OF VIEW</Eyebrow>
          <h2>
            Make something
            <br />
            people need.
          </h2>
        </div>
        <div className="editorial-body">
          <p>
            A working product leaves plenty of questions unanswered. Does it
            solve a problem people care about? Can they understand it? Will it
            fit the way they work? What happens when they try it for themselves?
          </p>
          <p>
            Playground helps choose what to test, how to test it, and who should
            take part. The right test might use real people, AI to try likely
            situations, or qualified experts with experience in the field.
            It depends on what you need to learn.
          </p>
          <p>
            We’re in early access, with paid tests underway. We work with teams
            to plan a useful test and agree the test, price and timing before any
            paid work. You can start with an idea and return as your product
            changes.
          </p>
          <strong>
            Find out what happens.
            <br />
            Use it to decide what to do next.
          </strong>
        </div>
      </section>
      <section className="research-principles container">
        <Eyebrow>HOW WE APPROACH A TEST</Eyebrow>
        {[
          {
            title: "Start with the question.",
            copy: "An idea, a rough version, a new feature, a new market and a release can need different tests. We choose the approach around what you want to find out.",
          },
          {
            title: "People and AI tell us different things.",
            copy: "AI can try likely situations. People show what they actually do. We make clear which findings came from people and which came from AI.",
          },
          {
            title: "Use expertise where it helps.",
            copy: "A recruiter may help review a hiring tool; a finance professional may help review a money tool. A security question needs a qualified reviewer and a clear agreement about what to check. We discuss the experience needed and who is available before starting.",
          },
          {
            title: "Explain what the test can tell you.",
            copy: "A few people can reveal useful problems, but they don’t speak for a whole market. We share who took part, what they tried and the limits of the findings alongside our suggested next steps.",
          },
          {
            title: "Change it. Then try it again.",
            copy: "Use the findings to make a change, then test the next important question. Comparing what happened helps you see whether the change helped and what still needs work.",
          },
        ].map((item, i) => (
          <article key={item.title} data-reveal>
            <span className="mono">0{i + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>
      <section className="about-closing section container">
        <h2>
          Why did they
          <br />
          stop at “send”?
        </h2>
        <div>
          <p>A fictional invoice-app test, with findings and suggested changes.</p>
          <Link className="button" href="/sample-report">
            Open sample report <Arrow />
          </Link>
        </div>
      </section>
    </main>
  );
}
