---
title: Deployment view
arc42-section: "07"
description: Static delivery and installation boundary
---

# 7. Deployment view

The target deployment is a static HTTPS origin with Vite-built assets, a manifest, icons and a service worker. The owner configures and publishes Cloudflare Pages at https://scoremap.jgcarmona.com. The project has no Wrangler deployment dependency. Build: `npm ci --ignore-scripts && npm run build`; output: `dist`; Node 24. No deployment has been performed by this agent. Deployment status is recorded in delivery evidence, not inferred from source integration.

<!-- pdac:cite id="CON-PLATFORM" digest="sha256:ed4f4900b26c706198a0448376f26d57d0665462c5e77ac4dbadc04bb75e6bf5" -->

The origin is part of data ownership: moving domains does not migrate IndexedDB. Export/import provides explicit transfer. Android-compatible browser testing can verify the web runtime; physical tablet installation remains a separate acceptance step.
