---
id: MM-326
status: done
component: food-logging
related: [MM-318, MM-313, MM-305, MM-253]
---

# Story: Glasses to fill on the water section

## Context
The Food screen's Water section (MM-318) says the day's water in words: "24 fl oz of 128 fl oz". A goal of
a gallon is hard to picture, and words alone give nothing to chase. The owner (2026-10-14): add a visual to
gamify the water and make the goal easier to reach.

## Decisions
The product owner's (2026-10-14, asked with options):
- **Glasses to fill**: a row of marks, one per glass of the goal, filling as water is logged, over a thin
  bar or a week's streak.
- **Always shown**: it sits under the header, so a folded section still shows how far the day is.
- **A quiet mark at the goal**: the strip shows full and the summary gets the check mark a meal shows for a
  solid serving of protein (MM-125). No celebration and no extra message; a mark's fill keeps the rhythm
  strip's short transition, which reduced motion turns off (the panel's PD-3).

Choices I made without asking:
- **The sibling it matches** (rule 9): the marks are `MmRhythmStrip`'s (MM-253, rule 3): a dot full, half
  or empty, in the same size and the same Ion fill; the summary's check mark is `MealSection`'s
  `food-meal-marker`. The header is still `MmSection`, as every meal. **Differences, with their reasons**:
  no letters, no per-mark name and no "today" ring, since a mark is a glass, not a day; and packed from the
  start instead of spread across the width, so the marks read as a count of glasses and not as days (PD-4).
- **The glasses said in words** (the panel's PD-2 and UX-1): the summary names them beside the amount
  ("24 fl oz of 128 fl oz · 3 of 16 glasses", "Goal 2 L · 8 glasses", halves as "1½"), so the tally is
  decoration, `aria-hidden`, as `MmProgressBar` is: the words beside it carry the count.
- **A glass is the Add water sheet's glass** (`WaterServing`): 8 fl oz in imperial, 250 ml in metric, so
  "+" then Glass fills exactly one mark. The count is the goal over a glass, rounded up (128 fl oz is 16
  glasses; 2 L is 8; the most, 6 L, is 24 or 26), on rows of at most 12 (a row fits a 360 px phone) of
  equal length: 16 is 8 and 8, 26 is 9, 9 and 8.
- **Halves**: what is drunk is rounded to the nearest half glass; a half is the half-filled dot. The last
  mark fills only when the goal is reached, and past the goal every mark is full.
- **No goal, no strip**: with nothing to fill, the section is as MM-318 drew it.
- **The strip is a design-system part** (`MmTally` in `apps/mobile/src/ui/`), placed by `MmSection`'s new
  `meter`, which sits under the header and stays when the section folds.

## Description
`WaterSection` passes a `meter` to its `MmSection`: an `MmTally` of the day's glasses against the goal's.
`waterGlasses` works out both from the total, the goal and the unit system.

## Acceptance Criteria
```gherkin
Scenario: Glasses to fill
  Given an imperial goal of 128 fl oz and 24 fl oz logged today
  Then the Water summary reads "24 fl oz of 128 fl oz · 3 of 16 glasses"
  And 16 marks show under the header on two rows of 8, 3 of them full

Scenario: A goal and nothing yet
  Given a metric goal of 2 L and nothing logged
  Then the Water summary reads "Goal 2 L · 8 glasses" over 8 empty marks

Scenario: A glass from the sheet fills one mark
  Given a metric goal of 2 L and nothing logged
  When "+" on Water is pressed and Glass is chosen
  Then the summary ends "1 of 8 glasses" and 1 mark is full

Scenario: Half a glass
  Given a metric goal of 2 L and 375 ml logged
  Then the summary ends "1½ of 8 glasses", 1 mark is full and the next is half full

Scenario: The last mark waits for the goal
  Given a metric goal of 2 L and 1,950 ml logged
  Then 7 marks are full and the last is half full

Scenario: The goal reached
  Given a metric goal of 1.5 L and 2.25 L logged
  Then every mark is full and the summary reads "2.25 L · Goal reached" with the check mark

Scenario: Folded
  When the Water header is pressed to fold it
  Then the drinks are hidden and the glasses still show

Scenario: No goal
  Given no water goal
  Then the Water section shows no glasses and says none
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: Water Glasses, Water Glasses Folded,
  Water Glasses Half, Water Goal Set None, Water Goal Partway, Water Goal Reached, Water Most Glasses,
  Water Section), each
  looked at on the whole screen beside the meal sections, in three palettes; reviewed in
  `docs/agent-runs/mm326-water-glasses/`.
- Components — `MmTally` in the components gallery.

## Progress
Built: `MmTally` (the components gallery shows it beside `MmRhythmStrip`), `MmSection`'s `meter`,
`waterGlasses`, `glassesLabel`, and `WaterSection` passing both. Drawn in seven stories, looked at in the
three palettes at 412 by 915, then reviewed by the panel's product-designer and UX guard (UX guard: pass);
PD-2, PD-3, PD-4 and UX-3 built after the review and looked at again. Kept for the owner: PD-1 (the marks'
Ion fill is protein's colour in Martian; moving both strips to a neutral) and PD-5 (a smaller mark at big
goals). Tested in `test/food/waterAndMicros.test.tsx` and `test/domain/waterGlasses.test.ts`. Not
verified: the phone, TalkBack, 200% text.
