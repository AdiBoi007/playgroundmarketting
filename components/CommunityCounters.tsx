"use client";

import { useEffect, useRef } from "react";

const numberFormat = new Intl.NumberFormat("en-AU");
const goals = [
  { value: 2000, label: "Pilot testers", examples: null },
  { value: 50, label: "Industries & domains", examples: "Tech, fashion, B2B, finance and more." },
] as const;

function GoalCounter({ value }: { value: number }) {
  const digits = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = digits.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      element.textContent = numberFormat.format(value);
    };
    if (motion.matches) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (motion.matches) return finish();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1500, 1);
        element.textContent = numberFormat.format(Math.round(value * (1 - (1 - progress) ** 3)));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.5 });

    observer.observe(element);
    const stop = () => { observer.disconnect(); finish(); };
    motion.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", stop);
      finish();
    };
  }, [value]);

  return <strong className="why-goal-number"><span className="sr-only">{numberFormat.format(value)} plus</span><span aria-hidden="true"><span ref={digits}>{numberFormat.format(value)}</span><span className="why-goal-plus">+</span></span></strong>;
}

export function CommunityCounters() {
  return (
    <div className="why-community-goals">
      <div className="why-goals-heading"><p className="why-eyebrow">COMMUNITY TARGETS</p><span className="why-growing"><i aria-hidden="true" />Still building</span></div>
      <div className="why-goal-grid">
        {goals.map(goal => (
          <div className="why-goal" key={goal.label}>
            <GoalCounter value={goal.value} />
            <div><h3>{goal.label}</h3>{goal.examples ? <p className="why-goal-examples">{goal.examples}</p> : null}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
