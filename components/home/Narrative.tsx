import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import { Arrow, Avatar, Eyebrow, Mark } from "@/components/ui/Primitives";
import { UseCases } from "@/components/home/UseCases";

export function Assumptions() {
  const notes = [
    "They’ll know how to get started.",
    "They’ll trust it to send.",
    "They’ll pay $49.",
    "They’ll find that feature.",
    "They’ll know what to do next.",
    "They’ll come back.",
  ];
  return (
    <section id="product" className="assumptions home-assumptions home-section">
      <div className="container">
        <Eyebrow>THE THINGS YOU THINK YOU KNOW</Eyebrow>
        <div className="assumptions-heading" data-reveal>
          <h2>Your product is full<br />of <span className="underlined">assumptions.</span></h2>
          <p>Before you build around a guess,<br />put it in front of your pilot users.</p>
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
        <div className="assumptions-bottom" data-reveal>
          <p>You can debate them.<br /><strong>Or test them.</strong></p>
          <span className="dry-note">“looks good to me”<br /><span>famous last words.</span></span>
          <svg viewBox="0 0 100 80" fill="none" aria-hidden="true"><path d="M4 5c52-12 93 11 72 36-9 11-32 12-35 1-4-14 37-14 42 27m-15-9 15 12 9-17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
      </div>
    </section>
  );
}

export function EnterPlayground() {
  return (
    <section className="home-how home-section">
      <div className="container">
        <div className="home-heading-row" data-reveal><div><Eyebrow>HOW PLAYGROUND WORKS</Eyebrow><h2>Your audience.<br /><span className="blue-text">Found. Matched. Tested.</span></h2></div><Link href="/how-it-works" className="text-link">How it works <Arrow /></Link></div>
        <div className="home-step-grid">
          {[
            { title: "Tell us who you need", copy: "Share your idea, stage, target audience and the assumption you want to test.", detail: "“Will freelancers trust this to send their invoices?”", icon: "?" },
            { title: "We find your pilot users", copy: "We recruit people who fit your audience and run a test around your question. Audience, scope, price and timing are agreed upfront.", detail: "Five freelancers. One invoice. No walkthrough.", icon: "↗" },
            { title: "Learn before your next move", copy: "See what your pilot users did, where they struggled, and what to improve before you build or release the next version.", detail: "“Let them review the invoice before it sends.”", icon: "✓" },
          ].map((item, index) => <article className="home-step" key={item.title} data-reveal style={{ "--reveal-delay": `${index * 85}ms` } as CSSProperties}><div className="home-step-top"><span>0{index + 1}</span><span aria-hidden="true">{item.icon}</span></div><h3>{item.title}</h3><p>{item.copy}</p><div className="home-step-example"><span>EXAMPLE</span><p>{item.detail}</p></div></article>)}
        </div>
      </div>
    </section>
  );
}

export function Matching() {
  return (
    <section className="home-methods home-section">
      <div className="container">
        <div className="home-section-heading" data-reveal><Eyebrow>RELEVANCE COMES FIRST</Eyebrow><h2>People your product<br /><span className="blue-text">is actually built for.</span></h2><p>A hiring tool needs recruiters. An invoicing app needs people who send invoices. We find pilot users who fit the work, the problem and the audience.</p></div>
        <div className="home-method-grid">
          <article className="home-method-card" data-reveal><div className="method-people-art" aria-hidden="true">{[0, 1, 2].map(index => <Avatar key={index} index={index} />)}</div><span className="home-method-label">REAL PEOPLE</span><h3>Let your customers<br />surprise you.</h3><p>People who fit your audience try your product. You see what makes sense, what gets missed, and where they stop.</p><span className="home-method-example">“Can someone finish signing up?”</span></article>
          <article className="home-method-card method-ai" data-reveal><div className="method-ai-art" aria-hidden="true"><span>↗</span><i /><i /><i /></div><span className="home-method-label">AI</span><h3>Let AI try<br />the what-ifs.</h3><p>AI can act out different types of users and situations to find possible problems. Real people check the parts that depend on human choices.</p><span className="home-method-example">“What might a first-time user miss?”</span></article>
          <article className="home-method-card method-expert" data-reveal><div className="method-expert-art" aria-hidden="true"><span>✓</span><span className="expert-orbit" /></div><span className="home-method-label">FIELD EXPERTS</span><h3>Bring in someone<br />who’s done the job.</h3><p>A recruiter for hiring software. A finance professional for a money tool. A qualified security reviewer when the risks need that expertise.</p><span className="home-method-example">“Does this fit a recruiter’s day?”</span></article>
        </div>
        <p className="home-method-note">We agree the question, the people involved, and the test with you before starting.</p>
      </div>
    </section>
  );
}

