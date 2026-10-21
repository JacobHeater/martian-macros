---
id: MM-441
status: done
component: health-sync
related: [MM-71, MM-66, MM-68, MM-69]
---

# Task: A weigh-in window for a morning that is not 04:00 to 12:00

## Context
MM-71 counts the first imported reading between 04:00 and 12:00 local time as the day's weigh-in, otherwise the middle of the
day's readings. That assumes a usual sleep schedule: a night-shift worker who weighs after waking at 15:00 gets the middle of
the day instead of their first reading. MM-71 left the window as a small later addition; this is it.

## Decisions
Choices made without asking the owner (say if any is wrong):
- **A window never crosses midnight.** It starts and ends within one day (it may run from 00:00, or up to midnight), so a
  reading always counts for the calendar day it was taken on and the day's weigh-in, trend and typed-value rules are
  unchanged. A person who weighs after waking at 23:00 is the case this leaves out; a window that crosses midnight would
  need a rule for which day such a reading counts for, and is a later ticket if it is wanted.
- **The window is kept to the minute**, from its start up to, not including, its end, as 04:00 to 12:00 is now.
- **Built like its sibling (rule 9):** the row is laid out as "Primary scale" (`PrimaryScaleRow`, MM-71), beside it in the
  health platform's section: the window in force as the subtitle, and an edit button. It is shown whenever weight is
  allowed, not only with two scales, since the window applies to one scale too.
- **Two questions, start then end**, each the app's own time-of-day drums (`overlays.timeOfDay`, every minute). The end is
  asked after the start so it can be refused in place: an end at or before the start is refused with its reason while the
  drums stay on it (the dialog gained `refuse`, as the clock-time dialog has, MM-222). Midnight, the one end that is not a
  time of the same day, is 12:00 AM on the drums, and the row says it as "midnight".
- **Going back is moving it back:** a window set to 4:00 AM to 12:00 PM is the usual one again (nothing is kept), so no
  separate "reset" control was added.

## Description
The window in which an imported reading counts as the morning weigh-in can be moved in Settings, beside the primary scale, and
the rule of MM-71 applies within it. Until it is moved it is 04:00 to 12:00, as now.

## Acceptance Criteria
```gherkin
Scenario: The usual window by default
  Given no window was chosen
  And readings at 06:40 and 21:10
  Then the 06:40 reading counts

Scenario: A later morning
  Given the window was moved to 14:00 to 22:00
  And readings at 09:00, 15:10 and 21:00
  Then the 15:10 reading counts

Scenario: The choice is kept
  When the window is moved and the app is opened again
  Then the moved window applies
```

## UI/UX
- The weigh-in window in Settings — apps/mobile/src/gallery/screens/Settings.stories.tsx
  (Stories: HealthConnectWeighInWindow, HealthConnectWeighInWindowMoved, HealthConnectWeighInWindowEndRefused,
  HealthConnectWeighInWindowFails).

## Notes
- A window that crosses midnight raises which day a reading counts for: decided above, it cannot.
- Built 2026-10-21 (not run locally; CI validates): `WeighInWindow` (`src/healthIngest/WeighInWindow.ts`), with
  `WeighInWindow.usual` as 04:00 to 12:00; `dailyWeighIns` takes the window (`window`, the usual one when not given);
  `WeighInWindowReader` and `WeighInWindowWriter` with the in-memory `InMemoryWeighInWindow` and the contract suite
  `test/contracts/weighInWindowContract.ts`. The first two scenarios are `test/healthIngest/dailyWeighIns.test.ts`, "a
  weigh-in window that was moved (MM-441)".
- Built 2026-10-21, the rest (not run locally; CI validates): schema version 19 adds `weigh_in_window_start_minute` and
  `weigh_in_window_end_minute` to `user_preferences` (both empty until moved: 04:00 to 12:00; each checked to lie within
  the day; one end without the other, or a window kept backwards, is refused when read). `SqlPreferencesRepository` and
  `InMemoryPreferencesRepository` keep the window (the separate `InMemoryWeighInWindow` was folded into the latter), and
  `weighInWindowContract` runs against both. The services carry it as `weighInWindow`; `AppState.weighInWindow` is read
  into `dailyWeighIns`, so moving it chooses the day's reading again. "Weigh-in window" (`WeighInWindowRow`) sits beside
  "Primary scale". Erasing empties it (the eraser contract); a backup carries it (`test/data/restore.test.ts`).
- Tests: the first two scenarios also through the app, `test/settings/weighInWindow.test.tsx`, which moves the window in
  Settings to the minute, sees an early end refused, ends it at midnight and moves it back; "The choice is kept" is
  `test/data/upgrade.test.ts` ("a version 18 database ...") with `weighInWindowContract` against SQLite.
- Device check owed: the row on the phone, moving the window and seeing the day's imported weigh-in follow it.
