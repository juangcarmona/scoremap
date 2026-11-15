import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/playwright.json" }],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "tablet-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
