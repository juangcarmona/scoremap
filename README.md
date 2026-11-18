# ScoreMap

Your sheet music, mapped out.

ScoreMap is a React PWA for preparing and consulting songs: shared sections and
measures, a finite chord catalogue, exact performed notes, independent arrangements,
multiple keyboards, splits/layers and reusable voicings. The main device target is
an Android tablet in landscape; phone and desktop consultation are also supported.

## Choose the right application

- **Private library:** the ASP.NET Core BFF/API authenticates through Keycloak/OIDC
  and saves principal-owned songs, permissions, atomic revisions and history in
  PostgreSQL. Acknowledged server saves can be reconstructed on another device.
- **Anonymous local library:** the static PWA saves to origin-scoped IndexedDB.
  It has no private-account authority. Its JSON can be explicitly imported into a
  private library without clearing the original.

Supported ScoreMap v1/v2 JSON exports remain the import/export format. Private
import previews select complete songs and explicit independent copies; an ordinary
JSON file is not a substitute for server ownership, authentication or backups.
PDF attachment/viewing remains separate under [#13](https://github.com/juangcarmona/scoremap/issues/13).

## Run the private Development application

Use Node 24, the .NET SDK in `global.json` and Docker. The two committed files below
contain synthetic configuration and users, never an operator's identity or music.

```sh
npx --yes --package=npm@10.9.4 -- npm ci --ignore-scripts
npm run build:private
npm run dev:private -- config/application.example.json config/development-users.example.json
```

Open `http://localhost:5280`, sign in with an enabled account from the selected
synthetic users file, import a supported ScoreMap export, edit and wait for
**Saved to your private library**. Reopen in a clean browser session to check the
server acknowledgement. **Saved on this device** belongs to the anonymous mode.
Use execution-owned instances for automated tests; never reset an operator's data.

The private Development graph is loopback-only. A tablet needs an explicitly
configured reachable application/provider origin and matching OIDC callbacks;
forwarding a static Vite preview does not supply a private library.
See [private operation and production publication](deployment/README.md).

For anonymous local development only, use `npm run dev`. `npm run build` produces
static `dist/`; it does not deploy the private API, PostgreSQL or identity provider.

## Verify

```sh
npm run verify
npx --no-install playwright install chromium
npm run test:e2e
```

An execution-owned real provider/database graph is additionally required for
`npm run verify:connected`. `npm run verify:delivery` binds the full local and
connected reports to committed inputs. Native CI performs those stages for the
current revision. Physical tablet installation and actual operator deployment are
separate acceptance checks.

## Production delivery

`npm run build:container` builds committed private-application source.
`npm run publish:production -- <empty-output-directory>` publishes the separate
Aspire-to-Compose application/private-database composition and source receipt.
The [production procedure](deployment/README.md#production-preparation) requires
private operator JSON, an established production OIDC client, stable HTTPS ingress,
persistent database/session keys and an observed protected backup/restore.
Secrets and personal arrangements stay outside Git and public artifacts.

Optional private offline preparation defaults to disabled. A configured maximum
of 480 minutes is shortened by known provider/session expiry; it never promises an
eight-hour session. Restart while disconnected remains locked; reconnect requires
authentication and explicit recovery of protected pending work.

The operator chooses the destination machine and origins. A merged PR, a static
hosting build and a generated Compose file are separate from a running private
Production deployment. See [current delivery evidence](docs/evidence/mvp/).

ProductShape owns accepted intent; [ArcShape](docs/architecture/) describes its
realization; [OpenSpec](openspec/changes/) owns delivery specifications; Lighthouse
owns delivery guardrails. This repository is public; no public license is selected.
