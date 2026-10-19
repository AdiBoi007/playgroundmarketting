"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Arrow, Avatar, Eyebrow } from "@/components/ui/Primitives";
import styles from "./ProductJourney.module.css";

const stages = [
  {
    id: "idea", name: "Idea", label: "BEFORE YOU BUILD",
    title: "Find the people with the problem.",
    copy: "You don’t need a finished product to start learning. Put your idea in front of people who live with the problem you want to solve.",
    audience: "People who face the problem you’re exploring.",
    criteria: ["The right problem", "The right audience"],
    test: "Explore their current workarounds, what frustrates them, and how they respond to your idea.",
    decision: "Whether the problem matters, who to build for, and which assumption to test next.",
    question: "Do people need this idea, and who should I build it for?",
    href: "/waitlist", cta: "Find pilot users for my idea",
    paths: ["M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3Z", "M9 20h6M12 7v4"],
  },
  {
    id: "prototype", name: "Prototype", label: "BEFORE YOU BUILD IT OUT",
    title: "Put the rough version in real hands.",
    copy: "A clickable prototype is enough to uncover a confusing flow. We find people who fit your audience and watch them try the task you designed.",
    audience: "People who would use the workflow you’re designing.",
    criteria: ["Relevant tasks", "Real workflows"],
    test: "Ask people to complete a key task without a walkthrough. See what they understand and where they get stuck.",
    decision: "What to change in the flow before you spend more time building it.",
    question: "Can my pilot users complete the key task in my prototype?",
    cta: "Test my prototype with pilot users",
    paths: ["M3 4h18v16H3ZM3 9h18M9 9v11", "m13 12 5 3-5 2Z"],
  },
  {
    id: "mvp", name: "MVP", label: "BEFORE YOU GO ALL IN",
    title: "Find out if the first version delivers.",
    copy: "Your core product works. Now see whether it works for the people it’s meant for, from their first signup to the moment they get value.",
    audience: "Early users who fit your intended customer profile.",
    criteria: ["Customer fit", "Core use case"],
    test: "Test onboarding and the core workflow. Ask what feels useful, what’s missing, and what gets in the way.",
    decision: "Which friction to fix and what to validate before investing in the next version.",
    question: "Can my pilot users get value from the core workflow in my MVP?",
    cta: "Find pilot users for my MVP",
    paths: ["M4 3h16v18H4ZM4 8h16", "m8 14 3 3 5-6"],
  },
  {
    id: "launch", name: "Launch", label: "BEFORE THE BIG REVEAL",
    title: "Make the first impression count.",
    copy: "Get your launch experience in front of fresh eyes. We test with people who match your audience so you can see what lands before you go wider.",
    audience: "Prospective users in the market you’re launching into.",
    criteria: ["Your launch market", "Fresh perspective"],
    test: "Check the offer, the first impression, and the journey from landing page to first useful action.",
    decision: "What needs work before launch and which questions still need a bigger test.",
    question: "Do my pilot users understand the offer and reach the first useful action?",
    cta: "Test with pilot users before launch",
    paths: ["M14 4c3-1 6-1 6-1s0 3-1 6l-7 7-5-5 7-7Z", "m7 11-4 1 4 3M12 16l-1 5-2-4M5 18l-2 3 3-2M15 8h.01"],
  },
  {
    id: "features", name: "New features", label: "BEFORE THE NEXT RELEASE",
    title: "Test the next feature before you ship it.",
    copy: "Every addition brings a new assumption. Find relevant users, test the change in context, and learn whether it actually helps them do the job.",
    audience: "People who need the task your new feature is meant to improve.",
    criteria: ["Feature relevance", "Everyday context"],
    test: "Let people discover and try the feature in a realistic task. See whether it makes the workflow clearer or harder.",
    decision: "What to ship, what to simplify, and what to test again after the change.",
    question: "Does my new feature improve the workflow for the people who need it?",
    cta: "Find users to test my next feature",
    paths: ["M4 4h16v16H4ZM8 12h8M12 8v8"],
  },
] as const;

export function ProductJourney() {
  const [active, setActive] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % stages.length
      : event.key === "ArrowLeft" ? (index + stages.length - 1) % stages.length
        : event.key === "Home" ? 0 : event.key === "End" ? stages.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  }

  return (
    <section id="product-journey" className={styles.section} aria-labelledby="journey-title">
      <div className="container">
        <div className={styles.heading}>
          <div><Eyebrow>YOUR PRODUCT. EVERY STAGE.</Eyebrow><h2 id="journey-title">Wherever you are,<br /><span className="blue-text">your pilot users are out there.</span></h2></div>
          <p>We find them. You learn from them. From the first idea to the next feature, test your assumptions with people your product is built for.</p>
        </div>
        <div className={styles.canvas}>
          <div className={styles.diagramLabel}><span className="mono">THE PRODUCT JOURNEY</span><span>Choose your stage <span aria-hidden="true">↓</span></span></div>
          <div className={styles.rail} role="tablist" aria-label="Your product stage" style={{ "--journey-progress": `${active * 20}%` } as CSSProperties}>
            {stages.map((stage, index) => (
              <button key={stage.id} ref={node => { buttons.current[index] = node; }} type="button" role="tab"
                id={`journey-tab-${stage.id}`} aria-controls={`journey-panel-${stage.id}`} aria-selected={active === index}
                tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => navigate(event, index)} className={styles.stage}>
                <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{stage.paths.map(path => <path d={path} key={path} />)}</svg></span>
                <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
                <span className={styles.stageName}>{stage.name}</span>
              </button>
            ))}
          </div>
          <p className={styles.repeat}><span aria-hidden="true">↻</span> Find people. Test. Learn. Improve. Repeat.</p>
          {stages.map((stage, index) => (
            <div key={stage.id} className={styles.panel} id={`journey-panel-${stage.id}`} role="tabpanel" aria-labelledby={`journey-tab-${stage.id}`} tabIndex={0} hidden={active !== index}>
              <div className={styles.panelCopy}>
                <span className={styles.label}>{stage.label}</span>
                <h3>{stage.title}</h3>
                <p>{stage.copy}</p>
              </div>
              <div className={styles.audience}>
                <div className={styles.people} aria-hidden="true">{[0, 1, 2].map(person => <Avatar index={person} key={person} />)}<span>↗</span></div>
                <span className={styles.label}>WHO WE FIND</span>
                <p>{stage.audience}</p>
                <ul>{stage.criteria.map(criterion => <li key={criterion}>{criterion}</li>)}</ul>
              </div>
              <div className={styles.test}><span className={styles.label}>WHAT WE TEST</span><p>{stage.test}</p></div>
              <div className={styles.decision}><span className={styles.label}>WHAT YOU LEARN</span><p>{stage.decision}</p></div>
              <div className={styles.action}><Link className="button" href={"href" in stage ? stage.href : `/run-a-test?focus=${encodeURIComponent(stage.question)}`}>{stage.cta} <Arrow /></Link><span>{index === 0 ? "Start with an idea. No product link needed." : "Audience, test, price and timing agreed before we start."}</span></div>
            </div>
          ))}
          <noscript><div className={styles.fallback}><p>Playground finds pilot users at every stage:</p><ul>{stages.map(stage => <li key={stage.id}><strong>{stage.name}:</strong> {stage.test}</li>)}</ul></div></noscript>
        </div>
        <p className={styles.footnote}>First test the assumption. Then make your next move.</p>
      </div>
    </section>
  );
}
