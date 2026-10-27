---
id: MM-654
status: done
component: food-logging
related: [MM-310, MM-370, MM-380, MM-382, MM-650, MM-651]
---

# Bug: a drink logged by volume has no grade

## Context
The owner, 2026-10-27, from the phone: an orange soda logged as 4 fl oz showed the question mark, and its popover
said "The amount in grams isn't known, so the food can't be graded." "It's all sugar!" The grade of a logged entry
(MM-382) recovers the food per 100 g from the entry's totals and its grams. MM-650 made a drink a food per 100 mL,
and MM-651 logs it by the fluid ounce, the millilitre or its can; without a density such an entry has no grams,
so the grade gave up, while the same soda's search row, graded from the pack's per-100 mL values, had its letter.

## Decisions
From the owner (2026-10-27): fix it.

Choices made without asking (say if any is wrong):
- **A drink is graded per 100 mL**, as the pack already grades it: the entry's totals over the millilitres it was
  logged as. Calories per gram, the one part of the score that reads mass, reads millilitres for such a food,
  as it does on the search row; a drink is close to 1 g per mL, and 5% on the calories moves a grade at most one
  step (MM-382).
- **The reason now says "grams or millilitres"** for an entry whose amount cannot be known either way.

## Description
A logged entry of a food stated per 100 mL gets the grade the pack gives that food, whatever the amount and
whether or not a density is known; the question mark stays for an amount that is known neither in grams nor
in millilitres.

## Acceptance Criteria
```gherkin
Scenario: A soda by the fluid ounce
  Given an orange soda stated per 100 mL with no density
  When 4 fl oz of it is logged
  Then its grade is the grade of its values per 100 mL, the same as its search row's

Scenario: Still unknown
  Given a food typed with its totals and no amount
  When it is logged
  Then it is not graded, and the popover says the amount in grams or millilitres isn't known
```

## UI/UX
No new screen; the badge and popover stand (MM-370). A bug the owner reported, so no panel.

## Notes
- Built in `engine/gradeOfFoodEntry.ts`; test in `test/engine/foodGrade.test.ts`; `docs/food-grades.md` updated.
- **The audit the owner asked for** ("what other shit is hiding"): every way a food ends in the question mark, on
  the barcode pack of 2026-10-27 (521,079 foods: 459,297 per 100 g, 61,782 per 100 mL), for the owner's call:
  1. *A copied drink* ("Fix this food" on a per-100 mL food with no density) has no serving weight, and an own
     food is graded only by its serving's grams: `CustomFood` has no millilitres field. Same hole as this bug,
     one step further; needs a column. Not fixed here.
  2. *A food typed by hand* with no amount (totals, or servings without a weight) is not graded: "the amount
     isn't known". The score reads protein, fiber, sodium, sugars, saturated fat and the vitamins and minerals
     per 100 kcal, so only calories per gram and the sugars waiver's "watery" test need the mass. Such a food
     could be graded on the per-calorie parts with calories per gram said as not counted. A method change
     (MM-380): the owner's call.
  3. *A recipe* is never graded: its ingredients carry only the four macros (MM-382's NU-11). Since MM-623 an
     ingredient found in the pack keeps its origin, so fiber and sodium could be carried. The owner's call.
  4. *An estimate* ("quickAdd") is never graded (MM-150). Policy.
  5. *Under 10 kcal per 100 g or 100 mL*: 9,457 per-100 g foods (2%) and 9,873 drinks (16%: diet sodas, flavoured
     waters, black coffee) get "almost no calories, nothing to grade per calorie". Policy (MM-380); a diet soda's
     question mark may read as this bug did.
  6. *Alcohol over 1.2 g per 100*: 375 foods and 146 drinks. Policy.
  7. *Sodium not stated*: 13,303 per-100 g foods (3%) and 892 drinks (1%). Never guessed (MM-310).
  8. *Fiber not stated*: 58,815 per-100 g foods (13%) and 29,833 drinks (48%). With sugars stated the fiber is
     bounded by carbs less sugars and the food is graded when both ends give one letter (MM-567): 30,866 foods and
     18,337 drinks ride on that; 23,499 foods (5%) and 6,527 drinks (11%) state neither and get the question mark.
  9. *A meal or a day* with graded foods under 70% of its calories. Policy (MM-370).
  Graded outright: 391,008 per-100 g foods (85%) and 29,837 drinks (48%).
