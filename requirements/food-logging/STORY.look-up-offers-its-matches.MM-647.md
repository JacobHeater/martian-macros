---
id: MM-647
status: done
component: food-logging
related: [MM-586, MM-587, MM-627, MM-646]
---

# Story: Look up offers the foods it finds, never the first one unasked

## Context
The food-logging review (`docs/food-logging-plan.md`, F-19) found that "Look up in the app's foods", on a
food of a meal, took the first search hit without asking (`MealItemForm`): "chicken breast" became whichever
chicken breast ranked first, raw or cooked, and the person learned which only from the line under the food.

## Decisions
Choices made without asking (say if any is wrong):
- **Up to five matches are offered** as rows under the button, each with its brand, calories per 100 g and
  where its numbers come from. Pressing one gives the food its numbers at these grams, as before, and the
  line under the food names it. The rows go once one is chosen.
- **The status says what happened**: "N foods matched. Press the one it is.", "One food matched. Press it
  to use its numbers.", "Using X.", or that nothing matched.
- **A matched food keeps its match.** A food added by hand and then matched is logged as matched, not as
  the person's own; typing a number after the match makes it the person's own, as before.
- The search is the exact one (every word), as it was: the closest-match fallback (MM-627) is for the search
  field, where it is said.

## Description
On a food of a meal, Look up lists the foods in the app's packs that its name finds, and the person chooses
the one it is.

## Acceptance Criteria
```gherkin
Scenario: Choose among the matches
  Given a food named "chicken breast" with 100 g eaten is being added to a logged meal
  When "Look up in the app's foods" is pressed
  Then the pack's chicken breasts are offered, and no numbers are filled yet
  When "Chicken breast, cooked" is pressed
  Then the calories are 165, the status says "Using Chicken breast, cooked.", and the offer is gone

Scenario: Nothing matched
  When a name nothing matches is looked up
  Then it says so and offers nothing
```

## UI/UX
- View meal — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Story: ViewMealLookUp).

## Notes
- Built in `MealItemForm`. Tests: "MM-647" in `test/food/handTypedMealFood.test.tsx`.
