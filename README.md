# ScoreMap

Your sheet music, mapped out.

ScoreMap is a local-first, installable web companion for musicians preparing,
practising, rehearsing and performing songs. Its primary surface is an immediately
readable song sketch: ordered sections, chord sequences, visual chord references
and personal notes.

Primary target: Android tablet in landscape; secondary target: Android phone.
Initial MVP deadline: Friday, November 20, 2026.

This repository is public. No public license has been selected.

The owner configures and publishes Cloudflare Pages at https://scoremap.jgcarmona.com.
This is the intended target; no deployment is claimed.

ProductShape owns accepted product intent; ArcShape owns architecture;
OpenSpec owns temporary delivery specifications; Lighthouse owns delivery guardrails.

## Run and verify

Use Node 24 and the committed package lock.

```sh
npm ci --ignore-scripts
npm run dev
```

```sh
npm run verify
npx --no-install playwright install chromium
npm run test:e2e
npm run evidence:record
```

`npm run build` creates `dist/` for the owner's Cloudflare Pages integration.
No Wrangler deployment step is required. App assets are precached; personal music
is stored in IndexedDB on the current origin. Export a backup before clearing site
data or moving to another domain.

The first usable scope includes repertoire/song editing, stable section ordering,
major/minor chord sequences, accurate piano references, personal notes, web
references, performance consultation, atomic local recovery and validated JSON
backup replacement. PDF viewing remains tracked in [#13](https://github.com/juangcarmona/scoremap/issues/13).
Physical Android installation is a separate device acceptance step.

See [the product model](docs/product/model/), [architecture](docs/architecture/),
[delivery plans](openspec/changes/), and [verification evidence](docs/evidence/).
