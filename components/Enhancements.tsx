"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function Enhancements() {
  const pathname = usePathname();
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    let observer: IntersectionObserver | undefined;
    const revealAll = () => targets.forEach(target => target.classList.add("is-visible"));
    const setup = () => {
      observer?.disconnect();
      if (media.matches || !("IntersectionObserver" in window)) {
        revealAll();
        return;
      }
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.06, rootMargin: "0px 0px 25px 0px" });
      targets.forEach(target => {
        if (target.getBoundingClientRect().top <= window.innerHeight) target.classList.add("is-visible");
        else {
          target.classList.add("will-reveal");
          observer?.observe(target);
        }
      });
    };
    setup();
    media.addEventListener("change", setup);
    const focusReveal = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      event.target.closest("[data-reveal]")?.classList.add("is-visible");
    };
    document.addEventListener("focusin", focusReveal);
    let frame = 0;
    const paint = () => {
      frame = 0;
      const height = document.documentElement.scrollHeight - innerHeight;
      const ratio = height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0;
      if (progress.current) progress.current.style.transform = `scaleX(${ratio})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    paint();
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", setup);
      document.removeEventListener("focusin", focusReveal);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return <div className="site-reading-progress" ref={progress} aria-hidden="true" />;
}
