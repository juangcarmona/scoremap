import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
const qualification = process.env.SCOREMAP_QUALIFICATION_TLS === "1";
const pin = process.env.SCOREMAP_QUALIFICATION_SPKI ?? "";
if (qualification && !/^[A-Za-z0-9+/]{43}=$/.test(pin))
  throw new Error(
    "Select the disposable certificate's explicit SPKI fingerprint.",
  );
export default defineConfig({
  testDir: "./tests/connected",
  workers: 1,
  outputDir: process.env.SCOREMAP_TEST_REPORT_DIRECTORY
    ? path.join(process.env.SCOREMAP_TEST_REPORT_DIRECTORY, "artifacts")
    : "test-results/connected/artifacts",
  timeout: 120000,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: process.env.SCOREMAP_TEST_REPORT_DIRECTORY
          ? path.join(
              process.env.SCOREMAP_TEST_REPORT_DIRECTORY,
              "results.json",
            )
          : "test-results/connected/results.json",
      },
    ],
  ],
  use: {
    actionTimeout: 10000,
    launchOptions: {
      args:
        process.env.SCOREMAP_QUALIFICATION_TLS === "1"
          ? [
              "--host-resolver-rules=MAP identity.scoremap.test 127.0.0.1",
              `--ignore-certificate-errors-spki-list=${pin}`,
            ]
          : [],
    },
    baseURL: process.env.SCOREMAP_TEST_ORIGIN ?? "http://localhost:5280",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "connected-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
