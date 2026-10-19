export const siteOrigin = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://tryplayground.net")
).replace(/\/$/, "");
export const siteDescription =
  "Find your pilot customers and test before you launch. Playground recruits people who fit your audience and tests your idea, first version or next feature with them.";
