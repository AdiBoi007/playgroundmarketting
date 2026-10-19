import Image from "next/image";
import { TrackedLink } from "@/components/TrackedLink";
import { Arrow } from "@/components/ui/Primitives";

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
          <h1 id="home-title">Find your pilot users.<br /><span>Test before you launch.</span></h1>
          <p className="home-hero-lead">Get your idea in front of the people it’s built for. Playground finds your pilot users and tests with them, from your first idea to your next feature.</p>
          <div className="home-actions">
            <TrackedLink href="/waitlist" className="button" event="hero_waitlist_click">Find my pilot users <Arrow /></TrackedLink>
            <TrackedLink href="/#how-it-works" className="text-link" event="hero_how_it_works_click">See how it works <Arrow /></TrackedLink>
          </div>
          <p className="home-hero-stage">Reach the right people. Test the assumption. Know what to build next.</p>
        </div>
      </div>
      <div className="home-hero-bottom container"><a href="#product-journey">Find your stage <span aria-hidden="true">↓</span></a></div>
    </section>
  );
}
