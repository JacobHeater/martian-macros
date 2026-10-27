---
id: MM-646
status: done
component: food-logging
related: [MM-167, MM-216, MM-586, MM-587, MM-641, MM-647]
---

# Story: a food typed by hand into a meal says how it was measured

## Context
The food-logging review (`docs/food-logging-plan.md`, F-19) found that a food typed by hand into View meal,
or added by hand to an analysis under review, was logged as a photo estimate (`entryOfMealItem`), the method
only an AI meal analysis should make (MM-586), while its evidence said the numbers were the person's. Its
uncertainty was then the photo's (MM-167), not the person's, and the Food screen called it a photo estimate.
The owner was asked (2026-10-26) whether to keep that or show another label; "finish the plan" closes it.

## Decisions
Choices made without asking (say if any is wrong):
- **The person says**, as the typed form asks it (MM-216): "How was it measured?" with the same chips, under
  the grams. The method is kept with the food and is what its uncertainty and its label follow.
- **A food added by hand must say.** "Add food" without a method refuses with "Say how it was measured.",
  as the other things wrong with it are said. Nothing is defaulted: a default would put a method in the
  person's mouth.
- **The assistant's own food keeps its photo estimate** until the person chooses another. "Photo estimate"
  is offered only on such a food, never for one typed by hand.
- **A logged food reads back saying its method**, so changing it in View meal shows the chip it has.

## Description
In View meal and in an analysis under review, a food's form asks how its grams were measured. A food typed
by hand is logged by the method chosen; the assistant's foods stay photo estimates unless changed.

## Acceptance Criteria
```gherkin
Scenario: Typed by hand, measured as said
  Given "Chicken and rice" is logged, and butter is being added to it by hand with every number
  When "Add food" is pressed before a method is chosen
  Then it refuses with "Say how it was measured." and nothing is added
  When "Weighed" is chosen and "Add food" pressed
  Then butter is a food of the meal, measured as weighed, with the person's numbers

Scenario: The assistant's food stays a photo estimate
  Given the meal's rice, a photo estimate, opened to change
  Then "Photo estimate" is its chosen method
  When only its grams are changed and it is saved
  Then it is still a photo estimate
```

## UI/UX
- View meal — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Stories: ViewMealAddFood, the chips for
  a food typed by hand; ViewMealLookUp; AnalyzeMealChangeFood, "Photo estimate" among them).

## Notes
- Built in `MealItemDraft` (`method`), `entryOfMealItem`, `mealItemOfEntry` and `MealItemForm`.
- Tests: `test/food/handTypedMealFood.test.tsx`; "MM-646" in `test/domain/mealAnalysis.test.ts`.
