import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { Assumptions, EnterPlayground, Matching, UseCaseSection, WhyPlayground, FinalCTA } from "@/components/home/Narrative";
import { Crossroads } from "@/components/home/Crossroads";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return <main id="main" className="marketing-home"><Hero /><Assumptions /><EnterPlayground /><Matching /><Crossroads /><UseCaseSection /><WhyPlayground /><FinalCTA /></main>;
}
