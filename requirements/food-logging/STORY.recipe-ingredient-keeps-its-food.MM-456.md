---
id: MM-456
status: proposed
component: food-logging
related: [MM-45, MM-151, MM-167, MM-61]
---

# Story: A recipe's ingredient keeps the food it came from

## Context
A recipe's ingredient line (MM-45) stores its name, its weight and its totals at the time it was written, so a recipe never changes
because a food pack did. It does not store which pack food it was found as. An entry has stored its source food since MM-167, and
that is what lets the raw-or-cooked switch start where the person last weighed (MM-151) and a food's grade be shown. A recipe line
has neither: changing its weight means removing it and finding the food again, and the switch on an ingredient always starts on the
food that was picked.

## Description
- An ingredient found in a pack records its pack and food id with the line. A line typed as totals records none.
- Opening a saved recipe lets a found line's weight be changed in place: its totals are recalculated from the food's numbers per
  100 g at the time of the change, if that food is still installed; otherwise the line keeps its totals and says the food is not
  installed.
- The totals stored with a line stay the record: a later pack update never changes a saved recipe unless its line is edited.
- Needs a schema change (two nullable columns on `recipe_ingredients`, `source_pack_id` and `source_food_id`), so it waits until no
  other branch holds the next schema version.

## Acceptance Criteria
```gherkin
Scenario: The source is kept
  Given "White rice, raw" is found and added to a recipe at 200 g
  When the recipe is saved and opened again
  Then the line knows it came from that pack food

Scenario: A weight changed in place
  Given a saved recipe's line of 200 g "White rice, raw" at about 730 kcal
  When its weight is changed to 100 g
  Then the line is about 365 kcal

Scenario: A typed line
  Given a line typed as totals
  Then it records no source and its weight cannot be recalculated

Scenario: A pack update does not rewrite a recipe
  Given a saved recipe whose line's food later changes in the pack
  Then the recipe's totals are unchanged until the line is edited
```

## Notes
- Found while finishing MM-45 on 2026-10-21; that round's schema change was held by another branch, so this was not built with it.
