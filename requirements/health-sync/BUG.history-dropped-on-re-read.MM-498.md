---
id: MM-498
status: proposed
component: health-sync
related: [MM-68, MM-73, MM-67]
---

# Bug: a re-read after an expired token drops history the app may no longer see

## Context
Found reading the code while building MM-73 (2026-10-21), not seen on a phone. When the platform no
longer honors an import token, `HealthImporter` reads everything again and makes the store match it
exactly (MM-67). Health Connect shows only the thirty days before the first grant unless the history
permission (MM-73) is granted. If that permission is taken away and a token later expires (Health
Connect expires one after about thirty days unread), the re-read sees thirty days and the store is
made to match: the history read before is removed, though MM-68 keeps what was read when a permission
is taken away.

## Description
A re-read after an expired token removes only readings the platform could have shown and no longer
does; readings from before what the platform lets the app see are kept.

## Acceptance Criteria
```gherkin
Scenario: History permission taken away, then a token expires
  Given a year of weigh-ins read with the history permission
  And the history permission is later taken away
  When an import finds its token expired and reads again
  Then the weigh-ins older than the platform's window are still kept
  And readings deleted on the platform within its window are removed
```

## Notes
- Guarded by the skipped test "MM-498: a re-read after the history permission is taken away keeps
  the history" in `apps/mobile/test/healthIngest/healthBackfill.test.ts`. Unskip it with the fix.
- A likely fix: `HealthImporter`'s re-read replaces only from the earliest moment the source can show,
  which needs the source to say where its window starts.
