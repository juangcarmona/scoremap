import { defineConfig } from "@playwright/test";
import connected from "./playwright.connected.config";

export default defineConfig(connected, {
  testDir: "./tests/deployment",
  testMatch: "migration-rollback.spec.ts",
});
