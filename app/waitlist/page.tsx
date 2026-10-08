import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { Arrow, Eyebrow, Mark } from "@/components/ui/Primitives";
import { hasGmailConfiguration } from "@/lib/gmail";
import "../waitlist.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Join the waitlist",
  description:
    "Join the Playground waitlist for early-access and launch updates. Find out whether people need and can use what you’re building.",
  alternates: { canonical: "/waitlist" },
};

export default async function WaitlistPage() {
  const available = await hasGmailConfiguration();
  return (
    <main id="main" className="waitlist-page">
      <div className="container waitlist-layout">
        <div className="waitlist-copy">
          <Eyebrow>PLAYGROUND / EARLY ACCESS</Eyebrow>
          <h1>
            Find out what
            <br />
            <span>people need.</span>
          </h1>
          <p>
            Join the waitlist for early-access and launch updates. You can sign
            up with an idea, a work in progress or a product that is already live.
          </p>
          <p className="waitlist-explainer">
            Playground helps choose what to test, how to test it and who should
            take part: real people, AI or relevant experts. We’re in early access,
            with paid tests underway.
          </p>
          <div className="waitlist-art">
            <Image
              src="/brand/playground-landscape.png"
              width={1672}
              height={941}
              sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1100px) 44vw, 550px"
              alt="A winding path through a green coastal hill beneath peach clouds"
            />
            <span className="waitlist-art-note">
              <Mark /> FROM YOUR FIRST IDEA TO YOUR NEXT RELEASE.
            </span>
          </div>
          <Link
            className="text-link waitlist-preview-link"
            href="/sample-report"
          >
            See example findings <Arrow />
          </Link>
        </div>
        <WaitlistForm available={available} />
      </div>
    </main>
  );
}
