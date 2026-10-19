import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/how-it-works",
    "/startups",
    "/about",
    "/waitlist",
    "/become-a-tester",
    "/run-a-test",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${siteOrigin}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
