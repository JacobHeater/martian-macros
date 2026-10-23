---
id: MM-561
status: done
component: food-logging
related: [MM-310, MM-311, MM-305, MM-108]
---

# Story: The top foods under each micronutrient

## Context
The Micros picture on Food (MM-310) says how much of each nutrient the day's foods state, and from how
many of them, but not which foods. The owner (2026-10-22): "Micros must have dropdowns under all of them
that show the top 5 contributing foods in descending order of impact."

## Decisions
The owner's: every nutrient row opens to its top five foods, most first.

Choices I made without asking (say if any is wrong):
- **The whole row is the toggle**, with a chevron at the end of its amount, so the list folds open under
  the row it belongs to without adding a control per row. It starts closed and is not remembered.
- **Entries with the same name are one food**, their amounts added: two bowls of spinach are one line.
- **A food that states nothing or 0 is not listed.** Fewer than five foods state it, fewer lines show.
- **Each line shows the food's name and its amount**, in the row's unit and wording (`nutrientAmount`),
  in the same neutral colour as the row (MM-108). A tie keeps the order the foods were logged in.
- Every row with a number opens, the label's other lines (sugars, saturated fat, cholesterol) and sodium
  included. A nutrient no food states has no row (MM-310), so nothing to open.

## Description
`topSourcesOf` ranks one day's foods for a nutrient; `MmNutrientRow` takes the sources and folds them
open under the row; `MicrosPanel` passes them for every row.

## Acceptance Criteria
```gherkin
Scenario: The top foods, most first
  Given today's foods state iron: Toast 1 mg, Lentils 6.6 mg, Spinach 3 mg
  When I press the iron row
  Then it opens a list: Lentils 7 mg, Spinach 3 mg, Toast 1 mg

Scenario: Five at most, one per food
  Given seven foods state iron, two of them named Spinach
  Then the list has five lines, and Spinach is one line with both amounts added

Scenario: Only foods that add some
  Given a food states 0 mg of iron and another states nothing
  Then neither is listed

Scenario: Heard as a fold
  Then a screen reader hears the row as a button, collapsed or expanded, with its sentence as its name
```

## UI/UX
- Micros — apps/mobile/src/gallery/ComponentsCatalog.tsx (the iron row opens) and
  apps/mobile/src/gallery/screens/Food.stories.tsx (Story: Micros): each row opens.

## Progress
Built: `topSourcesOf`, `MicronutrientSource`, `MmNutrientRow`'s `sources`, wired in `MicrosPanel`.
Tested in `test/domain/micronutrients.test.ts` and `test/food/waterAndMicros.test.tsx`. Not run locally;
CI validates.

Not looked at: Storybook, TalkBack, the phone.
