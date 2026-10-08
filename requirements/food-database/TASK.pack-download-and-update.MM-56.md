---
id: MM-56
status: proposed
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
