---
id: MM-387
status: done
component: food-database
related: [MM-384, MM-56, MM-386, MM-471]
---

# Task: Stream a pack download into its file natively, so the bytes never cross the bridge

## Context
The native plugin reads each response on its own thread and sends every 256 KiB as a base64 event into the WebView; the
app decodes it, re-encodes it and sends it back to the plugin to write. Nothing bounds the backlog: a fast connection fills
the WebView heap with base64 strings faster than the app drains them, and two downloads at once (MM-384) halve the drain
rate while two network threads fill. Found by the panel's React role by inspection (`docs/agent-runs/mm383-sources-and-downloads/`,
F4); not measured. With the packs as published (46.7 MB and 0.76 MB) the second stream is three chunks; a fuller generic pack
(MM-383) changes that.

## Decisions
Choices the author made without asking (2026-10-21), easy to overrule:
- A new narrow seam, `PackFileFetch` ("fetch this file into that partial"), sits beside `PackHttp` and `PackStore` rather
  than changing either: `PackDownload` takes it and the store, and nothing else changes for the store. On the phone it is
  `NativePackFetch`; elsewhere `StreamedPackFetch` reads through `PackHttp` into `PackStore` as before.
  `AppServices.packFetch` is optional: absent, the app composes the streamed one from `packHttp` and `packStore`, so a test
  or a story that brings its own network and store keeps working unchanged. `openAppServices` chooses the native one.
- The list of packs on offer (a few kilobytes) still arrives through `httpGet` and its base64 events; only pack files
  stream to a file.
- The plugin tells a count every 256 KiB written and once at the end, and the adapter keeps only the latest count, so
  nothing piles up in the WebView however fast the file fills.
- On 206 the plugin cuts the partial to the offset asked for before carrying on, and on Android one lock per partial file
  keeps a resumed transfer from writing beside one that is still stopping; on 200 it begins the file again. A partial
  shorter than the offset is a write failure.

## Description
`MmPacks.httpGetToFile` writes the response straight into the pack's partial file natively and emits only byte counts;
`PackHttp` and `PackStore` meet in one native call per download; the checksum, gunzip and swap stay as they are. The base64
passes, the arrivals buffer and the JS-side backlog go away for pack files.

## Acceptance Criteria
```gherkin
Scenario: Nothing crosses the bridge but counts
  Given a download running
  Then the plugin emits progress events carrying byte counts and no data

Scenario: Resume, restart and refusal behave as before
  Given a partial download kept from an earlier attempt
  When the server honours the range
  Then the file carries on at the offset
  When the server sends the whole file instead
  Then the file begins again
  When the server refuses the request
  Then nothing is written

Scenario: A full phone is told apart from a dropped connection
  Given a download running
  When the file cannot be written
  Then the download fails as "no space", not as a lost connection

Scenario: Two at once
  Given two packs downloading together on a release build
  Then both end installed with matching checksums, and the WebView's memory does not grow with the download
```

## Notes
- Built 2026-10-21: `PackFileFetch`, `PackFileTransfer`, `PackWriteFailed` and `StreamedPackFetch` in
  `src/foodCatalog/download/`; `NativePackFetch` and the `packFileProgress` event in `src/foodCatalog/download/native/`;
  `httpGetToFile` in `MmPacksPlugin.kt` and its Swift twin `MmPacksPlugin.swift` (`PackFileTransfer`).
- Guarding tests: `test/contracts/packFileFetchContract.ts`, run against both implementations by
  `test/foodCatalog/packFileFetch.test.ts` (the native one over `test/support/fakeMmPacksFiles.ts`, a stand-in for the
  plugin that answers nothing but `httpGetToFile`); `test/foodCatalog/nativePackFetch.test.ts` ("a download over the plugin
  installs, and nothing but counts crosses the bridge", counts coalesced, write and connection failures told apart);
  `test/native/mmPacksFileProgress.test.ts` reads both plugins' source (no iOS build in CI).
- Not run locally; CI validates. CI builds the Android app, not the iOS one.
- The interface the iOS side implements is the plugin's `httpGetToFile` and its `packFileProgress` event, as
  `MmPacksApi.ts` declares them; `MmPacksPlugin.swift` already implements it (`PackFileTransfer`). Any other shell
  that brings a `PackFileFetch` passes the same contract suite.

## Owed on a phone
These are checks only a device can make; they do not hold the ticket open (owner, 2026-10-21).
- On a release build, both packs started together end installed with matching checksums.
- The WebView process's memory, watched in Android Studio's profiler (and Xcode's on an iPhone), does not grow with the
  download.
- A cancel and a resume end installed with a matching checksum.
- The iOS build of `MmPacksPlugin.swift` (CI builds the Android app, not the iOS one).
