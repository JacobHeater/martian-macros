---
id: MM-73
status: done
component: health-sync
related: [MM-66, MM-68, MM-69, MM-17, MM-23, MM-71, MM-498]
---

# Story: Start with my existing history

## Context
A new user with a smart scale may have months of weigh-ins in their health store. With them, the trend is settled on day one, and the
expenditure estimate needs only the food log to catch up.

## Decisions (made with the product owner)
- **Request Android's history permission.** By default Health Connect lets an app read only the thirty days before permission was granted;
  reading further back needs a separate permission.

Choices I made without asking (say if any is wrong):
- **Up to a year is imported**, in the background, with the trend filling in as it arrives.
- **Calibration still lasts fourteen days** (MM-24): history gives a trend, but the estimate also needs food logged in this app.
- **If the history permission is refused, the app uses the thirty days it is allowed** and says nothing more about it.
- (2026-10-21) **The history is asked for once**, with the first of weight, body fat, lean mass or menstruation allowed in
  Settings; after that it can be allowed only in Health Connect. **Thirty days per read**, newest first.
- (2026-10-21) **The year is counted from each run's now.** The import's first read is not capped: with the history granted
  before it, it reads everything the platform has.

## Description
On first connection the app imports past weigh-ins (and body fat, lean mass and menstruation) as far back as allowed.

## Acceptance Criteria
```gherkin
Scenario: Six months of scale data
  Given a user with six months of weigh-ins in their health store and history permission granted
  When they connect during onboarding
  Then the trend chart shows those six months

Scenario: History refused
  Given the history permission is refused
  Then the last thirty days are imported

Scenario: Onboarding weight
  Given an imported weigh-in for today
  Then onboarding offers it as the current weight instead of asking the user to type one
```

## Progress
Built (2026-10-21), not run locally; CI validates:
- **`HealthBackfill`** reads a kind's history backwards from now, thirty days per read, down to a
  year back, for weight, body fat, lean mass and menstruation. Each month's readings go into the same
  store the import keeps, by platform id, so a reading kept twice is kept once and the day's weigh-in
  is still chosen by MM-71's rule (the primary scale first, a typed value over all).
- **Resumable.** After each month it marks how far back it has read (`HealthBackfillMarks`, kept beside
  the import tokens in their existing table under `backfill:<kind>`: no schema change). A backfill cut
  short goes on from the mark; one that reached a year back is never done again and asks the platform
  nothing. A read the platform refuses keeps every month read before it.
- **Runs after each import** (`syncHealth`), one kind at a time and one run at a time; the screens reload
  after each kind that brought new readings, so the trend fills in as they arrive. A backfill that
  fails does not make the import count as failed.
- **The history permission** (`HealthHistoryAccess`, apart from `HealthSource`): `READ_HEALTH_DATA_HISTORY`
  in the manifest; the plugin asks for it the first time weight, body fat, lean mass or menstruation is
  allowed in Settings, and never again (it keeps that it asked in its own preferences). Refused, the
  thirty days are read and nothing more is said. Apple Health has no window: there it is always granted
  and nothing is asked.
- Contract suites for both new interfaces run against every implementation (the fake, the in-memory and
  SQLite stores, the adapter over a stood-in plugin, no platform).

Built (2026-10-21), not run locally; CI validates:
- **Connecting during onboarding** (with MM-68): at the weight question, "Read weight from Health Connect" asks for
  weight and then the history, and reads; the backfill fills the trend. Today's imported weigh-in is offered as
  "Use 181.7 lb", which fills the weight; used as it is, nothing is typed over the import, so today's weigh-in is the
  scale's (MM-71). Typing over it makes it the person's own. Scenarios in `test/app/onboardingHealth.test.tsx` (six
  months read, history refused leaves thirty days, the onboarding weight).

Not built, by choice: saying on screen how far the history has been read (no scenario asks for it; the backfill
reports it per month).

## Owed on a phone
Pixel, Health Connect with months of weigh-ins:
- Connecting from onboarding's weight question asks for weight, then the history, and offers this morning's weigh-in.
- The history question is shown once, with the first kind allowed; granting it reads back a year,
  refusing it leaves thirty days; asking again shows nothing.
- On a Health Connect without the history feature, the request does not fail.
- A backfill interrupted by sending the app to the back goes on when it comes forward.
- iOS: `historyPermitted` and `requestHistory` answer granted without a sheet.

## Review fixes 2026-10-21 (`fix/health-plugins-review`)
- `requestHistory` (Android) first checks `features.getFeatureStatus(FEATURE_READ_HEALTH_DATA_HISTORY)`; where Health
  Connect does not offer it, it answers not granted and `unavailable` and does not mark it asked, so a later Health
  Connect still asks once.
- Erase all forgets that the history was asked: `renewWriteNamespace`, which runs after an erase (and a restore), also
  removes `history_asked`. Height is now read back too (MM-68).
- Tests: `test/native/mmHealthWrites.test.ts` reads the Kotlin. Owed on a phone: on a Health Connect without the
  feature, allowing weight does not mark it asked; after Erase all, allowing weight asks for the history once more.
