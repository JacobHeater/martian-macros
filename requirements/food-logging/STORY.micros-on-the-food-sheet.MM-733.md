---
id: MM-733
status: in-progress
component: food-logging
related: [MM-310, MM-561, MM-308, MM-642, MM-587]
---

# Story: The micros of a food on its sheet

## Context
The Micros picture on Food (MM-310) lists the day's micronutrients, each against the person's daily reference, with the
foods that add the most under each row (MM-561). The food sheet itself said nothing of them: a food being added, an
entry being edited and a logged meal being viewed showed calories, the macros and the split, and the micros the source
states (MM-308) were logged unseen. The owner (2026-11-05): on the food sheet in entry, edit or view mode, the micros
show up.

## Decisions (made with the product owner, 2026-11-05)
- **Three surfaces.** The amount step of Add food (entry), the Edit food sheet (edit), and View meal (view).
- **A collapsed Micros fold.** Under the macros line, beside "About this food" on the amount step and under the
  "Logs" line on the edit sheet; under the macro split on View meal. It starts closed on every open, as every fold
  does, and is drawn only while open.
- **The day panel's rows.** The same rows as the Food screen's Micros: the amount in words and a thin bar against the
  person's daily reference, so the share of a day one food gives is seen. Sodium against the person's limit when one
  is set (MM-311).
- **Stated ones, the rest named once.** Rows for what the food states; one line per group names what it does not
  ("Not stated by this food: Iron, Magnesium, Zinc."). A food stating none of them says so in one line.

## Choices made without asking
- **One food lists no foods under a row.** The day's rows open to their top foods (MM-561); for one food that would
  list the food itself.
- **View meal's fold is the meal's.** Its foods summed, "from 1 of 3 foods" where some do not state a nutrient, and the
  foods that add the most under each row, as the day's: a meal is several foods, and the day panel is the sibling.
- **A food typed from nothing shows none.** "Enter manually" collects calories, macros and the label's few other
  lines. The fold is drawn on the amount step, where the pack's micros are scaled to the amount, and on the form
  whenever it has an entry to scale from: one being edited, or a recent food or one from the log being logged again
  (MM-623), which the owner's Pixel showed is how a food is most often entered.
- **The fold has no memory.** Every fold starts collapsed (the owner, 2026-10-30).

## Description
On the amount step, the Edit food sheet and View meal, a "Micros" fold holds the micronutrient rows of the food at
the amount chosen (or of the meal over its foods): minerals, vitamins and the label's other lines, each against the
person's daily reference, with what is not stated named once per group. The rows are `MicrosPanel`'s, given `one` for
one food.

## Acceptance Criteria
```gherkin
Scenario: Entry
  Given a pack food stating potassium per 100 g
  When 100 g of it is chosen on the amount step and the Micros fold opened
  Then a Potassium row shows its amount against the daily reference, and the nutrients it does not state are named once

Scenario: Entry from the log
  Given a recent food carrying its source's micros
  When it is chosen from the add-food sheet and the Micros fold opened
  Then the same rows show its micros as they will be logged

Scenario: Edit
  Given a logged entry carrying its source's micros
  When it is opened to edit and the Micros fold opened
  Then the same rows show the entry's micros as they will be saved

Scenario: Nothing stated
  Given an entry whose source states no micronutrient
  When its Micros fold is opened
  Then one line says no micronutrients are stated for this food

Scenario: View meal
  Given a logged meal of three foods, one stating potassium
  When View meal's Micros fold is opened
  Then the Potassium row says its amount from 1 of 3 foods, and opens to the foods that add the most

Scenario: Closed on arrival
  When any of the three sheets opens
  Then the Micros fold is closed and nothing of it is drawn
```

## UI/UX
Stories in `src/gallery/screens/Food.stories.tsx`: `AddFoodAmountMicros`, `AddFoodAmountMicrosNoneStated`,
`EditFoodMicros`, `ViewMealMicros`. A change the owner dictated: no panel pass. The rows are the day panel's, already
reviewed at phone width (MM-310).

## Notes
- `test/food/foodSheetMicros.test.tsx` holds the four scenarios.
- Not run locally; CI validates.
- Seen on the owner's Pixel, 2026-11-05, main at 74db39d7: the fold closed on arrival on all three sheets, and open
  showing the rows against the references: a pack kale on the amount step (potassium 417 mg of 3,400), the owner's
  eggs logged again from Recent on the form (vitamin D 12 µg of 15), a Snickers in Edit food, and a logged meal in
  View meal with its rows pressable (`mm screenshot --phone`, MM-732, took the pictures). No record was added.
