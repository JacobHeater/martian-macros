---
id: MM-250
component: sleep
status: done
related: [MM-249, MM-66, MM-68, MM-69, MM-71, MM-116, MM-61]
---

# Story: a night of sleep, recorded

## What is built

- **A sleep record**: one row per night (the calendar day the night ended
  on), minutes asleep, and the source: a health platform's sleep session,
  or typed. Schema: a `sleep_nights` table, one migration step, the next
  version in the schema lane.
- **Imported**: `sleep` joins `HealthDataType`; `MmHealth` reads Health
  Connect sleep sessions (and HealthKit sleep analysis when iOS exists,
  MM-69), granted separately like every other type (MM-68). Several
  sessions in one night are summed; the first source to report a night
  wins and a typed value wins over an import, as MM-71 rules for weight.
- **Typed**: a card on the Progress screen, "Last night", with hours and
  minutes and the same stepper the other entries use; editable for any
  night in the last fourteen days.
- **Read back**: a reader (`SleepReader`) with the in-memory and SQL
  implementations under one contract suite, and a state cell for the
  fourteen-day average that MM-252 and the check-in pre-fill use.
- **Erased** with everything else; **excluded** from OS backups with the
  rest of the database (MM-65).

## Acceptance criteria

```gherkin
Scenario: Imported nights
  Given sleep is granted on Health Connect and two sessions last night
  When the app opens
  Then one record exists for last night with the sessions' sum and the platform as source

Scenario: A typed night
  When 7 h 20 m is typed for last night
  Then the record says 440 minutes, typed, and an import for that night does not replace it

Scenario: Nothing granted
  Given sleep is not granted
  Then nothing is requested again until the person asks, and typed nights still work

Scenario: Substitutable storage
  Then the SQL and in-memory sleep stores pass the same contract
  And a database at the previous version upgrades with nothing lost

Scenario: Privacy
  Then the records are in the app's database only, and the privacy policy names sleep among the data kept (MM-95)
```

## Notes

- The night is attributed to the day it ended on, so "last night" on
  Tuesday is the Monday-to-Tuesday sleep.
- Permissions: Health Connect's `READ_SLEEP`; Play's form lists it (MM-95).

## UI/UX

- Sleep on Progress — apps/mobile/src/gallery/screens/Progress.stories.tsx (Stories: SleepNotRecorded, SleepRecorded, SleepFromWatch, SleepMistyped, SleepMinutesMistyped, SleepReadFailed, SleepLoading). The section open while last night is not recorded, folded to its line otherwise; the fortnight as chips; hours and minutes, then the note beside Save as the waist's; a night from the watch picked; a read that failed, with Try again. Reviewed by the panel's product designer and UX guard on 2026-10-20 (docs/agent-runs/mm250-sleep): no blocking finding; the dispositions are in its decision.md.
- Hours and minutes — apps/mobile/src/gallery/Fields.stories.tsx (the `MmDurationField` in the fields catalog, plain and in error).
- The Sleep row in Settings — apps/mobile/src/gallery/screens/Settings.stories.tsx (the Health Connect stories list it with the other kinds).

## Progress (2026-10-20, feat/m2)

