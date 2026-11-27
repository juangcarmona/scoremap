# Android Google Play delivery

The `Android Google Play` workflow builds an upload-key-signed Android App Bundle
using the repository's pinned native toolchain. This is separate from CI's host,
device and delivery qualification; building a signed bundle does not replace those
checks or establish release acceptance.

## Configuration

Repository secrets:

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: service-account JSON with access to this app
  in Google Play Console and the Android Publisher API enabled in its Cloud project.
- `ANDROID_KEYSTORE_BASE64`: base64-encoded upload keystore.
- `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`:
  corresponding signing credentials.

Keep the original upload key and its passwords in a private backup outside Git.
Never put them in issues, logs, artifacts or pull request descriptions. Google Play
App Signing manages the distribution key; this workflow uses the separate upload key.

## First upload

1. Confirm the permanent package in Play Console. The workflow defaults to
   `com.jgcarmona.scoremap`; normal development builds retain `scoremap.android`.
2. Run the workflow with **publish disabled**. Download `scoremap-play-N` from the
   run's artifacts. It contains `app-release.aab`, its SHA-256 and source/run provenance.
3. Complete the app information, signing setup and declarations required by Play
   Console. Try the API upload for an already registered package; if Google requires
   an initial Console upload, use the retained AAB. ScoreMap's first Alpha was
   successfully uploaded through the API without a manual binary upload.
4. After integration into `main`, run the workflow on `main` with **publish enabled**
   and select `alpha` (closed testing) or `internal`. Leave `release_status` as
   `draft` to prepare a candidate, or select `completed` for an owner-authorized
   testing rollout after qualification and required Console setup.

An owner-requested first Alpha candidate can also be uploaded as a draft by pushing
an explicit `play-alpha-*` tag. That tag binds the candidate to a source revision;
it does not establish successful CI, integration, release acceptance or tester
availability. The tag bootstrap route always uses draft status.
Google may still require the first Console upload and outstanding app declarations.

The workflow serializes deliveries and derives the version code from its run number.
Rerunning an uploaded run reuses its version code: start a fresh run for a new upload.
All uploads for this app must preserve this sequence; if another publisher uploads a
higher version code, update the workflow sequence before publishing again.

`SCOREMAP_APPLICATION_ID`, `SCOREMAP_VERSION_CODE` and `SCOREMAP_VERSION_NAME`
configure publication builds. The keystore path and passwords enter Gradle through
environment variables. Signing uses no configuration cache, and the temporary
keystore is deleted even when a step fails.

## References

- [Android app signing](https://developer.android.com/studio/publish/app-signing)
- [Google Play API setup](https://developers.google.com/android-publisher/getting_started)
- [Upload action inputs and initial-upload requirement](https://github.com/r0adkll/upload-google-play)
