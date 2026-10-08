---
id: MM-72
status: proposed
component: health-sync
related: [MM-66, MM-67, MM-68, MM-69, MM-73]
---

# Task: Keep imported data current without draining the battery

## Context
The data that matters changes about once a day (a morning weigh-in). Polling for it every few minutes would be waste, and both platforms
restrict background work, Android's limits varying by manufacturer.

## Decisions (made with the product owner)
- **Android**: Health Connect's changes API, run by WorkManager about once a day, plus a sync whenever the app is opened. When a change
  token has expired (after about thirty days unused), re-read the whole window and take a new token.
- **iOS**: anchored queries with background delivery, on the system's schedule.

Choices I made without asking (say if any is wrong):
- **Opening the app always syncs**, so what the user sees is current even if no background run happened.
- **Background sync is a convenience, not a dependency.** If the system never runs it, nothing breaks.
- **Android's background read permission is requested separately and only when the user turns on background sync.**

## Description
Incremental sync using the platform's change mechanism, saving its token or anchor after each successful run.

## Acceptance Criteria
```gherkin
Scenario: Opening the app
  Given new readings since the last sync
  When the app is opened
  Then they are imported before the trend is drawn

Scenario: Only what changed
  Given a sync yesterday
  Then today's sync reads only records added, changed or deleted since

Scenario: An expired token
  Given the app was not opened for six weeks
  Then the sync re-reads the window, imports without duplicates, and saves a new token

Scenario: Background work never runs
  Given a phone that kills background work
  Then opening the app still brings everything up to date
```

## Notes
- Measure battery use on a real device over a week before calling this done; "about once a day" should be invisible in the battery
  statistics.
