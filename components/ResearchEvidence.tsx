import { Arrow } from "@/components/ui/Primitives";

// Fixed, dated conversion. The study's original estimate remains in the source notes.
const eurPerAud = 0.6187;
const revenueAud = Math.round(6999.327 / eurPerAud / 100) * 100;
const research = [
  {
    value: "2.7", unit: "weeks earlier", title: "Earlier project decisions",
    copy: "Founders trained to test assumptions stopped projects earlier than the control group.",
    source: "Camuffo et al., 2024", href: "https://doi.org/10.1002/smj.3580",
  },
  {
    value: `≈A$ ${new Intl.NumberFormat("en-AU").format(revenueAud)}`, unit: "additional cumulative revenue", title: "Higher revenue in the study",
    copy: "Estimated increase per firm following scientific decision-making training.",
    source: "Camuffo et al., 2024", href: "https://doi.org/10.1002/smj.3580",
  },
  {
    value: "≈10%", unit: "more website visits", title: "Growth through experimentation",
    copy: "Estimated increase in the first few months after startups adopted A/B testing.",
    source: "Koning et al., 2022", href: "https://doi.org/10.1287/mnsc.2021.4209",
  },
] as const;

export function ResearchEvidence() {
  return (
    <section className="container why-research" aria-labelledby="research-title">
      <div className="why-section-heading">
        <div><p className="why-eyebrow">THE RESEARCH</p><h2 id="research-title">Evidence for testing early.</h2></div>
      </div>
      <div className="why-research-grid">
        {research.map(item => (
          <article key={item.title}>
            <strong>{item.value}</strong>
            <span className="why-research-unit">{item.unit}</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
            <a href={item.href} className="why-study-link">{item.source}<Arrow /></a>
          </article>
        ))}
      </div>
      <details className="why-source-notes">
        <summary>Study details and currency conversion</summary>
        <div>
          <p>Camuffo et al. studied 759 firms across four randomised trials of scientific decision-making training. The estimates were 2.699 weeks earlier to project termination and EUR 6,999.327 in additional cumulative revenue per firm. Follow-up periods varied; this does not measure development time saved.</p>
          <p>The revenue estimate is approximately A${new Intl.NumberFormat("en-AU").format(revenueAud)}, rounded to the nearest $100 using <a href="https://www.rba.gov.au/statistics/frequency/exchange-rates.html">RBA’s 16 October 2026 rate</a> of AUD 1 = EUR 0.6187.</p>
          <p>Koning et al. used non-randomised startup data to estimate the effect of A/B testing on website visits. The finding concerns traffic, not revenue or the probability of business success. Neither study evaluated Playground.</p>
        </div>
      </details>
    </section>
  );
}
