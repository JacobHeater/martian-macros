---
id: MM-441
status: in-progress
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

## Notes
- A window that crosses midnight raises which day a reading counts for: decided above, it cannot.
- Built 2026-10-21 (not run locally; CI validates): `WeighInWindow` (`src/healthIngest/WeighInWindow.ts`), with
  `WeighInWindow.usual` as 04:00 to 12:00; `dailyWeighIns` takes the window (`window`, the usual one when not given);
  `WeighInWindowReader` and `WeighInWindowWriter` with the in-memory `InMemoryWeighInWindow` and the contract suite
  `test/contracts/weighInWindowContract.ts`. The first two scenarios are `test/healthIngest/dailyWeighIns.test.ts`, "a
  weigh-in window that was moved (MM-441)".
- **Left: the place it is kept, and the Settings row.** The preferences table has no column for the window and the schema
  change is another branch's (version 17), so the window is not yet in the app's services, `AppState` still passes the
  usual window, and no Settings row moves it: a row whose choice is forgotten on restart would fail "The choice is kept".
  When a version has the column, `SqlPreferencesRepository` implements the reader and writer and runs the contract,
  `AppState` reads the window into `dailyWeighIns`, and the row sits beside "Primary scale" (`PrimaryScaleRow`) with its
  stories.