**Built.**
- The record: `SleepNight` (the day the night ended on, minutes asleep, `SleepSource` typed or imported, the source's name) with `SleepReader`, `SleepWriter` and `SleepRepository` in `domain/repositories`; `SqlSleepRepository` over the new `sleep_nights` table and `InMemorySleepRepository`, registered in `SqlRepositories`, `InMemoryRepositories` (erased with the rest), `AppServices`, `openAppServices` and the gallery's `fixtureServices`. Schema version 13 (this lane; version 12 is another's): `currentSchemaVersion`, `currentSchema` (the table, and the `sleep_disorder` column of MM-251), `tables`, the step keyed 12 in `migrationSteps`, the fingerprint for 13, and an upgrade test from a version-12 database.
- Imported: `sleep` joins `HealthDataType`; the Kotlin `MmHealth` plugin reads `SleepSessionRecord` (the asleep stages summed, or the span when there are none) under `READ_SLEEP` in the manifest; the Swift plugin reads sleep analysis, each asleep segment as one reading (in bed and awake left out). `healthConnectSample` keeps the minutes. `nightlySleep` (healthIngest) sums a night's sessions and lets the first source to report the night win; `mergeSleepNights` (state) puts a typed night over an imported one, as `mergeWeighIns` does for weight. The Settings health section offers Sleep like every other kind, granted by itself.
- Typed: `SleepNightCard` on Progress, between Period days and Waist: the section's line is last night; inside, the last fourteen nights as chips, `MmDurationField` (new in `src/ui`, hours and minutes as two dense fields) beside a secondary Save, and a caption counting the nights recorded and saying a typed night is used over a read one.
- Read back: `AppState.typedSleep`, `importedSleep`, `sleepNights` (merged) and `sleepAverage` (the fourteen-night average, `sleepAverageOf`), which MM-252 and the check-in pre-fill read.
- Privacy: the terms list nights of sleep among the data kept; nothing leaves the phone.

**Tests.** `test/contracts/sleepRepositoryContract.ts` against SQLite and in memory; `test/healthIngest/nightlySleep.test.ts`; `test/state/mergeSleepNights.test.ts`; `test/platform/healthConnectSample.test.ts` (the sleep case); `test/data/upgrade.test.ts` (version 12 to 13), `schema.test.ts`, `schemaFingerprint.test.ts`; `test/progress/sleepEntry.test.tsx` (7 h 20 m becomes 440 minutes typed; two watch sessions make one night of 6 h 50 m and a typed night is used instead of it, through another import; any of the fourteen nights; a mistyped value refused in place).

**Native, unverified.** The Kotlin and Swift changes were written without a device or a build in this session: not compiled, not run. Check them with a release build before relying on them (AGENTS.md).

**Decided here (say if wrong).**
- Imported nights are not copied into `sleep_nights`: they stay in `imported_samples` as the weight readings do (MM-71), and the merged list is derived; the table holds what the person typed, and carries the source column so an imported night could be kept there later without a schema change.
- "The first source to report a night" is the source whose earliest session of that night began first; a tie goes to the source id that sorts first.
- A session with no end is kept against its start; a nap that ends in the afternoon is summed into that morning's night.
- The sibling for the night chips is `PeriodDaysCard` (the last two weeks as `MmChoiceChip`s) and for the entry `WaistEntryCard`: its fields in a row, then the note beside a quiet Save beneath them, which this section copies exactly (the panel's PD-2). No entry on Progress uses a stepper, so the ticket's "same stepper the other entries use" (above) describes nothing in the app: two number fields with the decimal keyboard were built, which both reviewers agreed with for a value with up to 1,440 answers; `MmDurationField` was made so the check-in's typical hours use the same control (MM-252).
- The chips carry a recorded night's hours ("Last night · 7 h 20 m") and a bare label for an unrecorded one: the UX guard's walkthrough found that contrast is how a novice tells the two apart without a legend. In Period days the same chip's check means "marked"; here it means "picked", and the hours text is the record's mark (the panel's PD-5). The chips sit before the fields because "Last night" is pre-picked, so the daily task is one scroll and a press; the designer would rather have the fields first (PD-3), which with the chips' hours is the owner's call after a render, listed in MM-416.
- The note under the fields names the picked night in every state ("The night before: not recorded yet. 3 of the last 14 nights recorded."), and Save says what it saved in the status host ("Saved: Last night, 7 h 20 m."); the keyboard is dismissed as every entry does (MM-317).
- The fields sit inside the open section, as the waist's do; screen-direction rule 1 as amended by MM-291 wants controls on a surface, and the hierarchy check runs only on the folded destination story. Whether both entries move onto a surface or the exception is written is the owner's, MM-416 (the panel's PD-1). Progress also runs past the four-group budget in design/design-map.json, before and after this change (PD-12); the Sleep section is folded to a line once last night is recorded.
- A read of the nights that went wrong is said in the section with Try again, never shown as no nights (MM-334); while they load the section waits on its spinner.
- Nights are named by the morning they ended on: "Last night", "The night before", then the weekday and date. The caption says so.
- The Sleep section is open while last night is not recorded and folded to its line otherwise, as the recovery section opens when its check-in is due (MM-256).
- A night is replaced, never deleted; deleting a typed night is not built.
- The terms gain "nights of sleep" without a new version: they are a draft at version 1 and have not shipped (MM-242).
