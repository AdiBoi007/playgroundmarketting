import Image from "next/image";
import { CommunityCounters } from "@/components/CommunityCounters";
import { pilotCompanies } from "@/lib/pilot-companies";

export function CompanyShowcase() {
  return (
    <section className="container why-companies" aria-labelledby="why-companies-title">
      <div className="why-section-heading">
        <div><p className="why-eyebrow">THE COMMUNITY</p><h2 id="why-companies-title">Experience across industries.</h2></div>
        <p>Experience across technology, finance and professional services.</p>
      </div>
      <ul className="why-company-grid" aria-label="Company backgrounds in the community showcase">
        {pilotCompanies.map(company => <li key={company.name} className={company.name === "CommBank" ? "why-company-bank" : undefined}>
          <Image src={`/brand/testers/${company.file}`} alt={company.name} width={company.width} height={company.height} unoptimized />
          {company.name === "CommBank" && <span aria-hidden="true">CommBank</span>}
        </li>)}
        <li className="why-company-more"><span>And more</span></li>
      </ul>
      <CommunityCounters />
    </section>
  );
}
