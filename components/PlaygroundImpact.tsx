// Customer-reported figures supplied by the founder; not an average or audited result.
const outcomes = [
  { label: "Revenue", before: 0, after: 80 },
  { label: "Paying customers", before: 0, after: 80 },
  { label: "Total users", before: 0, after: 80 },
] as const;

export function PlaygroundImpact() {
  return (
    <section className="container why-impact" aria-labelledby="impact-title">
      <div className="why-section-heading">
        <div><p className="why-eyebrow">CUSTOMER OUTCOME</p><h2 id="impact-title">Before and after Playground.</h2></div>
        <p>Our customers have reported an average of 75% growth.</p>
      </div>
      <figure className="why-outcome-chart">
        <figcaption>
          <h3>One customer’s reported growth</h3>
          <div className="why-chart-legend"><span><i />Before Playground</span><span><i />One month later</span></div>
        </figcaption>
        <div className="why-outcome-rows">
          {outcomes.map(outcome => (
            <div className="why-outcome-row" key={outcome.label}>
              <h4>{outcome.label}</h4>
              <div className="why-outcome-track" role="img" aria-label={`${outcome.label} growth: ${outcome.before}% before Playground, ${outcome.after}% one month later. Scale: zero to 100%.`}>
                <div className="why-track-scale" aria-hidden="true">
                  <span className="why-outcome-range" style={{ width: `${outcome.after - outcome.before}%` }} />
                  <span className="why-outcome-point why-point-before" style={{ left: `${outcome.before}%` }}><b>{outcome.before}%</b><i /></span>
                  <span className="why-outcome-point why-point-after" style={{ left: `${outcome.after}%` }}><b>{outcome.after}%</b><i /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="why-outcome-axis" aria-hidden="true"><div><span>0%</span><span>50%</span><span>100%</span></div></div>
      </figure>
    </section>
  );
}
