import { defineConfig } from "@playwright/test";
import path from "node:path";
const state = process.env.SCOREMAP_DEPLOYMENT_STATE;
if (!state || process.env.SCOREMAP_QUALIFICATION_TLS !== "1")
  throw new Error("Run the disposable production qualification driver first.");
const pin = process.env.SCOREMAP_QUALIFICATION_SPKI ?? "";
if (!/^[A-Za-z0-9+/]{43}=$/.test(pin))
  throw new Error(
    "Select the disposable certificate's explicit SPKI fingerprint.",
  );
export default defineConfig({
  testDir: "./tests/deployment",
  workers: 1,
  timeout: 90000,
  outputDir: path.join(
    process.env.SCOREMAP_TEST_REPORT_DIRECTORY ?? state,
    "browser-artifacts",
  ),
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: path.join(
          process.env.SCOREMAP_TEST_REPORT_DIRECTORY ?? state,
          "results.json",
        ),
      },
    ],
  ],
  use: {
    baseURL: process.env.SCOREMAP_TEST_ORIGIN,
    actionTimeout: 10000,
    launchOptions: {
      args: [
        "--host-resolver-rules=MAP identity.scoremap.test 127.0.0.1",
        `--ignore-certificate-errors-spki-list=${pin}`,
      ],
    },
    trace: "off",
    screenshot: "only-on-failure",
  },
});
