---
id: MM-250
component: sleep
status: proposed
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
