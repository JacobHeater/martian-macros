---
id: MM-370
status: proposed
component: food-logging
related: [MM-361, MM-369, MM-371, MM-365, MM-108, MM-144, MM-11, MM-310, MM-126]
---

# Story: Foods graded A+ to D-, on entries, in search, and for each meal and day

## Context
See MM-361. The grading method comes from MM-369. MM-371 records that this overrules a non-goal and part of the voice rules.

## Decisions
The product owner's (2026-10-17):
- **A+ to D-, universal**, the food's grade per 100 g.
- **Shown on every logged food, in food search and add, and rolled up for each meal and day.**
- **An entry shows its food's grade.** Portion is for the entry's insight to talk about (MM-365), not the grade.
- **A food that can't be graded shows a question mark.** Tapping it opens a popover explaining why, naming what is missing.
- **Shown with an eating-disorder history.** The owner confirmed this after being shown it conflicts with the food-insight
  safeguard. The food-composition insights stay off for that person (MM-362).
- **No switch to hide grades.** Settings > Coach switches insights, not grades (the owner listed master, area and rule switches
  only).

Choices I made without asking (say if any is wrong):
- **A meal's and a day's grade** is the calorie-weighted average of the graded entries' scores, turned back into a letter. It
  shows a question mark when graded entries carry less than 70% of the calories, the same threshold as the fiber rule (MM-126).
  The popover then says what share could be graded.
- **No red, and no traffic-light colours.** MM-108 forbids red for intake. The grade is a letter in a neutral outlined badge
  (`MmGradeBadge`, a design-system component) that grows with the text. A dashed question mark means no grade.
- **Every badge explains itself** (the panel's PD-3): a letter and a question mark are both buttons in a 48 dp slot, outside the
  pressed part of their row, and both open a popover. A letter's says what the grade means ("A grade for the food itself, per
  100 g … The amount you eat does not change it", or for a meal or a day, "each counted by its calories"). A question mark's
  says why there is none.
- **Where it sits**: on an entry, between its calories and its "More actions". On a meal, first in the header's actions. In
  search, beside each result (the pack's results, the person's own foods and recent foods). On the amount step, under the
  source, with words: "Grade for the food itself, per 100 g".
- **The day's grade is a row after the completeness row**, "Grade for the day · Counted by calories", built as that row is. It
  was first drawn in the app bar beside the completeness mark, and on a 320 px phone it overlapped the settings button.
- **Names a screen reader hears**: "Lunch: grade C", "Peanut butter: grade C", "Homemade soup: can't be graded. Why?". The
  popover is labelled "Grade C minus", not "Grade C-".
- **Custom foods and recipes are graded** when their nutrients allow it. An estimated entry (MM-150) shows a question mark
  ("Estimated, so not graded").
- **The grade is computed, not stored**, so improving the method regrades everything.

## Description
The grading function in the engine (from MM-369), the grade badge and its popover, and their placement on entry rows, search
results, the add sheet, meal headers and the day's row.

## Acceptance Criteria
```gherkin
Scenario: A logged food
  Given a logged food the method grades B+
  Then its row shows a "B+" badge

Scenario: In search
  When foods are searched
  Then each result shows its grade or a question mark

Scenario: Can't be graded
  Given a food with no fiber value, which the method needs
  When its question mark is tapped
  Then a popover says the food can't be graded and names fiber as missing

Scenario: A missing value is not zero
  Given a food with no sodium value
  Then its grade is not worked out as if sodium were zero

Scenario: A meal's grade
  Given a meal of 400 kcal of a food scoring s1 and 100 kcal of a food scoring s2 on MM-369's scale
  Then the meal shows the letter for the score (4 × s1 + s2) / 5

Scenario: A day's grade
  Given a day's graded entries carrying at least 70% of its calories
  Then the day's grade row shows the letter for the calorie-weighted average of their scores

Scenario: A letter explains itself
  When a graded food's badge is pressed
  Then a popover says the grade is for the food itself, per 100 g, and that the amount eaten does not change it

Scenario: In the add sheet
  When a food is chosen to log
  Then the add sheet shows its grade, or its question mark

Scenario: Too little of the meal can be graded
  Given graded entries carry 60% of a meal's calories
  Then the meal shows a question mark whose popover says 60% could be graded

Scenario: Portion does not change the grade
  Given the same food logged as 50 g and as 300 g
  Then both entries show the same grade

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then grades are shown as for anyone else

Scenario: Read aloud
  Then a badge's accessible name says what is graded and the letter spelled out, e.g. "Lunch: grade B plus"
```

## UI/UX
In `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`, with the design's own letters until MM-369 picks the
method, reviewed by the panel (`docs/agent-runs/mm361-coaching-insights/`):
- FoodWithInsights. Grades on entries and meals, and the day's row.
- FoodGradeMeaning, FoodDayGradeMeaning. A letter pressed.
- FoodGradeWhy, FoodMealGradeWhy, FoodMealGradeWhyLargeText. A question mark pressed, at 100% and 200%.
- FoodLargeText, FoodNarrow. 200% text and a 320 px phone.
- SearchWithGrades, AmountStepWithGrade. Search and the amount step.
- FoodWithInsightsEatingDisorder. Grades shown with an eating-disorder history.
- Design system: `Overlays › Popover`, and the badges in `Components`.

## Notes
- Blocked by MM-369.
- At 200% text and on a 320 px phone, the entry's calories, grade and "More actions" leave the name a narrow column ("Peanut /
  butter"), readable and not cut (the panel's UX-11, PD-12). Moving the calories and grade under the name at large text is a
  proposal for when the grades are built, with MM-91's large-text pass.
- The day's grade row sits on the canvas with its sibling, the completeness row, which already does (the panel's PD-13). If
  MM-291 is to hold for that pair, both go in one list group together.
