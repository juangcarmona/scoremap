---
title: Introduction and goals
arc42-section: "01"
description: Musical preparation and private durable library architecture
---

# 1. Introduction and goals

## Requirements overview

The existing React PWA presents shared musical form and independently performed arrangements. Anonymous work commits to IndexedDB; the private application uses the same-origin BFF/API, trusted OIDC identity and PostgreSQL for principal-owned durable revisions. [Section 05](../05-building-block-view/README.md) owns the components; [section 07](../07-deployment-view/README.md) owns environment mapping.

The owner selects a separate Kotlin/Jetpack Compose Android application under [ADR-0010](../09-architecture-decisions/ADR-0010-build-a-separate-native-android-application.md). Its local storage and file-transfer target belongs to [Android target](../05-building-block-view/android-target.md); existing browser/private components remain in place. Native implementation and qualification are pending.

<!-- pdac:cite id="CON-SCOPE" digest="sha256:a69dd93c94d43ee6fe15eee09c94b68a5ac6f96cdd6f435627c3f790b707f664" -->

## Quality goals

Consultation stays readable at tablet distance; domain tests protect musical and identity correctness, and browser tests exercise actual local recovery and offline interaction in the web realization. The native target requires its own host/device evidence under [section 10](../10-quality-requirements/android-enforcement.md); browser results do not establish native acceptance.

<!-- pdac:cite id="QR-READABILITY" digest="sha256:7139af1523273cf318b98b0f01da8688627c1a747f656b10017dcd3f0424c4af" -->

## Stakeholders

The musician owns personal content. The repository owner reviews product intent and integration decisions.
