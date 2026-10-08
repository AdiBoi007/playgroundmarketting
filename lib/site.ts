export const siteOrigin = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://tryplayground.net")
).replace(/\/$/, "");
export const siteDescription =
  "Find out whether people need and can use what you’re building. Playground chooses the right test with real people, AI or relevant experts, from your first idea to your next release.";
