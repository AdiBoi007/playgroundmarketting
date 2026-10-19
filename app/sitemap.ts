import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/how-it-works",
    "/startups",
    "/sample-report",
    "/about",
    "/waitlist",
    "/become-a-tester",
    "/run-a-test",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${siteOrigin}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path === "/sample-report" ? 0.9 : 0.7,
  }));
}
