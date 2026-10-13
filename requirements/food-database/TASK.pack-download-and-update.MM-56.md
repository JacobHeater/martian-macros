---
id: MM-56
status: in-progress
component: food-database
related: [MM-50, MM-51, MM-55, MM-57]
---

# Task: Download and update food packs

## Context
The app has no backend, but fetching a static file is not a backend. Packs are published as release files (GitHub Releases or a Hugging
Face dataset), which costs nothing to host.

## Decisions
Choices I made without asking (say if any is wrong):
- **The generic pack ships inside the app**, so search works from the first second.
- **The United States barcode pack is offered at the end of onboarding** ("Download foods for barcode scanning, about N MB"), on Wi-Fi by
  default, and can be skipped and fetched later from Settings.
- **A small manifest file** lists available packs with size, version and checksum. The app checks it at most once a week, and only tells
  the user an update exists; it does not download by itself.
- **A download is verified against its checksum** and swapped in only when complete, so a failed download leaves the old pack working.

## Description
A pack manager: list installed and available packs, download with progress and resume, verify, install, remove. Shown in Settings.

## Acceptance Criteria
```gherkin
Scenario: First download
  Given a new user on Wi-Fi who accepts the offer
  Then the pack downloads with visible progress and barcode scanning finds US products afterwards

Scenario: Interrupted
  Given a download that loses its connection halfway
  Then it resumes rather than restarting, and the app keeps working meanwhile

Scenario: Corrupt file
  Given a downloaded file whose checksum is wrong
  Then it is discarded and the previous pack stays installed

Scenario: Skipped
  Given the user declined the download
  Then search of generic foods still works, and scanning a barcode offers the download
```

## Notes
- This is the app's only routine network use. Say so plainly in the privacy text (MM-95): the request reveals an IP address to the host
  and nothing about the user's data.

## Decisions (product owner, 2026-10-09)
"Be transparent with the user, and show when it's downloading, and the user has a status indicator with a cancel button." Built that way (below).

## Progress (built and verified; status stays in-progress)
- **Download engine** (`mm_food_catalog`, pure Dart): `PackDownload` writes to a partial file, **resumes** from it with an HTTP range request (a server that ignores the range restarts cleanly), checks the **SHA-256**, unpacks the gzip, confirms the result opens as a pack of the right id and a format this app reads, and only then swaps it in, keeping the old pack until the new one is in place. A wrong checksum, a damaged or foreign file, a refused request or a dropped connection leaves the installed pack working. **Cancel** stops at once and keeps what arrived.
- **What the user sees** (Settings, Data, Food database): nothing is fetched by opening the screen. "See what is available" reads a small list from the host (the screen says which host, and that it reveals an IP address and nothing else). Each pack then shows its size, version, what the download will tell the host, a note that mobile data may be used, and a **Download** button that is the only thing that starts a download. While it runs the screen shows progress ("12 MB of 46 MB") with **Cancel**, and **a strip with the same progress and a Cancel button stays at the bottom of every screen** (the Dashboard, Food, anywhere) until it ends. A cancelled or interrupted download shows "Paused", what is kept, and **Resume** or **Discard**. A failure says what happened and that the pack already on the phone is untouched. An installed pack can be removed (with a confirmation).
- **Publishing side**: `mm food package --base-url https://...` compresses the built packs (deterministically) and writes `manifest.json` with each file's size and SHA-256; it uploads nothing. A manifest URL must be https and each entry needs a real checksum.
- **The app's first network permission**: `INTERNET` is added to the Android manifest, with a comment saying why. The app contains no other network code and the download address is empty in dev and prod config (`MM_FOOD_PACK_MANIFEST_URL`), so **today no build makes any request**: set the address in `config/*.json` once a host exists.
- Verified: 16 + 4 + 9 tests in `mm_food_catalog` (full download and install, progress, interrupted download resumes with a range request, range ignored, bad checksum keeps the old pack, cancel keeps the partial file and the old pack, restart after cancel, error status, wrong id or not a pack, remove, manifest parsing), 7 controller tests on a real file system, 7 widget tests of the screen and strip, and 4 end-to-end tests from a built pack through packaging, the manifest and the download. On the real packs: the 46.7 MB barcode pack (456,191 foods) went through download, checksum, gzip, open and swap in about 0.9 s from memory, and a name search of it took 9 ms.
- **Deviations from the ticket**:
  - **No weekly background check.** The ticket had the app check the manifest at most once a week by itself. Every request is user-initiated instead, to keep the offline promise literal; the cost is that the user finds out about an update only by opening Food database and tapping "See what is available".
  - **The generic pack does not ship inside the app yet**, and **the offer at the end of onboarding is not built**: the pack's license text is provisional (MM-57), and bundling or offering it waits for that review. Scanning does not exist yet (WS-08), so "scanning a barcode offers the download" is not built either.
  - Resume works within one session and across restarts of the download (the partial file persists); there is no background service, so Android may stop a download if the app is closed.
- **Not verified**: no real host exists, so **no download has run over a real network** and the HTTP client (`DartPackHttp`) is untested against a server; it has not been run on the emulator or a phone. Whether a 46.7 MB download is acceptable on mobile data is the user's to judge; the screen warns but does not detect Wi-Fi. The pack folder is in the app's support directory, which Android may include in its automatic backup; excluding it is not done.

## Progress (hosted and tested over a real network, 2026-10-09)
- **Host**: a public repository, [martian-macros-food-data](https://github.com/JacobHeater/martian-macros-food-data), with the packs attached to a GitHub Release (not committed to git, not in Git LFS: history would grow with every rebuild and LFS bandwidth is capped on the free plan). Release `2026-10-09` holds `barcode_us` (46.7 MB compressed), `generic` (0.76 MB) and `manifest.json`. The app's `MM_FOOD_PACK_MANIFEST_URL` (dev and prod config) is `.../releases/latest/download/manifest.json`, so publishing a new release needs no app change.
- **Real-network test** with the app's own download code (`DartPackHttp`, `PackDownload`) against that host: the manifest was read (HTTP 200); GitHub answers range requests with 206; a download was cancelled at 8,389,375 bytes, **resumed from that byte** and finished; the SHA-256 matched; the 140 MB pack unpacked, opened, searched ("chicken noodle soup" found) and a barcode lookup found a known product. Total resume time 1.4 s on this connection.
- The Food database screen now credits Open Food Facts (ODbL) and USDA FoodData Central and names the data repository.
- **Still not verified**: nothing has run on the Android emulator or a phone; slow or flaky mobile connections are untested; the licensing of the published files has not been read by a qualified person (MM-57), and the files are public now.
