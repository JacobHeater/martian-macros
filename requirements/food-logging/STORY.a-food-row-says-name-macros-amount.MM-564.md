---
id: MM-564
status: done
component: food-logging
related: [MM-255, MM-167, MM-151, MM-49, MM-429, MM-389]
---

# Story: A food's row says its name, macros and amount

## Context
The owner (2026-10-22): the food lists under the meal headings "feel cluttered and unintentional". A row
carried up to five lines: the name, the macros, at Full a line of other nutrients ("Fiber 1 g · Total carbs
40 g · Sugars 4 g · Saturated fat 8 g · Sodium 721 mg"), and a line on how it was measured and calculated
("Cup / spoon · 2 × 1 biscuit (90 g) · calculated from 350 kcal per 100 g").

## Decisions
The owner chose, from three drawn options: **name, macros, amount**.
- The name, at most two lines; then "P 6 · C 39 · F 14"; then the amount: "2 × 1 biscuit · 90 g",
  "200 g raw", "150 g". Raw or cooked stays, since it changes what the grams mean (MM-151); "as packaged"
  and "calculated from …" go to the entry's editor, which shows the basis already.
- The other nutrients leave the row at every level; they are in the editor and, for the day, in Micros
  (MM-310). This withdraws the row's extras line (MM-49) and MM-167's "how the totals came about" on the row.
- The method's icon stays, and the method is still heard with the row's lines (MM-429).
- An entry whose amount was never recorded draws no amount line.
- A serving named with its own weight says the weight once: "1 × 1 tbsp · 20 g", not "1 × 1 tbsp (20 g) ·
  20 g" (the owner's phone, 2026-10-22).

## Acceptance Criteria
```gherkin
Scenario: Three lines at most
  Given a biscuit logged as 2 × 1 biscuit (90 g), calculated from 350 kcal per 100 g, at Full detail
  Then its row shows "Biscuit, home recipe", "P 6 · C 39 · F 14" and "2 × 1 biscuit · 90 g"
  And no line of other nutrients and no "calculated from"

Scenario: Heard
  Then the row's press is described by its macros and how it was measured
```

## UI/UX
- FoodWeighedRaw, FoodAsPackaged — apps/mobile/src/gallery/screens/Food.stories.tsx.

## Progress
Built: `portionAmount`, `FoodEntryTile`. Tested in `test/food/detailLevel.test.tsx`,
`test/food/foodPortion.test.tsx`, `test/food/rawOrCooked.test.tsx`. Not run locally; CI validates.
