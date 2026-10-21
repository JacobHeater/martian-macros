---
id: MM-72
status: done
component: health-sync
related: [MM-66, MM-67, MM-68, MM-69, MM-73, MM-498, MM-516]
---

# Task: Keep imported data current without draining the battery

## Context
The data that matters changes about once a day (a morning weigh-in). Polling for it every few minutes would be waste, and both platforms
restrict background work, Android's limits varying by manufacturer.

## Decisions (made with the product owner)
- **Superseded by the owner (2026-10-21): no background sync on either platform.** The WorkManager and background-delivery
  decisions below are withdrawn; the app reads on opening and on coming back (built), and MM-516 is closed. Where missing data
  weakens coaching, the app says so and the user decides (MM-523).
- **Android**: Health Connect's changes API, run by WorkManager about once a day, plus a sync whenever the app is opened. When a change
  token has expired (after about thirty days unused), re-read the whole window and take a new token.
- **iOS**: anchored queries with background delivery, on the system's schedule.

Choices I made without asking (say if any is wrong):
- **Opening the app always syncs**, so what the user sees is current even if no background run happened.
- **Background sync is a convenience, not a dependency.** If the system never runs it, nothing breaks.
- **Android's background read permission is requested separately and only when the user turns on background sync.**
- (2026-10-21) **This ticket is the foreground half; the scheduled background run is MM-516.** WorkManager is not a dependency of the
  Android project and none is added here, and a run while the app is closed has no web view to run the importer in, so it needs its own
  design. Since background sync is a convenience, everything the scenarios below ask for is met from the app's own lifecycle.
- (2026-10-21) **Coming back to the front reads only when the last successful read is fifteen minutes old or more**
  (`HealthSyncSchedule`). Switching apps does not spend a read; a weigh-in still shows the same morning. Opening the app and "Read now" in
  Settings always read. A read that failed does not count, so the next return tries again.
- (2026-10-21) **One read at a time.** Opening and coming back while a read runs share it; asking in Settings while one runs waits for it
  and reads again, so a kind allowed just then is read.
- (2026-10-21) **When the last read happened is kept in memory, not stored.** A fresh start of the app is an opening, which always reads,
  so nothing needs to survive the process. No table changes.
- (2026-10-21) **The trend is not held back until the read finishes.** It is drawn from what is kept and drawn again as soon as the
  import lands; holding the screen on a slow or unreadable platform would be worse than a redraw. The first scenario says so.

## Description
Incremental sync using the platform's change mechanism, saving its token or anchor after each successful run (MM-67's `HealthImporter`).
The app reads the platform when it opens, when it comes back to the front if the last read is old enough, and when asked in Settings.

## Acceptance Criteria
```gherkin
Scenario: Opening the app
  Given new readings since the last sync
  When the app is opened
  Then they are imported, and the trend is drawn again with them

Scenario: Coming back soon after a read
  Given a read finished less than fifteen minutes ago
  When the app comes back to the front
  Then the platform is not asked again

Scenario: Coming back later
  Given a read finished fifteen minutes ago or more
  When the app comes back to the front
  Then what changed since is imported

Scenario: Only what changed
  Given a sync yesterday
  Then today's sync reads only records added, changed or deleted since

Scenario: An expired token
  Given the app was not opened for six weeks
  Then the sync re-reads the window, imports without duplicates, and saves a new token

Scenario: Background work never runs
  Given a phone that kills background work
  Then opening the app still brings everything up to date

Scenario: One read at a time
  Given a read is running
  When the app is opened or comes back to the front
  Then it waits for that read instead of starting another
```

## Notes
- Built 2026-10-21: `apps/mobile/src/healthIngest/HealthSyncSchedule.ts` (the rule), `HealthSyncReason.ts`, `AppState.syncHealth(reason)`
  (the schedule and one read at a time), and `App.tsx` passing `opened` and `resumed`. Tests:
  `apps/mobile/test/healthIngest/healthSyncSchedule.test.ts` and `apps/mobile/test/state/healthSync.test.ts`. Not run locally; CI
  validates.
- No native change. Device check owed: on a phone, switch away and back within a minute (no read), and again after fifteen minutes (a
  weigh-in added in Health Connect meanwhile appears).
- Measuring battery use over a week belongs with the scheduled run (MM-516); reads tied to the app being on screen add nothing to it.
