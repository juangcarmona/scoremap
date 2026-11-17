import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: false,
      includeAssets: ["manifest.webmanifest", "icons/*.png", "icons/*.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/(api|auth|health)(\/|$)/],
        clientsClaim: true,
        skipWaiting: false,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    target: "es2022",
    outDir: process.env.VITE_SCOREMAP_PRIVATE === "1" ? "dist-private" : "dist",
  },
});
