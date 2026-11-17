# Private self-hosting

The portable target is the built React PWA and ASP.NET Core BFF/API, PostgreSQL and a separately configured OIDC provider. The database, key volume, provider administration and Aspire dashboard are private. The application uses server-held provider tokens, protected cookies, CSRF and current song grants even behind a VPN or TLS proxy.

## Development trial

Use Node 24 and the SDK pinned in `global.json`, Docker and the two synthetic example files:

```sh
npx --yes --package=npm@10.9.4 -- npm ci --ignore-scripts
npm run build:private
npm run dev:private -- config/application.example.json config/development-users.example.json
```

Open `http://localhost:5280`, select **Sign in**, and use an enabled account and its password from the selected users file. Both browser tests and manual login use that exact provider-native fixture. Owner A and owner B start with independent private libraries. Editor and viewer gain access only through a song owner's explicit grant; account names never grant a global role. The disabled account cannot sign in. Real operator files belong outside Git, with directory mode 0700 and file mode 0600; pass their paths in place of the examples. Never put personal music in these fixtures.

The bootstrap validates version, required and unknown application fields, the origin, realm/client relationship and environment. It writes generated settings and the native realm import under ignored `.runtime/<InstanceId>/`, creates a random PostgreSQL password on first use, restores the pinned Aspire CLI, and starts the real Aspire graph. Application values come from schema defaults and the selected file; `SCOREMAP_APPLICATION_FILE` selects that file and the hosting environment is checked independently; the API rejects a selected environment inconsistent with its actual environment. The users file is imported natively into a fresh provider store. Existing realms, volumes and songs are retained on restart; changing a fixture does not reset them. Choose a new execution-owned InstanceId to test a new fixture. Do not reuse a musician's instance for automated resets.

Use **Import backup** for a supported v1 or v2 ScoreMap library-envelope export. The preview selects complete songs and their optional limited repertoire memberships, states source revision/counts and preserves existing songs and the original file. **Import songs from this browser** uses the same preview for retained anonymous work on the current origin; it never clears that source. A fresh authorized readback separately verifies the acknowledged selection. An unavailable readback is reported without pretending the acknowledged save rolled back. Duplicate or already-owned identities refuse without replacement; **Import as new copies** explicitly creates and remaps fresh identities. Edit a note, wait for **Saved to your private library**, then sign in in a new browser profile and open the same song. A local device acknowledgement does not mean server storage. Unsaved private work is encrypted on the device and requires the same reauthenticated principal and current resource permissions to unlock; export it explicitly for comparison. Persistent private offline editing is disabled.

The derived provider-import file is mounted individually and readable to the container UID; its parent directories remain mode 0700. Original selected operator files and the generated application file stay mode 0600.

Private **Delete song** moves the whole supported song and its saved versions into **Deleted songs**. Only the current owner can read or recover deleted content. Deletion removes song grants and repertoire memberships; restoration keeps those removed. **Song history** previews earlier notes, form and chords; the owner or a current editor can explicitly restore an active version as a new version, preserving intervening history. Performance mode cannot restore or purge. Unsaved work must be saved or compared before recovery.

**Remove permanently** requires typing the exact deleted song title. It atomically removes retained live musical content/history and leaves only an identity tombstone and metadata receipt. Retrying the same command does not repeat it; old imports, stale commands and restore cannot resurrect that identity. This does not erase prior exports or operator backups. Restoring operator backups requires preserving current purge and authorization state.

The development graph binds to loopback. From another machine, forward both application and provider ports through your existing SSH access, then open the application on `http://localhost:5280` there. The browser's callback origin must match the selected provider configuration; exposing the Vite static preview alone does not supply login or private server storage.

Stop with Ctrl+C. Restart with the same files/InstanceId to recover the same database, provider and session keys. Stopping does not remove volumes or delete music.

```sh
npm run test:connected
```

Connected tests require an execution-owned synthetic instance. They perform real browser authentication and PostgreSQL requests. Traces are disabled to avoid retaining credentials or session material. Keep all captures private until checked for synthetic content and redaction.

## Production publication

The separate `src/root/ScoreMap.Deployment` AppHost owns production composition; `compose.yaml` is its verified generated snapshot. It cannot run the Development environment. `npm run verify:deployment` executes locked publication, snapshot matching, synthetic Compose rendering and direct-execution refusal without starting containers.

After committing the candidate, run `npm run publish:production -- <empty-output-directory>`. The command uses a committed Git archive and the pinned Aspire CLI, then writes portable Compose artifacts and `publication-receipt.json` with source/tool/file digests. A nonempty output directory is preserved and refused. Generated artifacts contain selectors for a separately qualified image, private application configuration and a database-password file; they contain no operator secrets, identity fixture or musical data. This follows the [Aspire Compose publication contract](https://aspire.dev/deployment/docker-compose/).

The existing Development AppHost, identity fixture and actual trial volumes remain separate. Publishing does not start containers, configure a target machine or attest runtime/TLS/restore qualification.

## Production preparation

1. Complete the connected security, concurrency, persistence and restore checks on the exact candidate revision. Build the committed revision with `npm run build:container -- scoremap:trial`. Its Git archive context excludes untracked and private operator files. Resolve and retain base-image digests for an actual release; the Node major tag in this development Dockerfile is not a reproducible release pin.
2. Copy `application.production.example.json` to private operator storage. Set the real origin, OIDC authority/client secret, database connection and key path. Configure an established confidential OIDC client with exact `/signin-oidc` and signed-out callback redirects, code flow/PKCE and the client audience in access tokens. Do not deploy the Development realm/users. The provider must support token introspection/refresh used by this BFF. Keycloak's audience rule is documented in its [administration guide](https://www.keycloak.org/docs/26.8.1/server_admin/).
3. Prepare the matching database password secret and private configuration and key volume ownership for the container's non-root UID. Keep the selected configuration read-only. The example deliberately refuses startup until `ProductionQualified` is set after operator qualification; setting it is an operator assertion, not evidence generated by the application.
4. Set the Compose selections `SCOREMAP_IMAGE` (reviewed image digest), `SCOREMAP_APPLICATION_FILE` and `SCOREMAP_DATABASE_PASSWORD_FILE`. Render `docker compose -f deployment/compose.yaml config --quiet` before startup. Never print the resolved private configuration in public logs.
5. Put an operator-managed HTTPS reverse proxy in front of the loopback application port. Forward the original host and HTTPS scheme and configure only its actual trusted proxy address in the private application file. Expose only the intended HTTPS ingress; no database, provider administration or diagnostics ports. Origin allocation and real host/network values are operator choices.
6. Back up PostgreSQL and the data-protection key ring into protected storage; restore both on a disposable target and verify a saved song and session/recovery boundaries before any real deployment. A volume is not a backup. Preserve purge/authorization state when restoring older backups. Do not roll back to an incompatible schema.

This repository supplies a deployment candidate and procedure. Its presence does not attest an executed production build, restore rehearsal, Internet deployment or physical-device acceptance. Report those executions separately.
