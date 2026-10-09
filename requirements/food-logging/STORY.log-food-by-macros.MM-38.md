---
id: MM-38
status: done
component: food-logging
related: [MM-37, MM-39, MM-41, MM-27, MM-53, MM-167]
---

# Story: Log a food by typing its macros

## Context
See MM-37. This is the fallback that must always work: any food, from any source, in a few seconds.

## Decisions (made with the product owner)
- **Every entry records how its amount was measured**, because that sets how much the engine trusts it (MM-27).
- **Energy must agree with macros**: within the larger of 15% and 20 kcal of 4 kcal per gram of protein and carbohydrate and 9 per gram of
  fat.

Choices I made without asking (say if any is wrong):
- **Calories may be left blank**; they are then calculated from the macros, and the field's hint shows the figure.
- **A mismatch warns and does not block.** Labels round, and fiber and alcohol break the arithmetic. The warning says what the macros add
  up to and to double-check the label.
- **The meal defaults from the clock**: breakfast before 11, lunch before 3, dinner before 9, otherwise snacks.
- **How it was measured**: weighed (5% uncertainty), label serving (10%), cup or spoon (15%), estimate (40%, changed from 20% by MM-167), palm (25%), cupped hand
  (30%), thumb (40%). The default is label serving.
- **Entries are deleted by swiping.** There is no undo and no confirmation.

## Description
"Add food" on the Today screen opens a sheet: food name, protein, carbohydrate and fat in grams, calories, meal, and how it was measured.
"Log it" is enabled when there is a name and a positive energy (typed or calculated). The entry is added to the day being viewed, which may
be a past day.

## Acceptance Criteria
```gherkin
Scenario: Calories from macros
  Given 45 g protein, 60 g carbohydrate and 10 g fat are entered and calories left blank
  When it is logged
  Then the entry has 510 kcal

Scenario: A label that does not add up
  Given 10 g protein, 10 g carbohydrate, 5 g fat and 400 kcal are entered
  Then a warning says the macros add up to 125 kcal
  And the entry can still be logged

Scenario: Nothing to log
  Given no name, or no energy
  Then "Log it" is disabled

Scenario: Deleting
  When an entry is swiped away
  Then it is removed and the day's totals fall

Scenario: Logging to a past day
  Given yesterday is being viewed
  When a food is logged
  Then it appears under yesterday
```

## Notes (built and verified)
- `apps/mobile/lib/src/today/add_food_sheet.dart`; `FoodEntry`, `atwaterKcal` and `macrosMatchEnergy` in `mm_domain`; `MmStore.addFood`
  and `deleteFood`.
- The widget test "logging food updates the day against its targets" covers the first scenario. **The mismatch warning, deletion and
  past-day logging have no test** and were not exercised on a device (MM-93).
- Alcohol (7 kcal per gram) and fiber are not fields, so a drink or a high-fiber food will trip the warning. Both arrive with MM-49.

## Clarified by MM-167 (proposed, not built)
What the form records today is a method and four totals; MM-167 requires a quantity and unit for each method, states that the typed
macros are "for everything you ate" unless another basis is chosen, defines Estimate as entered totals with no unit, and says what is
stored. This ticket's "how it was measured" behavior stands until MM-167 is built.

Decided with the product owner (MM-167): Estimate's uncertainty becomes 40%, to match MM-150. The "estimate (20%)" above is what shipped
and is to be changed with MM-167.
