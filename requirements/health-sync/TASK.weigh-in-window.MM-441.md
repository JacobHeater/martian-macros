---
id: MM-441
status: proposed
component: health-sync
related: [MM-71, MM-66, MM-68, MM-69]
---

# Task: A weigh-in window for a morning that is not 04:00 to 12:00

## Context
MM-71 counts the first imported reading between 04:00 and 12:00 local time as the day's weigh-in, otherwise the middle of the
day's readings. That assumes a usual sleep schedule: a night-shift worker who weighs after waking at 15:00 gets the middle of
the day instead of their first reading. MM-71 left the window as a small later addition; this is it.

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
- A window that crosses midnight raises which day a reading counts for; decide that before building.
