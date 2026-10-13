---
id: MM-254
component: dashboard
status: proposed
related: [MM-253, MM-224, MM-176, MM-179, MM-187, MM-98]
---

# Story: the Dashboard in tiers

## What is built

- **The hero** stays: the arc, calories left, the macro picture, the coach's
  one line and the confidence word.
- **The macro switch**: bars (grams against target) or donut (share of
  calories) inside the hero, a segmented switch, remembered as a
  preference; the "Macronutrient split" card is removed. Food uses the same
  switch and preference (MM-255).
- **A rhythm strip** under the hero: the seven days of the week as dots,
  complete, partial or empty, today marked; pressing a day opens it in
  Food.
- **Secondary facts as rows** with leading icons, not cards: weight (trend
  and the week), waist, the next check-in, training this week. Each row
  opens its destination.
- **One primary action**: Add food in the bar. The hero is pressable to the
  day (MM-246's `MmPressable`).
- **Tertiary** (coverage, recovery, the metabolism estimate) moves one tap
  down behind "More about this week".

## Acceptance criteria

```gherkin
Scenario: First viewport
  Given a day with food logged
  Then the arc, calories left, the macro picture, the rhythm strip and the first two rows fit a 412 by 915 viewport

Scenario: The switch
  When the donut is chosen
  Then the bars are not shown, the choice persists across launches, and Food shows the donut too

Scenario: Rows, not cards
  Then weight, waist, check-in and training are rows with a leading icon and no card of their own

Scenario: Nothing lost
  Then every figure the old Dashboard showed is reachable within one tap
```

## UI/UX

`apps/mobile/src/gallery/screens/Today.stories.tsx` (Dashboard, FirstDay),
before and after.
