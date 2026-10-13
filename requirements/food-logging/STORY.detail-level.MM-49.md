---
id: MM-49
status: in-progress
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

## Progress
Built: a Detail setting in Settings (Simple, Standard, Full; Standard by default) stored on the device (schema version 15).
Entries now store fiber, sodium and alcohol when their source states them (pack and barcode foods, scaled to the amount eaten);
a typed entry has none, shown as unknown, never zero. Net carbohydrate is carbohydrate less fiber, and only where fiber is known.
Entry rows show protein only at Simple, the macros at Standard, and fiber, net carbs, sodium and alcohol at Full. Switching
level reveals what was stored all along. Editing a calculated entry scales its extra nutrients with the amount. Tested in the
preference and food repository contracts (memory and Drift), the migration test, and `detail_level_test.dart`.

Not built: sugars and saturated fat (the packs do not carry them), the Today summary and the add-food form following the level
(only entry rows do), and the energy check already counts alcohol and fiber (MM-53) so needed no change. Not seen on the emulator.