export function UseCaseSection() {
  return (
    <section className="home-every-stage home-section">
      <div className="container"><div className="home-section-heading" data-reveal><Eyebrow>MAKE THE NEXT DECISION WITH REAL FEEDBACK</Eyebrow><h2>What do you need<br /><span className="blue-text">to validate?</span></h2><p>Demand, pricing, usability or the next feature. Start with one assumption and test it with people who fit your audience.</p></div><UseCases /></div>
    </section>
  );
}

const questions = [
  { question: "What do you mean by pilot users?", answer: "People who fit your target audience and take part in testing your idea or product. We recruit for the problem, role or workflow you need to understand, then test with them so you can learn what matters before your next product decision." },
  { question: "What can I test?", answer: "An idea, a rough version, a live product, or a new feature. Start with one question: do people want it, can they use it, or what needs to change before launch?" },
  { question: "Do I need a finished product?", answer: "No. A rough version can be enough to learn from. If you don’t have a product link yet, join the waitlist and tell us what you’re working on when we get in touch." },
  { question: "Will every test use AI?", answer: "No. The question decides the test. AI can help explore possible problems. Real people show how they use your product. Field experts help with questions that need specialist knowledge." },
  { question: "Can a test prove that people will buy?", answer: "A test can help you check whether people care about the problem and how they respond to the product and price. It cannot promise sales. The report explains what the test shows and what still needs checking." },
  { question: "What am I paying for?", answer: "Finding relevant pilot users, planning the test, running it with them, and turning what we learn into findings and next steps. Scope, price and timing depend on your audience and question, and are agreed before paid work starts." },
  { question: "Can I use Playground now?", answer: "We’re running early paid tests and building toward a public launch. Join the waitlist for access updates, or send a test brief so we can review what you need. Sending a brief does not book a test." },
];
export function WhyPlayground() {
  return (
    <section className="home-questions home-section">
      <div className="container home-faq-layout">
        <div className="home-faq-copy" data-reveal><Eyebrow>A FEW USEFUL ANSWERS</Eyebrow><h2>Clear before<br /><span className="blue-text">you commit.</span></h2><p>Start with the question that matters to you. We’ll work out the next step together.</p><div className="home-stage-note"><span className="home-live-dot" /><div><strong>Paid tests underway.</strong><p>Public launch coming next.</p></div></div><Image src="/brand/city-skyline.jpeg" width={300} height={168} alt="" className="home-city" sizes="300px" /></div>
        <div className="home-faq-list" data-reveal>{questions.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}<Link href="/run-a-test" className="text-link">Tell us what you want to test <Arrow /></Link></div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="closing-section"><div className="container closing-layout" data-reveal><Mark className="closing-mark" /><Eyebrow>YOUR NEXT USERS ARE OUT THERE</Eyebrow><h2>Find your people.<br /><span>Test your next move.</span></h2><p>From the first idea to the next feature. Reach relevant pilot users and learn before you build.</p><div className="home-actions"><TrackedLink href="/waitlist" className="button button-light" event="final_cta_click">Find my pilot users <Arrow /></TrackedLink><Link href="/run-a-test" className="closing-link">Have a product ready? Send a brief <Arrow /></Link></div><span className="closing-footnote">EARLY ACCESS · PILOT USERS + PRODUCT VALIDATION</span></div></section>
  );
}
