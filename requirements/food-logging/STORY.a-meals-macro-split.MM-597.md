---
id: MM-597
status: in-progress
component: food-logging
related: [MM-587, MM-125, MM-331, MM-396, MM-554]
---

# Story: A slot and a logged meal show their macro split

## Context
The product owner, 2026-10-22: meals need a way to see the pie chart split, as a food does before it is
logged and the day does in its hero. "Meal" means both the slot (breakfast, lunch, dinner, snacks) and a
logged meal (MM-587); the owner wants the split for the whole slot.

## Decisions
Made with the product owner (2026-10-22):
- **The slot's split is in its header's ⋯ menu**: "Macro split" opens a sheet with the slot's name and the
  ring of everything in it, its logged meals' foods included. The menu shows only when the slot has food;
  the card stays as compact as it was.
- **The fold's arrow sits beside the slot's title** (owner, after seeing the ⋯ wrap the summary, then the
  summary moved under the header leave the icon and actions off-centre): the icon, grade, + and ⋯ stay
  centred on the title and summary together, and the summary has the width up to the grade, so today's lines
  stay on one; a much bigger day's wraps rather than running under the actions. Water's card is drawn the same
  way, so the cards match. `MmSection`'s `foldBesideTitle`.
- **The slot's summary is two lines** (owner, after Dinner's "1,200 kcal · P 32 · C 56 · F 88" still
  wrapped): the calories, and under them, flush left, the macros with the protein marker. Water's summary
  stays one line.
- **The protein marker explains itself** (owner, asking what the ✓ meant): pressed, it says, as a grade does,
  "A solid serving of protein", the meal's protein, what earns the mark for this person (0.3 g per kg of
  reference weight, MM-125) and MM-125's own hedge: "Spreading protein over the day may help slightly. Your
  daily total matters much more." For it to be pressed on its own, the fold's button is the title and arrow
  stretched over the header, and the summary sits beside it rather than inside it.

Choices I made without asking (say if any is wrong):
- **A logged meal's split is in View meal** too, under the meal's totals and grade, labelled "Macro split": the same ring the add-food
  sheet and the estimate show (`MacroSplitChart`), with each macro's grams and share of energy and the line
  that says how the split is counted. Not on the meal's row in the day, which stays one line like a food's.
- **Net carbs follow the setting** (MM-396), as the meal's row does.
- It reads the saved foods, so a food changed, added or removed in View meal changes the split at once.

## Description
`MealSplitSheet` draws `MacroSplitChart` from the slot's entries; `MealSection`'s header menu opens it.
`ViewMealSheet` draws it from the meal's summed protein, carbs, net carbs and fat.

## Acceptance Criteria
```gherkin
Scenario: The split of a slot
  Given dinner holds "Chicken and rice" and olive oil
  When the person opens dinner's menu and chooses "Macro split"
  Then a sheet titled "Dinner" shows the ring of every food in dinner, the meal's foods and the oil together

Scenario: The fold's arrow beside the title
  Given dinner holds food
  Then dinner's fold arrow is beside its title
  And under the title the calories are on one line and the macros on the next, both flush left

Scenario: The protein marker says what it means
  Given lunch at Full detail has 30 g of protein, enough for the marker
  When the person presses the marker
  Then a popover "A solid serving of protein" says the 30 g, what earns the mark and that the daily total
    matters much more
  And lunch does not fold

Scenario: An empty slot has no menu
  Given breakfast holds nothing
  Then its header has no menu

Scenario: The split in View meal
  Given "Chicken and rice" was logged with three foods
  When the person opens View meal
  Then it shows "Macro split" with a ring whose label gives protein, carbs and fat with their grams and shares

Scenario: The split follows a change
  Given View meal is open
  When a food of the meal is removed
  Then the split is drawn from the foods that remain
```

## UI/UX
- A slot's split — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: MealSplit).
- The arrow beside the title — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: Food), and
  `MmSection` with `foldBesideTitle` in the components catalog.
- View meal — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Story: ViewMeal), which now shows the
  ring under the totals.

## Notes
- Built in the owner's checkout on 2026-10-22, not run locally: tests are written for CI.
- Tests: `test/food/proteinAcrossMeals.test.tsx` ("the marker, pressed, says what it means…"),
  `test/food/loggedMeal.test.tsx` ("a slot's menu opens the macro split…", "View meal shows the
  meal's macro split…").
