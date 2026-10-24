---
id: MM-616
status: proposed
component: food-database
related: [MM-52, MM-607, MM-604]
---

# Task: Catalog foods carry a food group

## Context
The coach's trade may name a catalog food (MM-607, the owner's choice of 2026-10-24). To offer a sensible one, it must know what
kind of food X is: granola is traded for another breakfast cereal or yogurt, not for canned tuna. The pack has no category or
food-group field (`foodCatalog/`). The USDA sources carry one (`food_category` for Foundation and SR Legacy foods,
`branded_food_category` for branded foods; the spike's `1_load_usda_branded.py` already loads the latter). The pipeline drops it.

## Decisions
Choices made without asking (say if any is wrong):
- **A small fixed set of groups**, mapped from the source categories in the pipeline. For example: breakfast cereals, dairy and
  yogurt, meat and poultry, fish, eggs, legumes, nuts and seeds, breads and grains, fruit, vegetables, snacks and sweets, spreads
  and sauces, prepared meals, drinks. The mapping is a reviewed table in the pipeline.
- A food whose source category maps to nothing has no group, and is never offered as a trade.
- Custom foods and the person's own foods have no group unless the person sets one; MM-607 matches them by meal slot.

## Description
The pipeline maps each source category to a group and writes it to the pack. The pack schema gains the field. The catalog's
search API can filter by group. The pack's version rises.

## Acceptance Criteria
```gherkin
Scenario: A USDA food has its group
  Given a branded granola with branded_food_category "Cereal"
  Then the pack carries it in the breakfast cereals group

Scenario: Unmapped
  Given a source category not in the mapping
  Then the food has no group, and the pipeline report lists the category

Scenario: Filter
  When the catalog is searched for foods in a group
  Then only foods in that group are returned
```
