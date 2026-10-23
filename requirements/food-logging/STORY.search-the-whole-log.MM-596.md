---
id: MM-596
status: in-progress
component: food-logging
related: [MM-39, MM-439, MM-586, MM-587, MM-595]
---

# Story: Search finds everything I have ever logged

## Context
The product owner, 2026-10-22: the app is gathering foods, typed by hand and analysed by AI (MM-586), and they
should be found by search. They were not: search looked only at the twenty most recent distinct foods and the
five most recent meals, and the foods of a meal not at all, so a food logged once fell out of reach. "We
should use our dataset": the person's own log is the app's own food data.

## Decisions
Made with the product owner (2026-10-22):
- **Typing in Add food's search finds every food and meal ever logged** whose name holds what is typed,
  the foods of meals among them.

Choices I made without asking (say if any is wrong):
- **Each name once, as last logged, newest first**, at most 25 foods and 10 meals, above the packs' results.
- **Their line says "From your log"**, not "Your recent food", since they may be months old. The list shown
  before anything is typed is unchanged: the recent foods and meals.
- **A food of an analysed meal comes back as one usual portion of it** (MM-595).
- **Read from the log as it is**: no new table, no schema change.

## Acceptance Criteria
```gherkin
Scenario: An old food
  Given "Grandma's lasagna" was logged 120 days ago, and thirty other foods since
  When the person types "lasagna" in Add food's search
  Then "Grandma's lasagna" is found, "From your log"

Scenario: A food of a meal
  Given white rice was logged as one food of an analysed meal
  When the person types "white rice"
  Then it is found by its own name

Scenario: An old meal
  Given "Chicken and rice" was logged before six other meals
  When the person types "chicken and" and presses it
  Then the same foods are logged again as one meal
```

## Notes
- `LoggedFoodSearch` (`searchLoggedFoods`, `searchLoggedMeals`) on the food log, in SQL with `LIKE` (a typed
  `%` or `_` taken as itself) and in memory; contract cases MM-596.
- Tests: `test/food/searchTheLog.test.tsx`, the food repository contract.
