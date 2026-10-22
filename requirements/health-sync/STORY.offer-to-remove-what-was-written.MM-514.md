---
id: MM-514
status: done
component: health-sync
related: [MM-70, MM-314, MM-489]
---

# Story: Turning writing off offers to remove what the app wrote

## Context
MM-70's last scenario: when writing is turned off, nothing further is written, and the app asks whether to remove what it
wrote before. The write path built on 2026-10-21 stops writing and leaves what was written, and the terms say so.

## Decisions
Choices I made without asking (say if any is wrong):
- **Asked once, when the switch is turned off**, with "Keep" first and "Remove" second; keeping is the default.
- **Only the app's own records of that kind** are removed: Health Connect lets an app delete only what it wrote, and
  HealthKit the same; the removal is by the app's source, not by a time range.
- **Found by the app's prefix for that kind, under every namespace** (`healthWritePrefix`): the plugin reads only the
  app's own records of that kind (Health Connect's data-origin filter, HealthKit's source predicate) and deletes those
  whose id starts with the prefix, so what was written before an erase (MM-522) goes too. A prefix not the app's own is
  refused by the plugin (2026-10-21, the builder).
- **The switch is off before the question**: turning it off stops writing at once, then the question is asked with the
  app's confirmation dialog, "Keep" the safe choice and first; closing it unanswered keeps. Removing needs the kind's
  write permission, not the kind on.
- **Weight (MM-513) and workouts are asked about too**, as food and water are.

## Description
Turning off "Send food you log to …", "Send water you log to …", "Send weight you type to …" or "Send workouts you finish
to …" asks whether to remove what the app wrote of that kind. Removing deletes only the app's own records of that kind from the platform; keeping leaves them.

## Acceptance Criteria
```gherkin
Scenario: Kept
  Given food was written to the health app
  When writing food is turned off and "Keep" is chosen
  Then what was written stays, and nothing more is written

Scenario: Removed
  When writing food is turned off and "Remove" is chosen
  Then the app's food records are gone from the health app, and another app's are not touched
```

## Notes
- The terms (MM-242, section 9) say what was written stays when writing is turned off; they change with this ticket.
- Built 2026-10-21: `HealthWriting.removeWritten` (contract `healthWritingContract`), the plugins' `removeWritten`
  (`test/native/mmHealthWrites.test.ts`; `test/platform/nativeHealthWriting.test.ts` for another app's records and every
  namespace), the question in `HealthWritingGroup` (`test/settings/healthWriting.test.tsx`, stories
  `HealthConnectWritingOff` and `HealthConnectWritingRemoved`). Terms section 9 and the privacy policy say the app asks
  (terms version 4).

## Progress
Done (2026-10-21, PR #238): both scenarios are built and held by the tests named in the notes; not run locally, CI
validates.

- Integrations review fix 2026-10-21 (`fix/health-plugins-review`): on Android, a removal of a whole kind (the
  kind's prefix, which every record of its type the app writes carries) is `deleteRecords(type, TimeRangeFilter)` from
  the epoch to 400 days ahead: Health Connect deletes only the caller's own records, and a delete is not held to the
  thirty days a read is. A narrower prefix still reads the app's records, and when a read over everything is refused,
  falls back to the last thirty days. Test: `test/native/mmHealthWrites.test.ts`.

## Owed on a phone
- Health Connect lets the app read its own records of a kind it may only write, including ones older than thirty days,
  so "Remove" finds them.
- HealthKit's delete removes the app's own samples and no other app's.
- Android, without the history permission: a food written more than thirty days ago is removed when "food" is turned
  off and the removal accepted (the delete by time), and another app's nutrition records are untouched.
