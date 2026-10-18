---
id: MM-395
status: done
component: health-sync
related: [MM-68, MM-71, MM-320]
---

# Bug: a reading's source was shown as its package id, which ran out of the card

## Context
The owner, on a phone (2026-10-18): Settings > Health Connect > Steps read "Allowed. 28 readings from
com.android.healthconnect.phone.j07164f9d1f553234a69c64d", one word too long to wrap, running past the
card's edge. The native plugin sent every record with an empty name, and the adapter put the package
id in its place; the list row had no rule to break a long word. An imported weigh-in on the Dashboard
would have said "From com.…" the same way.

## Description
- The plugin names a record's source by the app's own label from the package manager ("Google Fit");
  a package that is not an app on the phone (what the phone records itself) has no name.
- The app never shows a package id as a name. Readings with no named source are counted ("Allowed. 28
  readings."); a weigh-in from one says "From Health Connect." Readings kept before this fix, with the
  id in place of the name, are read as having none.
- A list row breaks a word longer than its line.

## Acceptance Criteria
```gherkin
Scenario: Steps the phone counted itself
  Given steps whose source has no app name
  When Settings shows Health Connect
  Then the Steps row says "Allowed." and how many readings
  And no package id is shown

Scenario: A weigh-in from an unnamed source
  Then its line says it came from Health Connect

Scenario: A word longer than the line
  Then the row's text breaks inside the card
```

## Notes
Regression tests: `apps/mobile/test/settings/healthSourceNames.test.tsx` (all three failed before the
fix); `test/platform/healthConnectSample.test.ts` now holds that no name stays none. Story:
`HealthConnectUnnamedSource`. The native label lookup is compiled by CI's Android build and not yet
seen on a phone: on the phone checklist.
