import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/connected",
  workers: 1,
  outputDir: "test-results/connected/artifacts",
  timeout: 120000,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/connected/results.json" }],
  ],
  use: {
    actionTimeout: 10000,
    baseURL: process.env.SCOREMAP_TEST_ORIGIN ?? "http://localhost:5280",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "connected-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
