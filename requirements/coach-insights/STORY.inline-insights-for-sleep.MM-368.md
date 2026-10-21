---
id: MM-368
status: proposed
component: coach-insights
related: [MM-361, MM-362, MM-249, MM-250, MM-252]
---

# Story: Inline insights on a night of sleep

## Context
See MM-361 and MM-362. The owner named sleep. Nights of sleep are recorded since MM-250 (done), on Progress's Sleep
card; MM-252 already reads a fortnight's average (a rationed insight, the Coach line and the relief offer).

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
- No longer blocked by MM-250. Reviewed 2026-10-21 by the panel's coaching and safety roles (read-only, source only, no
  research), against the draft above. Not built: two findings block the build, and the catalog changes before it is.
  - **Blocking, evidence (SA-3, CO-6):** the 6 h single-night cut-off reuses a threshold registered for a 14-night average
    (MM-252), and the 7 h cut-off and the hunger and training sentences have no row in the evidence register (MM-143). A
    bounded research pass (adult sleep-duration guidance; a review of sleep restriction on appetite and exercise) and the
    rows come first.
  - **Blocking, cautions (SA-1):** both kinds would be withheld with `sleepDisorder` and while `breastfeeding`, with a
    scenario each and no Settings switch offered; `pregnancy` is open.
  - **"Short most nights" duplicates MM-252 (CO-1):** a second fortnight figure at another cut-off beside MM-252's average.
    Proposed: drop it, and anchor MM-252's existing short-sleep insight under the latest night instead.
  - **"Short night" only under the latest night (CO-2):** one that ended within the last 36 hours, quiet while MM-252's
    short sleep holds, at most one sleep line on the card.
  - **Wording (CO-3, SA-2):** "may", not "often", hunger as expected rather than resisted, nothing to eat or skip; for
    example "Under 6 hours. You may feel hungrier, and training may feel harder, after a short night. Both are normal."
    Shown with an eating-disorder history and while under-eating, as drafted.
  - **To settle in the ticket (CO-5, SA-4, SA-6):** hours asleep as MM-250 records them, the threshold read from
    `SleepRule`, exactly 6 h 0 m gives no line, a read failure gives none, and both rules assume an adult. Whether a long
    run under 5 h hands over to MM-251's clinician pointer is a product question for the owner.
- Placement: under the Sleep card's last night on Progress (`SleepNightCard`), with `InlineInsight` as the waist and water
  rows use it on the Dashboard.
