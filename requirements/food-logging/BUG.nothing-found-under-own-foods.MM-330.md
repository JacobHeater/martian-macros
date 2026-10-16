---
id: MM-330
status: done
component: food-logging
related: [MM-42, MM-45, MM-321]
---

# Bug: search said "Nothing found" under the person's own matching foods

## Context
Found drawing the Food screen's undrawn states for MM-321 (story "Add Food Own And Recent"). Searching
"demo" listed the person's recipe, their own food and four recent foods, then said `Nothing found for
"demo".` under them: the pack had no match, and the line spoke for the whole search.

## Description
When the person's own or recent foods match, an empty pack search adds nothing. With no pack on the
phone, the line saying so stays, since that is news either way.

## Acceptance Criteria
```gherkin
Scenario: Found among the person's own foods
  Given a food of the person's own named "Overnight oats" and no pack food matching it
  When "overnight" is searched in Add food
  Then "Overnight oats" is listed and nothing says "Nothing found"

Scenario: Found nowhere
  When "zzqx" is searched
  Then it says Nothing found for "zzqx".
```

## Notes
Guarded by `apps/mobile/test/food/searchFoundElsewhere.test.tsx`, which failed before the fix
(`FoodSearchResults` takes `alsoFound`).
