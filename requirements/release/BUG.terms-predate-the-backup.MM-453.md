---
id: MM-453
status: proposed
component: release
related: [MM-242, MM-63, MM-64, MM-95, MM-69]
---

# Bug: the terms of use and the HealthKit purpose string predate the backup

## Context
Found while drafting the privacy policy (MM-95), 2026-10-21. The terms of use (MM-242) were written on 2026-10-12, before the
encrypted backup (MM-63, MM-64) was built on 2026-10-19. Since then a person can make an encrypted copy of every record and send it,
through the share sheet, wherever they choose. Three texts the person reads still say otherwise:

- the terms, section 10: "The app makes no copy of your records anywhere else." (`apps/mobile/src/terms/termsOfUse.ts`);
- the iPhone's Apple Health permission text: "The app only reads, and nothing read leaves this device."
  (`NSHealthShareUsageDescription`, `apps/mobile/ios/App/App/Info.plist`);
- MM-242's own acceptance criterion and `apps/mobile/test/terms/termsText.test.ts` forbid the terms from mentioning encryption or a
  backup, which was right when no backup existed.

The privacy policy (MM-95, section 6) already describes the backup as it is. The terms are a legal draft, so their wording is for the
owner and the attorney, not changed here.

## Description
- The terms say that the app makes a copy only when the person makes a backup, that it is encrypted on the phone with their
  passphrase, and that it goes only where they send it; section 10's "no copy" sentence goes; `version` is raised and `changes` says
  what changed.
- MM-242's "The words" criterion and the terms test allow the backup to be described (still no claim of secure deletion, and no
  encryption of the records on the phone).
- The Apple Health purpose string drops "nothing read leaves this device" (MM-95 proposes a replacement).

## Acceptance Criteria
```gherkin
Scenario: The terms describe the backup
  Then the terms no longer say the app makes no copy of the records
  And they say a backup is made only when the person makes one, encrypted with their passphrase, and goes where they send it

Scenario: Agreed again
  Given someone agreed to the version before this change
  Then the terms are shown as changed, with what changed

Scenario: The permission text
  Then the Apple Health purpose string does not say that nothing read leaves the device
```

## Notes
- Regression test: `apps/mobile/test/terms/termsText.test.ts`, "MM-453: say that a backup is made only when the person makes one,
  and goes where they send it", skipped with this ID until the wording is settled.
- The Android manifest's comment says the same thing, but it is a comment, not text a person reads.
