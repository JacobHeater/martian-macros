---
id: MM-637
status: done
component: food-logging
related: [MM-58, MM-439, MM-596, MM-627, MM-629]
---

# Story: a search's own foods and log stand apart from the food database's

## Context
The owner, 2026-10-26: "if recents aren't visually separated from the search list, they need to be." With an
empty search the recent foods sit under "Recent foods", and the foods found online under "Found online"
(MM-58). But with a search typed, the person's saved foods and what matched in their own log ("From your log",
MM-596) ran straight into the food database's results, with no heading and no space between them.

## Decisions
From the owner (2026-10-26): the person's own results are visibly separated from the search list.

Choices made without asking (say if any is wrong):
- **Two headings, built like "Recent foods" and "Found online"** (the same label and spacing, MM-318): "Your
  foods and meals" above saved foods and what matched in the log, when there are any, and "From the food
  database" above the packs' results, when there are any. The rows themselves are unchanged.
- The order stays: their own first (MM-596), then the database (MM-627), then online (MM-58).

## Acceptance Criteria
```gherkin
Scenario: Own and database apart
  Given "Banana" was logged before and the food database holds bananas
  When the person searches "banana"
  Then "Your foods and meals" heads the logged banana, and "From the food database" heads the database's, below it

Scenario: Nothing of their own
  Given nothing logged or saved matches
  When the person searches "banana"
  Then only "From the food database" heads the results
```

## Notes
- Built in `AddFoodSheet` and `FoodSearchResults`. Tests: `test/food/ownApartFromDatabase.test.tsx`.
