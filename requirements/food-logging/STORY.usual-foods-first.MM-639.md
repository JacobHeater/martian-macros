---
id: MM-639
status: done
component: food-logging
related: [MM-39, MM-439, MM-587, MM-629, MM-631]
---

# Story: what is usual at a meal comes first among the recent foods

## Context
The owner, 2026-10-26: the recent foods are well behind MyFitnessPal's and MyNetDiary's. MM-629 put what
was last logged at the meal first. The food-logging review (`docs/food-logging-plan.md`, C5) asked for how
often too: a breakfast eaten most mornings should not fall below something eaten once yesterday.

## Decisions
Choices made without asking (say if any is wrong):
- **Usual at a meal** means logged at that meal at least twice in the four weeks before the day being added
  to. Usual foods and meals come first, the most often first. Then MM-629's order: the rest of what was last
  logged at this meal, then everything else, newest first.
- **A logged meal counts once each time it was logged**, by its name (MM-587), not once per food.
- **Only the order changes.** The list is still the twenty most recent distinct foods and the recent meals
  (MM-39, MM-587), five shown first (MM-439).

## Acceptance Criteria
```gherkin
Scenario: Usual first
  Given porridge was logged at lunch three times in the last two weeks, and soup once, yesterday
  When food is added to lunch
  Then porridge lists above soup
```

## Notes
- Built in `domain/food/meal/timesLoggedAt.ts` and `AddFoodSheet` (from `state.foodBefore`, the four weeks
  the hero already reads).
- Tests: "MM-639" in `test/food/recentFoodsAreRows.test.tsx`.
