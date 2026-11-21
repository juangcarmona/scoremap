# ScoreMap design process

Use the project-pinned [Impeccable skill](../../.agents/skills/impeccable/SKILL.md) alongside the [Lighthouse design contract](DESIGN.md). Impeccable is a design and review aid; the accepted ProductShape behaviours, accessibility requirements and Lighthouse semantic tokens remain authoritative. Upstream: <https://github.com/pbakaus/impeccable>, revision `d41d9860b0094dcb68030657da63461212835aaa`, Apache-2.0; see the vendored license.

## Current direction

The owner selected a clear, functional interface. The first consultation pass uses a light surface, a narrower library rail and quieter section and chord containers. Treat it as a starting point for review, not acceptance of the whole application redesign.

## Piano octave colors

Use [Piano octave colors](piano-octave-colors.md) as the single design reference for the owner-selected 88-key octave palette.

## Start with the musician’s task

Identify the specific surface and its current behaviour. For consultation, use a representative synthetic song with multiple sections and chords, and arrangements with one, two and three keyboards. Keep theoretical chord diagrams distinct from played pitches and keep the content protected in performance mode. Inspect the actual rendered interface before choosing a direction.

## Shape and build

Use Impeccable’s shape, layout, adapt and polish guidance as appropriate to the task. Treat ScoreMap as an operating tool: prioritize the music, legible hierarchy, familiar controls, clear selected state and fast song switching. Avoid unnecessary repeated instructions, nested containers and configuration in the performance view. Keep the 48px touch targets, focus, contrast, accurate piano geometry, spelled notes and status/error states specified by the product. Do not overwrite Lighthouse’s installed design contract with an upstream template.

## Review what actually renders

Run the app with synthetic data and inspect desktop, landscape tablet and narrow views, including 200% text. Verify the performance/edit transition, keyboard and touch input, synchronized arrangement context, silence and out-of-range notes. Run the relevant existing browser and accessibility checks. Preserve screenshots with their source revision and viewport; a screenshot or automated test does not establish real-device or musician acceptance.

The skill's optional native engine and hooks are separate from project verification. The installer does not enable a hook here; approve and configure hooks explicitly in the relevant coding tool before relying on them. If the engine cannot run, follow its documented fallback and use the project’s browser and accessibility checks. Never send real musical content to external design services.
