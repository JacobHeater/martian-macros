---
id: MM-387
status: proposed
component: food-database
related: [MM-384, MM-56, MM-386]
---

# Task: Stream a pack download into its file natively, so the bytes never cross the bridge

## Context
The native plugin reads each response on its own thread and sends every 256 KiB as a base64 event into the WebView; the
app decodes it, re-encodes it and sends it back to the plugin to write. Nothing bounds the backlog: a fast connection fills
the WebView heap with base64 strings faster than the app drains them, and two downloads at once (MM-384) halve the drain
rate while two network threads fill. Found by the panel's React role by inspection (`docs/agent-runs/mm383-sources-and-downloads/`,
F4); not measured. With the packs as published (46.7 MB and 0.76 MB) the second stream is three chunks; a fuller generic pack
(MM-383) changes that.

## Description
`MmPacks.httpGet` writes the response straight into the pack's partial file natively and emits only byte counts; `PackHttp`
and `PackStore` meet in one native call per download; the checksum, gunzip and swap stay as they are. The base64 passes, the
arrivals buffer and the JS-side backlog go away.

## Acceptance Criteria
```gherkin
Scenario: Nothing crosses the bridge but counts
  Given a download running
  Then the plugin emits progress events carrying byte counts and no data

Scenario: Two at once
  Given two packs downloading together on a release build
  Then both end installed with matching checksums, and the WebView's memory does not grow with the download
```

## Notes
Before this is built, the phone checklist covers the risk: both packs started together on a release build, both installed
with matching checksums, and the WebView process's memory watched in Android Studio's profiler.
