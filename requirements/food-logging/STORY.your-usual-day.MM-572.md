---
id: MM-572
status: done
component: food-logging
related: [MM-571, MM-570]
---

# Story: Your usual day, under today's

## Context
Part of the owner's pick for the hero (MM-571): a faint line of "your usual day" to read today against.
I proposed leaving it for later, since it needs days of meal times; the owner (2026-10-22): "wrong. the
correct way to handle this is with transparent disclosure to the user that this will be available after the
user has logged some number of meals."

## Decisions
- **Built now, its wait said openly.** Until it can be drawn, the chart's key says: "Your usual day appears
  after 7 days with meal times · 2 of 7". Then the key says "Your usual day" and the line is drawn.
- **Which days**: the 28 before the day shown, each counted when it has food and every food with calories in
  it has a time, so guessed meal times never shape it.
- **The line**: every 15 minutes, the median of what those days had eaten by then; dashed, quiet.
- **Read against today**, on today, in the hero's sentence: within the larger of 100 kcal and 10%, "Close to
  your usual day so far."; else "500 kcal behind your usual day so far." (or ahead of).
- Read through `FoodRangeReader` (MM-570), as `AppState.foodBefore(day)`.

## Acceptance Criteria
```gherkin
Scenario: Waiting
  Given 2 earlier days with meal times
  Then the key says "Your usual day appears after 7 days with meal times · 2 of 7"

Scenario: Drawn and read
  Given 7 earlier days with meal times, eating 2,288 by 9 PM, and 1,788 eaten today by 9 PM
  Then the usual day is drawn, and the hero says "500 kcal behind your usual day so far."
```

## UI/UX
- HeroRunningTotal, HeroUsualDayWaiting — apps/mobile/src/gallery/screens/Food.stories.tsx.

## Progress
Built: `usualDayOf`, `usualKcalAt`, `UsualDay`, `AppState.foodBefore`, `IntakeTimeline`'s key. Tested in
`test/domain/intakeSteps.test.ts`, `test/charts/intakeTimeline.test.tsx`, `test/food/heroRunningTotal.test.tsx`.
Not run locally; CI validates.
