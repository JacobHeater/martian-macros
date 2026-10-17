---
id: MM-368
status: proposed
component: coach-insights
related: [MM-361, MM-362, MM-249, MM-250, MM-252]
---

# Story: Inline insights on a night of sleep

## Context
See MM-361 and MM-362. The owner named sleep. There is no sleep record yet: MM-250 (a night of sleep, recorded) is proposed.
This story waits for it.

## Decisions
The product owner's (2026-10-17): sleep is one of the areas.

Choices I made without asking (say if any is wrong). **A draft** for the panel's coaching and safety roles to check:

| rule | basis | anchored under | fires when | the line (example) |
|---|---|---|---|---|
| short night | item | the night | under 6 h asleep | "Under 6 hours. Hunger and training often feel harder after a short night." |
| short most nights | pattern | the latest night | under 7 h on more than half of the last 14 recorded nights, with ≥ 7 recorded | "Under 7 hours on 9 of the last 14 nights. Sleep is part of recovery and appetite." |

- **No medical claims.** Nothing suggests a disorder. Sleep disorders belong to the health check (MM-251).
- **Shown with an eating-disorder history.**

## Description
The two rules, their words, evidence and register entries, and their placement under MM-250's "Last night" card.

## Acceptance Criteria
```gherkin
Scenario: A short night
  Given last night recorded as 5 h 20 m
  Then the "short night" insight is shown under it

Scenario: A pattern
  Given 14 recorded nights, 9 of them under 7 h
  Then the "short most nights" insight is shown under the latest night with 9 of 14

Scenario: Too few nights
  Given 5 recorded nights, all under 7 h
  Then no "short most nights" insight is shown
```

## Notes
- Blocked by MM-250.
