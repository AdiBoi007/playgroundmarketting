# Research prompt: evidence for Why Playground

Copy everything below into a research-enabled GPT.

---

Act as a rigorous research analyst and conversion copywriter. Research statistics for the “Why Playground” page of an early-stage service.

## What Playground does

Playground helps founders and product teams reach relevant pilot customers and test ideas, prototypes, first versions and new features. The service handles recruiting, test planning and sessions, then shares findings and suggested next steps. An AI sandbox can explore possible customer scenarios; real people test questions that depend on human behavior.

We want persuasive evidence about why teams should speak to potential customers and test before investing more in building. We do not yet have measured Playground outcomes.

## Research questions

1. Does early customer discovery, experimentation or validation improve defined business outcomes? Look for credible comparisons involving revenue, survival, retention, product adoption or other clearly defined outcomes.
2. Can early user testing reduce development rework, wasted engineering time or the cost of fixing problems?
3. What evidence describes the cost or difficulty of recruiting relevant research participants and the time to useful customer feedback?
4. What does research say about testing pricing, usability and demand before launch?
5. Is there a defensible estimate of “chance of success after validation”? If no robust, applicable percentage exists, explicitly say so. Suggest a better-supported outcome instead.

## Evidence requirements

Browse the web and prioritize original peer-reviewed studies, randomized experiments, substantial cohort studies, and primary reports with transparent methods. Follow secondary articles to the original source. Do not treat widely repeated marketing numbers as verified evidence.

For each candidate claim, record:
- Original source URL or DOI; author, publication date, and study/data dates.
- Exact statistic, units, denominator, sample size, population and industry.
- How “validation” and the outcome were defined.
- Baseline and comparison group, measurement period and uncertainty where reported.
- Whether the result is causal, correlational, self-reported, modelled or merely illustrative.
- Important limitations and whether the evidence applies to startups, established firms, software products or usability tasks.
- A short supporting quotation, no more than 25 words from any one source across your response, with a page, figure or table reference when possible.

Never turn a relative improvement into an absolute success probability. Distinguish percentage points, percentage increases, risk ratios and odds ratios. Do not equate usability problem detection with business success, or imply that an industry study measures Playground’s performance. Do not invent chart points, baselines, sample sizes or sources.

## Deliverables

1. A table of 6–10 candidate statistics, with strong / qualified / reject ratings and reasons.
2. For each usable statistic, a plain-English website headline of at most 12 words, one sentence of context, and a directly supporting source link.
3. Three strong claim-and-chart recommendations for: success after validation, development rework, and time to useful feedback. A blank slot is better than an unsupported number.
4. Chart-ready data containing only values actually reported by the source. Use “before / after” only when the research supports that comparison; otherwise use the source’s real group labels.
5. A brief list of claims that cannot be supported and the internal measurements Playground should collect instead.
6. JSON for usable claims with these fields:
   `id`, `headline`, `value`, `unit`, `baseline`, `comparison`, `population`, `sampleSize`, `outcomeDefinition`, `method`, `evidenceType`, `year`, `sourceUrl`, `limitations`, `recommendedPlacement`.

## Current design placeholders

The local design currently includes:
- Community goals of 2,000+ pilot customers and people from 50+ companies. These are NOT verified membership or customer counts. External research cannot validate them; Playground must supply its own records. Companies represented by participants are not necessarily paying clients or endorsers.
- A clearly fictional before/after scenario: 0 → 12 pilot customers heard from; 0 → 4 of 5 questions tested; 5 → 1 questions still untested. The resulting 80% is question coverage, NOT a business-success probability.
- A fictional phase chart: kickoff, recruit, test, learn. Questions tested are [0, 0, 0, 0] before and [0, 0, 2, 4] after. These are not measured Playground results.

Do not cite or recycle these placeholders as evidence. Recommend replacing, keeping as an explicitly labelled example, or removing each one. Keep independently sourced research, internal traction, future targets, and illustrative data clearly separate.

Be commercially useful and concise, but report when the evidence is weaker than the desired marketing claim. Return the original sources so a second reviewer can verify every publishable number.
