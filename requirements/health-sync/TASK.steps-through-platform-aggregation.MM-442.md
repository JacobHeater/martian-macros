---
id: MM-442
status: proposed
component: health-sync
related: [MM-71, MM-66, MM-68, MM-69]
---

# Task: Steps read through the platform's own aggregation

## Context
MM-71 decided, with the product owner, that for steps the app trusts the platform's own aggregation, which already applies the
priority the user set in their phone's health settings, rather than adding up raw samples from a phone and a watch that count
the same walk twice. Today steps are imported as raw samples and nothing in the app uses them yet, so the decision was not
built. It moved here from MM-71's Progress.

## Description
A day's steps come from the platform's aggregate for that day (Health Connect's aggregate request, HealthKit's statistics
query), behind the `HealthSource` interface with the fake answering as the platforms do. Needs the native plugins and a device
to verify.

## Acceptance Criteria
```gherkin
Scenario: Two devices count the same walk
  Given the phone and a watch each recorded 5,000 steps for the same walk
  When the day's steps are read
  Then the day has the platform's total, not 10,000

Scenario: The fake answers as a platform does
  Given a recorded history with overlapping steps from two sources
  Then the fake's daily total follows the source priority it was given
```

## Notes
- Steps are display-only context for now (WS-11 "Excluded or deferred"); build this before anything reads them.
