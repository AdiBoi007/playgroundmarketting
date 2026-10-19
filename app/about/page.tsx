import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/ui/Primitives";
import { PlaygroundImpact } from "@/components/PlaygroundImpact";
import { CompanyShowcase } from "@/components/CompanyShowcase";
import { ResearchEvidence } from "@/components/ResearchEvidence";

export const metadata: Metadata = {
  title: "Why Playground",
  description: "Find pilot customers and test demand before you build. Researcher-founded, with recruitment, testing and clear findings handled for you.",
  alternates: { canonical: "/about" },
};

export default function WhyPlayground() {
  return (
    <main id="main" className="why-page">
      <header className="container why-intro">
        <p className="why-eyebrow">WHY PLAYGROUND</p>
        <h1>Don’t spend years<br /><span>building the wrong thing.</span></h1>
        <p className="why-lead">Find pilot customers. Test demand. Know what to build next.</p>
        <p className="why-intro-detail">We handle recruitment, product testing and findings—from your first idea to your next feature.</p>
        <Link className="button" href="/waitlist">Find my pilot customers <Arrow /></Link>
        <p className="why-founder-line">Researcher-founded. Built around real customer evidence.</p>
      </header>
      <ResearchEvidence />
      <PlaygroundImpact />
      <CompanyShowcase />
      <section className="container why-action" aria-labelledby="why-action-title">
        <div>
          <h2 id="why-action-title">Test before your next investment.</h2>
          <p>Bring an idea, prototype or product. We’ll find the people to test it with.</p>
        </div>
        <Link className="button" href="/waitlist">Find my pilot customers <Arrow /></Link>
      </section>
    </main>
  );
}
