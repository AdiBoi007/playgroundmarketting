import Link from "next/link";
import { Arrow, Avatar } from "@/components/ui/Primitives";

const steps = [
  { title: "Tell us who you need.", copy: "Share what you’re building, who it’s for, and what you want to find out.", label: "YOUR IDEA", art: "idea" },
  { title: "Simulate the real world.", copy: "Our AI sandbox explores customer situations to flag possible problems for testing with real people.", label: "AI SANDBOX", art: "sandbox" },
  { title: "We find your pilot customers.", copy: "We recruit people who fit your audience, then test your idea or product with them.", label: "YOUR PEOPLE", art: "people" },
  { title: "Know what to build next.", copy: "See what they need, where they get stuck, and what to improve before you build more.", label: "YOUR NEXT STEP", art: "findings" },
] as const;

function ProcessArt({ step }: { step: (typeof steps)[number]["art"] }) {
  return (
    <div className={`pilot-process-art pilot-process-art-${step}`} aria-hidden="true">
      {step === "idea" ? (
        <div className="pilot-idea-sheet">
          <span className="pilot-sheet-dot" />
          <span className="pilot-sheet-line" /><span className="pilot-sheet-line short" />
          <div className="pilot-idea-question">Who needs this?</div>
          <span className="pilot-sheet-line" /><span className="pilot-sheet-line short" />
          <span className="pilot-pencil">↗</span>
        </div>
      ) : step === "sandbox" ? (
        <svg className="pilot-sandbox-map" viewBox="0 0 240 150" fill="none" focusable="false">
          <path d="M87 75H61V33H35M153 75h26V33h26M120 94v28h59" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="4 4" />
          <rect x="87" y="50" width="66" height="49" rx="12" fill="#123b3f" />
          <text x="120" y="81" textAnchor="middle" fill="#d0de87" fontSize="22" fontWeight="700">AI</text>
          <rect x="6" y="17" width="76" height="31" rx="6" fill="#fffcf4" stroke="currentColor" strokeOpacity=".4" />
          <text x="44" y="37" textAnchor="middle" fill="currentColor" fontSize="10">First use</text>
          <rect x="161" y="17" width="73" height="31" rx="6" fill="#fffcf4" stroke="currentColor" strokeOpacity=".4" />
          <text x="197" y="37" textAnchor="middle" fill="currentColor" fontSize="10">Busy day</text>
          <rect x="145" y="107" width="89" height="31" rx="6" fill="#d0de87" stroke="currentColor" strokeOpacity=".4" />
          <text x="189" y="127" textAnchor="middle" fill="currentColor" fontSize="10">Wrong turn</text>
          <circle cx="45" cy="113" r="12" stroke="currentColor" strokeOpacity=".35" />
          <path d="M45 108v6m0 3v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : step === "people" ? (
        <div className="pilot-people-match">
          <span className="pilot-match-orbit" />
          {[0, 1, 2].map(index => <Avatar key={index} index={index} />)}
          <span className="pilot-match-check">✓</span>
        </div>
      ) : (
        <div className="pilot-findings-sheet">
          <span><i>✓</i> What works</span>
          <span><i>↗</i> What to improve</span>
          <span><i>→</i> What’s next</span>
        </div>
      )}
    </div>
  );
}

export function PilotProcess() {
  const title = <>Your next customers.<br /><span>Let’s find them.</span></>;
  return (
    <section id="how-it-works" className="pilot-process" aria-labelledby="pilot-process-title">
      <div className="container">
        <div className="pilot-process-heading">
          <div>
            <p className="pilot-process-eyebrow">HOW PLAYGROUND WORKS</p>
            <h2 id="pilot-process-title">{title}</h2>
          </div>
          <div className="pilot-process-intro">
            <p>You bring the idea. We handle recruiting and testing with pilot customers who fit your audience.</p>
            <span>Start with an idea. No finished product needed.</span>
          </div>
        </div>
        <ol className="pilot-process-steps">
          {steps.map((step, index) => (
            <li className="pilot-process-step" key={step.title}>
              <div className="pilot-process-step-top"><span>0{index + 1}</span><span>{step.label}</span><Arrow /></div>
              <ProcessArt step={step.art} />
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>
        <div className="pilot-process-bottom"><p>People, test, price and timing agreed before we start.</p><Link href="/about" className="text-link">Why Playground <Arrow /></Link></div>
      </div>
    </section>
  );
}
