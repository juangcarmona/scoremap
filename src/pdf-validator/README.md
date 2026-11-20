# Experimental PDF validator

This isolated validator is a preparation for issue #13. ScoreMap does not start,
publish or call it, and PDF attachments remain disabled. The image alone does
not impose its resource or network restrictions. Do not expose its HTTP port.

The validator applies structural and resource checks to a bounded subset of PDF
and returns only a page count and SHA-256 digest; it does not store files or
log their contents. These checks cannot guarantee that every unsafe PDF is
rejected. Passing them does not qualify browser rendering, backup recovery,
authorization or user-device performance.

Build from the current committed revision and run the synthetic tests in an
isolated, resource-limited container:

```sh
npm run build:pdf-validator
# Obtain the ID of the image printed by the build command.
npm run test:pdf-validator -- sha256:REPLACE_WITH_IMAGE_ID
```

The test verifies that the image and archived source share the exact Git
revision. Running it needs Docker; it uses a disposable container with no
external network and does not touch an existing ScoreMap installation.
Production integration requires a separate reviewed change that enforces the
resource and authorization boundaries and qualifies end-to-end recovery.
