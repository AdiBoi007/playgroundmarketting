import Image from "next/image";
import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import { Arrow, Avatar } from "@/components/ui/Primitives";

export function Hero() {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-landscape" aria-hidden="true">
        <Image
          className="world-art"
          src="/brand/playground-landscape.png"
          fill
          sizes="100vw"
          alt=""
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div className="container home-hero-layout">
        <div className="home-hero-copy">
          <span className="home-kicker"><span className="home-live-dot" /> EARLY ACCESS / PAID TESTS UNDERWAY</span>
          <h1 id="home-title">You built it.<br /><span>Will people<br className="hero-linebreak" /> want it?</span></h1>
          <p className="home-hero-lead">Find out what people want, where they get stuck, and what to fix before you launch.</p>
          <p className="home-hero-detail">Playground helps choose the right test for your question, with real people, AI, or experts in your field.</p>
          <div className="home-actions">
            <TrackedLink href="/waitlist" className="button" event="hero_waitlist_click">Join the waitlist <Arrow /></TrackedLink>
            <TrackedLink href="/sample-report" className="text-link" event="hero_sample_report_click">See a sample report <Arrow /></TrackedLink>
          </div>
          <p className="home-hero-stage">For your first idea. Your next feature. Every big change.</p>
        </div>
        <div className="home-hero-preview">
          <div className="hero-report-card">
            <div className="hero-card-top"><span>PLAYGROUND</span><span className="example-tag">EXAMPLE REPORT</span></div>
            <p className="hero-card-category">An invoicing app for freelancers</p>
            <h2>They liked the idea.<br />They wanted control.</h2>
            <div className="hero-test-people" aria-hidden="true">{[0, 1, 2, 3, 4].map(index => <Avatar key={index} index={index} />)}</div>
            <div className="hero-card-outcome"><strong>2 of 5</strong><span>people sent an invoice.<br />The other three stopped.</span></div>
            <blockquote>“Will this send before I review it?”</blockquote>
            <div className="hero-card-fix"><span aria-hidden="true">↳</span><p><strong>What to fix first</strong>Let people check an invoice before it sends.</p></div>
            <Link href="/sample-report" className="hero-card-link">See the findings <Arrow /></Link>
          </div>
          <span className="hero-preview-caption">The people and results shown here are made-up examples.</span>
        </div>
      </div>
      <div className="home-hero-bottom container"><span>A useful answer before your next big decision.</span><a href="#product">See how it works <span aria-hidden="true">↓</span></a></div>
    </section>
  );
}
