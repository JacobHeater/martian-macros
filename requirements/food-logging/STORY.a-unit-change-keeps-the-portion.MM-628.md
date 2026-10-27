---
id: MM-628
status: done
component: food-logging
related: [MM-42, MM-46, MM-151, MM-167, MM-202, MM-216, MM-221]
---

# Story: changing the unit keeps the portion

## Context
The food-logging review (`docs/food-logging-plan.md`, F-11, increment B1) found three behaviors for one
action:
- The amount step reset the amount to 100 g, 4 oz or 1 on every unit change, so 180 g became 4 oz, a
  different portion.
- Editing a calculated entry cleared the amount and warned before anything was typed.
- The typed form kept the number, so "2 cups" became "2 tbsp" while the totals typed for 2 cups stayed,
  and the recorded portion disagreed with the totals.

A novice who logs 180 g and wants ounces has to work out 6.35 by hand. This is an owner priority
(alternate units, 2026-10-26).

## Decisions
Choices made without asking (say if any is wrong):
- **A unit with an exact measure converts the same portion.** That covers grams and ounces (weight), cup,
  tablespoon, teaspoon, mL and fl oz through a food's own basis (MM-167), and a serving with a gram
  weight. 180 g becomes 6.35 oz, and the totals do not change.
- **The exact amount is kept** while the converted figure is untouched. 6.35 oz is shown, the 180 g it
  came from is what is logged, and converting back gives 180 again.
- **A hand portion never converts, either way.** It is an estimate (MM-46, MM-217), and turning it into
  grams, or grams into palms, would make one read as the other. The amount is cleared and the field says
  to enter it again in the new unit, as a method change does (MM-216).
- **Without a common measure** (a serving with no weight, or a volume without a basis) the amount is
  cleared and the same is said.
- **With no amount of the person's yet** (only the unit's usual figure, never typed), the new unit starts
  at its own usual figure (100 g, 4 oz, 1), as before.
- **Typed totals** (the manual form): weight converts to weight and volume to volume. Any other unit
  change clears the amount, so the portion said never disagrees with the totals typed.
- The field's helper says what happened: "Same amount as 180 g." after a conversion, "Enter how much
  again in this unit." after a clear.

## Description
In the amount step, in the editor of a calculated entry, and in the manual form, choosing another unit
converts the amount when both units have an exact measure for this food. Otherwise it clears the amount
and asks again. The portion and its totals never change silently.

## Acceptance Criteria
```gherkin
Scenario: Grams to ounces in the amount step
  Given 180 g of white rice, cooked, in the amount step
  When "Ounces" is chosen
  Then the amount reads 6.35, the totals are those of 180 g, and the field says "Same amount as 180 g."

Scenario: Back again
  Given 180 g converted to ounces and left as shown
  When "Grams" is chosen
  Then the amount reads 180

Scenario: A serving to grams
  Given 1.5 of a "1 cup (158 g)" serving
  When "Grams" is chosen
  Then the amount reads 237

Scenario: Never into a hand portion
  Given 180 g of chicken breast and a hand size
  When "Palms" is chosen
  Then the amount is empty and the field says "Enter how much again in this unit."

Scenario: Editing converts too
  Given an entry of 180 g calculated from its food
  When it is edited and "Ounces" is chosen
  Then the amount reads 6.35, and saving it unchanged logs the same totals

Scenario: Typed totals convert within weight or volume
  Given a typed food measured as 2 cups, with its totals typed
  When "Tablespoons" is chosen
  Then the amount reads 32 and the totals are as typed

Scenario: The usual figure is not a portion
  Given the amount step opened on a serving, its amount untouched
  When "Grams" is chosen
  Then the amount reads 100
```

## Notes
- Built in `domain/food/portion/convertedQuantity.ts` (one rule for every path), `FoodAmountStep` and
  `AddFoodSheet`.
- Tests: `test/domain/convertedQuantity.test.ts`, `test/food/unitChangeKeepsPortion.test.tsx`.
