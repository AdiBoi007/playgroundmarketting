"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { Arrow } from "@/components/ui/Primitives";
import styles from "./ProductJourney.module.css";

const stages = [
  {
    id: "idea", name: "Idea", label: "BEFORE YOU BUILD",
    title: "Is the problem worth solving?",
    audience: "People who have the problem.",
    test: "How they solve it today and what they think of your idea.",
    decision: "Who needs it and whether it’s worth building.",
    question: "Do people need this idea, and who should I build it for?",
    href: "/waitlist",
    paths: ["M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3Z", "M9 20h6M12 7v4"],
  },
  {
    id: "prototype", name: "Prototype", label: "BEFORE YOU BUILD IT OUT",
    title: "Can people use it?",
    audience: "People who would use your product.",
    test: "Can they complete the main task without help?",
    decision: "What to make clearer before you build.",
    question: "Can my pilot customers complete the key task in my prototype?",
    paths: ["M3 4h18v16H3ZM3 9h18M9 9v11", "m13 12 5 3-5 2Z"],
  },
  {
    id: "mvp", name: "First version", label: "BEFORE YOU GO ALL IN",
    title: "Does the first version help?",
    audience: "People who need what your product offers.",
    test: "Signup, the main task, and what gets in the way.",
    decision: "What’s useful, what’s missing, and what to fix.",
    question: "Can my pilot customers get what they need from the first version?",
    paths: ["M4 3h16v18H4ZM4 8h16", "m8 14 3 3 5-6"],
  },
  {
    id: "launch", name: "Launch", label: "BEFORE THE BIG REVEAL",
    title: "Ready for your first customers?",
    audience: "Potential customers in your launch market.",
    test: "Do they understand the offer and know how to start?",
    decision: "What to improve before launch.",
    question: "Do my pilot customers understand the offer and reach the first useful action?",
    paths: ["M14 4c3-1 6-1 6-1s0 3-1 6l-7 7-5-5 7-7Z", "m7 11-4 1 4 3M12 16l-1 5-2-4M5 18l-2 3 3-2M15 8h.01"],
  },
  {
    id: "features", name: "New features", label: "BEFORE THE NEXT RELEASE",
    title: "Does the new feature help?",
    audience: "Customers who would use the feature.",
    test: "Can they find it and use it to finish a task?",
    decision: "What to keep, simplify, or change.",
    question: "Does my new feature make the task easier for my pilot customers?",
    paths: ["M4 4h16v16H4ZM8 12h8M12 8v8"],
  },
] as const;

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(change: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
function getReducedMotion() { return window.matchMedia(motionQuery).matches; }
function getServerReducedMotion() { return true; }

export function ProductJourney() {
  const [active, setActive] = useState(0);
  const [rotation, setRotation] = useState<"auto" | "playing" | "paused">("auto");
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, getServerReducedMotion);
  const playing = rotation === "playing" || (rotation === "auto" && !reducedMotion);
  const rotating = playing && !hovered && inView;
  const section = useRef<HTMLElement>(null);
  const control = useRef<HTMLButtonElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .1 });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(index => (index + 1) % stages.length);
    }, 8_000);
    return () => window.clearInterval(timer);
  }, [rotating]);

  function select(index: number) {
    setRotation("paused");
    setActive(index);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % stages.length
      : event.key === "ArrowLeft" ? (index + stages.length - 1) % stages.length
        : event.key === "Home" ? 0 : event.key === "End" ? stages.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    select(next);
    buttons.current[next]?.focus();
  }

  return (
    <section ref={section} id="product-journey" className={styles.section} aria-labelledby="journey-title">
      <div className="container">
        <div className={styles.heading}>
          <h2 id="journey-title">Pilot customers.<br /><span className="blue-text">At every stage.</span></h2>
          <p>Pick your stage. We’ll find the right people.</p>
        </div>
        <div className={styles.canvas} data-rotating={rotating}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          onFocusCapture={event => { if (!control.current?.contains(event.target)) setRotation("paused"); }}>
          <div className={styles.diagramLabel}>
            <span className="mono">YOUR STAGE</span>
            <div className={styles.rotationControls}>
              <span>Pick a stage</span>
              <button ref={control} type="button" className={styles.rotationButton} aria-label={playing ? "Pause stage rotation" : "Play stage rotation"}
                onClick={() => setRotation(playing ? "paused" : "playing")}>
                <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>{playing ? "Pause" : "Play"}
              </button>
            </div>
          </div>
          <div className={styles.rail} role="tablist" aria-label="Your product stage" style={{ "--journey-progress": `${active * 20}%` } as CSSProperties}>
            {stages.map((stage, index) => (
              <button key={stage.id} ref={node => { buttons.current[index] = node; }} type="button" role="tab"
                id={`journey-tab-${stage.id}`} aria-controls={`journey-panel-${stage.id}`} aria-selected={active === index}
                tabIndex={active === index ? 0 : -1} onClick={() => select(index)} onKeyDown={event => navigate(event, index)} className={styles.stage}>
                <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{stage.paths.map(path => <path d={path} key={path} />)}</svg></span>
                <span className={styles.stageName}>{stage.name}</span>
              </button>
            ))}
          </div>
          <div className={styles.panels} aria-live="off">
          {stages.map((stage, index) => (
            <div key={stage.id} className={styles.panel} id={`journey-panel-${stage.id}`} role="tabpanel" aria-labelledby={`journey-tab-${stage.id}`} tabIndex={active === index ? 0 : -1} hidden={active !== index} inert={active !== index}>
              <div className={styles.panelCopy}>
                <span className={styles.label}>{stage.label}</span>
                <h3>{stage.title}</h3>
              </div>
              <div className={styles.audience}>
                <span className={styles.label}>WHO WE FIND</span>
                <p>{stage.audience}</p>
              </div>
              <div className={styles.test}><span className={styles.label}>WHAT WE TEST</span><p>{stage.test}</p></div>
              <div className={styles.decision}><span className={styles.label}>WHAT YOU LEARN</span><p>{stage.decision}</p></div>
              <div className={styles.action}><Link className="button" href={"href" in stage ? stage.href : `/run-a-test?focus=${encodeURIComponent(stage.question)}`}>Find pilot customers <Arrow /></Link><span>{index === 0 ? "Start with an idea. No product link needed." : "Price and timing agreed upfront."}</span></div>
            </div>
          ))}
          </div>
          <noscript><div className={styles.fallback}><p>Playground finds pilot customers at every stage:</p><ul>{stages.map(stage => <li key={stage.id}><strong>{stage.name}:</strong> {stage.test}</li>)}</ul></div></noscript>
        </div>
      </div>
    </section>
  );
}
