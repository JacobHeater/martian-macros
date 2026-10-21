---
id: MM-498
status: done
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
- Guarded by "MM-498: a re-read after the history permission is taken away keeps the history" and
  "MM-498: a reading deleted on the platform within its window is still removed by the re-read" in
  `apps/mobile/test/healthIngest/healthBackfill.test.ts`, and by the `healthHistoryAccessContract`
  case "shows everything once the history is permitted, and from a moment otherwise (MM-498)".
- Fixed 2026-10-21: `HealthHistoryAccess.readableFrom()` says where what the platform shows starts
  (undefined when it shows everything). `HealthImporter`'s re-read still makes the store match the
  platform exactly when nothing limits it; otherwise it keeps what it read, and removes only stored
  readings from that moment on that the platform no longer has.
- Health Connect's plugin does not say when the first permission was granted, so
  `NativeHealthSource` answers thirty days before now, never earlier than the real window. A
  reading deleted on the platform between the real window's start and that moment is kept by such
  a re-read; keeping too much is the safe side.
