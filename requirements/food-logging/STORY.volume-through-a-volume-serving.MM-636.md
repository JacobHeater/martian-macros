---
id: MM-636
status: done
component: food-logging
related: [MM-42, MM-55, MM-167, MM-628, MM-632]
---

# Story: measure a food in cups, tablespoons and teaspoons when its source gives a volume serving

## Context
The owner's priority (2026-10-26): volume as well as mass. The food-logging review (`docs/food-logging-plan.md`,
F-02, C2) found volume supported in the domain (MM-167) but out of reach. The packs carry no density, and the
amount step offered no volume unit. Half a cup worked only through a source serving that was already a cup.
The owner approved building it (2026-10-26).

A closer look changed the approach. The packs keep each serving as the source states it: its words ("1 cup,
chopped", "2 tbsp", "8 fl oz") and its gram weight, the source's own for that form of the food. In FDC's data
the unit often sits in those words rather than in a structured field, so the build keeps it there. The volume
can be read from them when the app opens a food. That needs no new pack format and no rebuild, and the packs
already published gain volume at once.

## Decisions
From the owner (2026-10-26): build volume (the plan's C2).

Choices made without asking (say if any is wrong):
- **A serving's volume is read from its own words**: a measure at its start (cups, tablespoons, teaspoons,
  fluid ounces, millilitres, litres; "1/2", "1 1/2"), or millilitres it states in brackets ("1 cup (240 ml)",
  a label cup, taken as stated). Anything else holds no volume.
- **Volume is offered only through the first such serving that has a gram weight**: cups, tablespoons and
  teaspoons, plus fluid ounces and millilitres when that serving is stated in them (a drink). The serving's
  own unit, one of it, is not repeated (its chip already says "1 cup (158 g)"). No density is guessed;
  a food with no volume serving offers none.
- **A volume weighed through a serving is of that serving's form**, and its chip says so: "Tablespoons,
  chopped" through "1 cup, chopped".
- **A volume is a household measure** (MM-167), of a packaged food too, and its field says the grams it
  stands for, as a serving's does.
- The logged entry's reference keeps the serving's volume, so editing it later offers volumes too, and fluid
  ounces among them.
- **Not in this ticket** (the plan's H-06, a data check first): Branded servings stated only in mL, and
  Open Food Facts liquids stated per 100 mL.

## Acceptance Criteria
```gherkin
Scenario: Two tablespoons through a cup
  Given cooked white rice whose source serving is "1 cup" of 158 g
  When it is logged as 2 tablespoons
  Then the field says 20 g, the entry is calculated from 19.75 g, and it is a household measure

Scenario: No volume serving, no volume
  Given a banana, served "1 medium"
  Then no cup, tablespoon or teaspoon is offered

Scenario: The words
  Then "1 cup, chopped" holds 236.6 mL, "2 tbsp" 29.6 mL, "1 cup (240 ml)" 240 mL, and "1 medium" none
```

## Notes
- Built in `domain/food/portion/servingVolume.ts`, `format/servingForm.ts`, `food/volumeChoices.ts` and
  `FoodAmountStep`; `AddFoodSheet` offers fluid ounces when editing.
- Tests: `test/domain/servingVolume.test.ts`, `test/food/volumeFromServings.test.tsx`.
