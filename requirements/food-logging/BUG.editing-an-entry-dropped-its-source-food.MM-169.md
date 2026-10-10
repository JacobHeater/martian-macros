---
id: MM-169
status: done
component: food-logging
related: [MM-167, MM-48, MM-151, MM-49]
---

# Bug: Editing a logged pack food dropped the record of which food it came from

## Context
Since MM-167 an entry logged from a food pack, a barcode or a saved food stores its origin (pack, food id, source, source id). The edit
sheet (MM-48) rebuilt the entry's portion from the form and did not carry the origin across, so saving any edit, even only a new amount,
erased it. The entry still showed the right totals, so nothing looked wrong.

What it broke: remembering whether a food was last logged raw or cooked (MM-151) reads the origin, as will anything that finds the same
food again or traces a figure to its source.

Found by reading the edit path while adding stored nutrients (MM-49). It was fixed there in passing, with no ticket and no test.

## Decisions
- **An edit keeps the origin of the entry it edits.** Changing the amount or unit of a calculated entry is still the same food.
- **"Enter the totals myself" also keeps it**: the numbers are now the user's, but the entry is still about that food.

## Description
`AddFoodSheetState._portion` now passes `widget.entry?.portion?.origin` into the rebuilt portion.

## Acceptance Criteria
```gherkin
Scenario: The amount is changed
  Given a banana logged from the pack by weight
  When the entry is opened, its amount changed and saved
  Then the entry still records the same pack and food
```

## Notes
- Regression test: `apps/mobile/test/food_portion_test.dart`, "editing a pack food keeps which food it came from (MM-169)". Confirmed to
  fail with the origin not passed across, and to pass with it.
- Not covered by a test: the origin surviving "Enter the totals myself".
