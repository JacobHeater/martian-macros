---
id: MM-49
status: proposed
component: food-logging
related: [MM-37, MM-38, MM-41, MM-46, MM-55]
---

# Story: Choose how much nutritional detail to see

## Context
An experienced user wants fiber, net carbohydrate, sugar, saturated fat and sodium. A beginner shown all of that sees a wall of numbers.

## Decisions (made with the product owner)
- **One logging flow, with a display setting**: Simple, Standard, Full. **It changes what is shown, never what is stored.** A user who
  switches from Simple to Full sees fiber for every food they ever logged from the database.

Choices I made without asking (say if any is wrong):
- **Simple**: calories and protein. **Standard** (the default): calories, protein, carbohydrate, fat. **Full**: adds fiber, net
  carbohydrate, sugars, saturated fat, sodium and alcohol.
- **Entries store every nutrient their source provides.** A typed entry has only what was typed.
- **Alcohol and fiber enter the energy check** when present (7 and 2 kcal per gram), which removes the false warnings in MM-38.

## Description
A "Detail" setting in Settings. The Today summary, the entry rows and the add-food form show the fields for the chosen level.

## Acceptance Criteria
```gherkin
Scenario: Switching up reveals stored data
  Given foods logged from the database while on Simple
  When the setting is changed to Full
  Then those entries show their fiber and sodium

Scenario: Simple hides, it does not discard
  Given the setting is Simple
  When a database food is logged
  Then its carbohydrate and fat are stored though not shown

Scenario: A drink
  Given Full detail and an entry with 14 g of alcohol
  Then its calories are not flagged as disagreeing with its macros
```

## Notes
- Leucine and micronutrients were mentioned in planning as an expert want. The sources carry them patchily; leave them out until someone
  asks.
