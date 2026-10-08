import { defineConfig, devices } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 4,
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    reducedMotion: "reduce",
  },
  reporter: [["list"]],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
