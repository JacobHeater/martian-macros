---
id: MM-45
status: proposed
component: food-logging
related: [MM-37, MM-39, MM-42, MM-44, MM-47, MM-61]
---

# Story: Save my own foods and recipes

## Context
Recents (MM-39) remember one amount of one food. Someone who makes the same chili every week, or eats a protein bar the database lacks,
needs a food they define once and log in any amount.

## Description
- **A custom food** has a name, a serving description and weight, macros per serving, and optionally a barcode. It can be logged in any
  number of servings or grams.
- **A recipe** is a list of foods and amounts with a number of servings. Its macros per serving are calculated. Logging "1.5 servings"
  scales it.
- Custom foods and recipes appear in search above database results (MM-42), can be edited and deleted, and are included in backup (MM-63).
- Editing a custom food does not change entries already logged from it.

## Acceptance Criteria
```gherkin
Scenario: A custom food in any amount
  Given a custom food of 30 g per serving with 120 kcal
  When 45 g is logged
  Then the entry has 180 kcal

Scenario: A recipe
  Given a recipe of 500 g chicken, 300 g rice and 20 g oil that makes 4 servings
  Then one serving has a quarter of the summed macros

Scenario: Editing does not rewrite history
  Given a custom food was logged yesterday
  When its macros are changed today
  Then yesterday's entry is unchanged

Scenario: The energy check
  Given a custom food whose calories disagree with its macros
  Then the same warning as for a typed entry is shown
```

## Notes
- Needs new tables, so it is the first real use of schema migrations (MM-61).
- Cooked-versus-raw weight is the classic recipe error (raw rice weighs a third of cooked). Ask for the cooked weight of the whole recipe
  as an optional step; do not try to model cooking loss.
