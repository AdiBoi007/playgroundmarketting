import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { TesterMarquee } from "@/components/home/TesterMarquee";
import { Assumptions, EnterPlayground, Matching, UseCaseSection, WhyPlayground, FinalCTA } from "@/components/home/Narrative";
import { Crossroads } from "@/components/home/Crossroads";
import { ProductJourney } from "@/components/home/ProductJourney";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return <main id="main" className="marketing-home"><Hero /><TesterMarquee /><ProductJourney /><Assumptions /><EnterPlayground /><Matching /><Crossroads /><UseCaseSection /><WhyPlayground /><FinalCTA /></main>;
}
