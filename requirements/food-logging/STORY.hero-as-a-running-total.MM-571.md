---
id: MM-571
status: done
component: food-logging
related: [MM-570, MM-572, MM-187, MM-123, MM-148, MM-113, MM-108, MM-389]
---

# Story: The calorie hero as the day's running total

## Context
The owner (2026-10-22), on the calorie hero: "it says 413 over, but it's just not feeling much like a data
story." The arc filled to the target and stopped, so how far over the day went was never drawn; the big
figure was a difference, and what was eaten was nowhere; nothing tied the picture to the meals. Five stories
were drawn as mockups (the "Calorie hero: data story" canvas); the owner chose **B, the running total over
the clock**: "Absolutely love B."

## Decisions
The owner's: B; on every screen that has the hero (Dashboard, Food, Coach: the one calorie picture, MM-187);
a food without a time stands at its meal's usual time, drawn as an open dot.

- **The figure is what was eaten** ("2,588", "kcal eaten"), with what is left or over beside it ("+413",
  "over 2,175"; "787", "left of 2,175"), and "· on target" in the band (MM-123). A pause says "kcal logged ·
  paused, guide …" and the line is the guide (MM-148); on a weight-loss medication the aim's words stay
  (MM-113).
- **The chart** (`IntakeTimeline`): the clock from 6 AM (earlier if food was) to midnight; a step for each
  time food was eaten, foods of one meal at one minute joined; the target as a dashed line with its figure;
  the band as a quiet zone; what went past the target hatched; a dot where it was crossed; "now" on today;
  each meal's start labelled under the axis ("D 7:15", "B ~8:00" for a guessed time) and each meal's total by
  its step. One hue, nothing judged (MM-108). Spoken as one sentence, the running total, not the figure again
  (MM-389).
- **One sentence under it** when it says something: "You passed your target at dinner, 7:15 PM." and, with the
  usual day (MM-572), how today stands against it.
- The arc stays the brand's graphic on Welcome; it leaves the hero.

## Acceptance Criteria
```gherkin
Scenario: Over, passed at dinner
  Given breakfast 675 at 7:40 AM, lunch 713 at 12:30 PM, dinner 1,200 at 7:15 PM, target 2,175
  Then the hero says 2,588 kcal eaten, +413 over 2,175
  And the chart passes the target line at dinner, and says "You passed your target at dinner, 7:15 PM."

Scenario: Untimed
  Given oats at breakfast with no time
  Then they stand at 8:00 AM as an open dot, labelled "B ~8:00"
```

## UI/UX
- HeroRunningTotal — apps/mobile/src/gallery/screens/Food.stories.tsx.

## Progress
Built: `IntakeTimeline`, `intakeStepsOf`, `IntakeStep`, `TimedFood`, `minuteOfDayText`, `CalorieHero`. Tested
in `test/domain/intakeSteps.test.ts`, `test/charts/intakeTimeline.test.tsx`,
`test/food/heroRunningTotal.test.tsx`, and the hero's existing tests reworded ("left of 2,400", "over 2,400").
Not run locally; CI validates. Not looked at in Storybook or on a phone.
