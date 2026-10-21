---
id: MM-70
status: in-progress
component: health-sync
related: [MM-66, MM-67, MM-38, MM-48, MM-242, MM-314, MM-489, MM-513, MM-514]
---

# Story: Write what I eat to my phone's health app

## Context
See MM-66. Users who keep their health data in one place expect a food logger to contribute to it.

## Decisions
Choices I made without asking (say if any is wrong):
- **Off by default**, enabled per platform in Settings.
- **Written per entry**: energy, protein, carbohydrate and fat, plus fiber, sugars, saturated fat and sodium when the entry has them, with
  the meal and the time it was logged.
- **Edits and deletions are mirrored**: changing or removing an entry in the app updates or removes what was written.
- **Only this app's own records are ever changed or deleted.**
- **Body weight typed in the app is also written**, as weight, so the user's other apps see it. Split out as MM-513.
- **One switch per kind, each with its own permission** (2026-10-21): "Send food you log to …", "Send water you log to …" (MM-314)
  and "Send workouts you finish to …" (MM-489), a card under the reading rows of the health platform's section in Settings.
  Turning one on asks for that kind's write permission alone, never with reading. Refused, it stays off and says so.
- **Kept by the plugin.** Whether a kind is on is kept in the health plugin's own preferences on the phone, not the
  database, so no schema change was needed (schema v16 is held elsewhere) and it survives a restart.
- **At its meal's time.** An entry keeps a day and a meal, not the minute it was logged, so a food is written at a fixed time
  for its meal on its day (breakfast 08:00, lunch 12:30, snack 15:30, dinner 18:30), for 30 minutes. An edit replaces it in
  place.
- **Under the app's own id** (`martian-macros-food-<entry id>`), as Health Connect's client record id with a growing version,
  and on iOS as metadata with a sync identifier; a removal removes only that.
- **Turning it off writes nothing more and leaves what was written.** Asking whether to remove it is MM-514.
- **Mirrored by wrapping the food log** (`MirroredFoodLog`) where `openAppServices.ts` chooses implementations, so every
  screen that logs, edits or removes a food is covered. The app's log is saved first; a platform that refuses or fails
  changes nothing in the app.

## Description
When enabled, each logged food is written to Health Connect or Apple Health, and kept in step with later edits.

## Acceptance Criteria
```gherkin
Scenario: A logged food appears
  Given writing is enabled
  When a 510 kcal entry is logged
  Then the phone's health app shows 510 kcal of dietary energy from Martian Macros at that time

Scenario: An edit is mirrored
  When that entry is changed to 450 kcal
  Then the health app shows 450, not 960

Scenario: A deletion is mirrored
  When the entry is deleted
  Then it is gone from the health app

Scenario: Turning it off
  When writing is disabled
  Then nothing further is written, and what was written stays (asking to remove it is MM-514)

Scenario: Its own permission
  Given reading from the health app is allowed
  When "Send food you log to …" is turned on
  Then only the permission to write food is asked for, and refused, the switch stays off
```

## Notes
- Depends on editing entries existing (MM-48) to be worth testing fully.
- Never read back the app's own written nutrition as input. Both plugins now skip the app's own records when reading.
- Built 2026-10-21, not run locally; CI validates: `HealthWriting` and `HealthIntakeWriter` (`src/healthIngest/`), moved
  off `HealthSource`, which only reads; `NativeHealthWriting`, `NoHealthWriting` and `InMemoryHealthWriting`, each held to
  `healthWritingContract` and `healthIntakeWriterContract`; `MirroredFoodLog` with the food repository contract
  (`test/healthWrite/mirroredLogs.test.ts`); the switches in `HealthWritingGroup` (stories `HealthConnectWriting`,
  `AppleHealthWriting`; `test/settings/healthWriting.test.tsx`); `WRITE_NUTRITION` in the manifest; the terms, version 3
  (`test/terms/termsText.test.ts`).
- Owed on a device: a logged food shows in Health Connect and Apple Health at its meal's time with its nutrients; an edit
  leaves one record; a deletion removes it; the switch is still on after the app is closed; refusing leaves it off.
- "Erase all data" leaves what was written (the terms and the privacy policy say so). Entry ids start again after an erase
  or a restore, so every written id carries a write namespace that is renewed then (MM-522).
- The privacy policy draft (MM-95), section 3 and the erase paragraph, now says what is written, as the terms do
  (`test/terms/privacyText.test.ts`). Its version stays 1: it took effect the same day and has not been released.
