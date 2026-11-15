---
title: Cross-cutting concepts
arc42-section: "08"
description: Storage, backup, update and trust mechanisms
---

# 8. Cross-cutting concepts

The initial stored envelope has schema version 1 and a monotonic revision. Load and import validate complete content and associations; future migrations must be explicit and atomic. Unknown versions stop without writes. Import is confirmed replacement rather than implicit merge. IDs are opaque stable browser-generated UUIDs.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:4344f228dbb32818f9dfdce278ec73ac6acd8dc4689069ac6c79d12c1571b917" -->

External URLs accept only HTTP(S), text uses React escaping, and no application code is loaded from imported content. App-shell caching is separate from personal data. A waiting service worker updates only after an explicit user action, avoiding an unexpected performance interruption.

<!-- pdac:cite id="BR-REFERENCES" digest="sha256:f6c63aa91b8cd5dc754520d4015424c3c56811d90a886f62a895c9db99ce9ce3" -->
