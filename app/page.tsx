import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { TesterMarquee } from "@/components/home/TesterMarquee";
import { Assumptions, EnterPlayground, WhyPlayground, FinalCTA } from "@/components/home/Narrative";
import { ProductJourney } from "@/components/home/ProductJourney";
import { Crossroads } from "@/components/home/Crossroads";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return <main id="main" className="marketing-home"><Hero /><TesterMarquee /><EnterPlayground /><Assumptions /><ProductJourney /><Crossroads /><WhyPlayground /><FinalCTA /></main>;
}
