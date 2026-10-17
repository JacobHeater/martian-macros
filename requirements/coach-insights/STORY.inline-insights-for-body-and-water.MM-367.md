---
id: MM-367
status: proposed
component: coach-insights
related: [MM-361, MM-362, MM-142, MM-118, MM-11, MM-301]
---

# Story: The first inline insights on weigh-ins, measurements and water

## Context
See MM-361 and MM-362. A weigh-in that jumps already gets its own explanation (MM-142). That stays as it is: it is not an inline
insight and is not duplicated by one.

## Decisions
The product owner's (2026-10-17): every trackable surface.

Choices I made without asking (say if any is wrong). **The catalog and its figures are a draft** for the panel's measurement
and coaching roles to check:

| rule | basis | anchored under | fires when | the line (example) | safeguard |
|---|---|---|---|---|---|
| unusual time | item | the weigh-in | logged ≥ 3 h from the person's usual weigh-in time (the median time of the weigh-ins in the last 14 days, with at least 7 of them) | "Weighed later than usual. Weighing at the same time each day makes the trend steadier." | weight: off for ED history and hidden weight |
| within the noise | item | the waist reading | within the tape's noise of the last reading (MM-301's shared "has it changed" function) | "Within the usual day-to-day difference of a tape, so not a change yet." | body: off for ED history |
| water on few days | pattern | the water section | a water goal is on and water was logged on fewer than half of the last 14 days | "Water logged on 5 of the last 14 days. A glass with each meal is an easy habit to log." | logging: shown |

## Description
The three rules, their words, evidence and register entries, and their placement on the weigh-in, waist and water rows.

## Acceptance Criteria
```gherkin
Scenario: Unusual time
  Given weigh-ins usually around 07:00 and today's at 11:30
  Then the "unusual time" insight is shown under today's weigh-in

Scenario: Hidden weight
  Given weight is hidden
  Then no weigh-in insight is shown

Scenario: The weight jump keeps its own explanation
  Given a weigh-in that MM-142 explains, logged 4 h later than usual
  Then MM-142's explanation is shown and the "unusual time" insight is not

Scenario: Too few weigh-ins for a usual time
  Given 5 weigh-ins in the last 14 days
  Then no "unusual time" insight is shown

Scenario: Within the noise
  Given a waist reading within the tape's noise of the last one
  Then the "within the noise" insight is shown under it

Scenario: Water
  Given a water goal and water logged on 5 of the last 14 days
  Then the "water on few days" insight is shown under the water section
```

## UI/UX
- To be drawn: the dashboard's weigh-in, waist and water rows with an insight under each.
