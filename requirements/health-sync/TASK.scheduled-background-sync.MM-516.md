---
id: MM-516
status: done
component: health-sync
related: [MM-72, MM-68, MM-69, MM-67]
---

# Task: Read the health platform about once a day while the app is closed

## Context
MM-72 keeps imported data current from the app's own lifecycle: it reads on opening and on coming back to the front. The product owner
also decided on a background run (MM-72's Decisions): Health Connect's changes API run by WorkManager about once a day on Android, and
anchored queries with background delivery on iOS. That half was split out here because:

- WorkManager is not a dependency of the Android project, and dependencies are not added without the owner (Android's own
  `JobScheduler` needs none and may do instead).
- While the app is closed there is no web view, so `HealthImporter` (TypeScript, MM-67) does not run. A background run has to either
  import natively into the same store, duplicating the importer, or only fetch and hold changes for the next opening, which the opening
  read already does.
- Health Connect refuses reads off screen without `READ_HEALTH_DATA_IN_BACKGROUND`, asked for separately.

## Decisions
- **Declined by the owner (2026-10-21): no background sync.** "No, I don't want bg sync. If the app needs more data to close gaps, it can inform the user that without the data it will have gaps which can affect coaching and trajectory accuracy, but that should ultimately be up to the user." Nothing here is built; the app reads only while open (MM-72), and saying what a gap costs is MM-523.

Choices I made without asking (say if any is wrong):
- **Background sync stays a convenience, not a dependency** (MM-72). Nothing breaks if it never runs.
- **It is off until the user turns it on in Settings**, and Android's background permission is asked for only then.
- **It is a separate plugin, not part of `MmHealth`**, with its Swift twin, behind an interface in `src/platform/`.

## Description
A scheduled run, about once a day, that brings what is kept up to date while the app is closed, saving the token or anchor after each
successful run. Which of the two shapes above it takes is decided first, with the owner, and recorded here.

## Acceptance Criteria
```gherkin
Scenario: Turning it on
  Given background sync is off
  When the user turns it on in Settings
  Then the platform's background permission is asked for, and a run about once a day is scheduled

Scenario: A run while the app is closed
  Given background sync is on and permitted
  And a weigh-in was added on the platform
  When the scheduled run happens
  Then the weigh-in is imported, and the next opening reads nothing new

Scenario: Refused
  Given the user refuses the background permission
  Then no run is scheduled, and opening the app still brings everything up to date

Scenario: Battery
  Given background sync has been on for a week on a real phone
  Then its battery use does not show in the phone's battery statistics
```

## Notes
- Needs a release build check on a phone, and a week's battery measurement, before it is done.
