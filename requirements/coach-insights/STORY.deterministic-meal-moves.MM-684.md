---
id: MM-684
status: in-progress
component: coach-insights
related: [MM-607, MM-616, MM-617, MM-663, MM-666, MM-674, MM-682, MM-683]
---

# Story: One move per meal, deterministic, ranked by the day's gap

## Context
The breakdown sheet, the inline lines and the Executive brief each find a worst food and call `swapFor` for a single
like-for-like replacement (MM-666, MM-663). The owner's Q&A (MM-682) replaces that unit of analysis with a set of
moves scored against the day, one of which is the coach's order. The same engine feeds all three surfaces and, in
MM-685, the tools the model reasons with.

## Decisions
- **The moves (`MealMove`, `engine/analysis/moves/`)**, each priced by the engine:
  - `cutPortion`: the outlier down to one of its usual servings when logged as more than one and a half
    (`usualServing`), otherwise to half; the calories kept and the protein lost; the meal's protein density after it.
  - `addProtein`: a lean protein food added to this meal next time; the meal's protein after it.
  - `swapSameGroup`: a food of the outlier's own group in its place: `catalogSwapOf` first (already held to the group),
    then the person's own foods at that slot held to the same group (`ownSwapOf` with the candidates filtered by
    `foodGroupOf`), then the coach's table of classic swaps (`tableSwapOf`); never a food on the plate (MM-674).
  - `nextMeal`: today's order: the calories left, the protein to go, and the lean protein food that closes the most of
    it inside the calories left (or, when nothing can, the one that gets closest). When the protein cannot fit, the
    words are line A's: hold the calories, spend them on lean protein, protein first tomorrow.
- **Candidates (the owner): the catalog first, then the person's foods.** A lean protein food is one of the protein
  groups (`meatAndPoultry`, `fish`, `eggs`, `dairyAndYogurt`, `legumes`) with at least half its calories from protein at
  its default serving; `CatalogTradeCatalog.load` reads those groups whether or not the person has logged from them.
  The person's own foods qualify when logged at that slot on `TradeRule.loggedMinDays` days and as lean. Nothing on
  the plate, nothing snoozed, nothing the safeguards forbid (`swapLimitsOf`, `foodLimitsOf`).
- **Ranking (the owner: by the day's gap).** When the protein to go cannot fit inside the calories left
  (`proteinUnrecoverable`), the `nextMeal` order comes first. Otherwise the meal's own fix for next time: while protein
  is still to go today, the move that leaves the meal with the highest protein density, ties in the order swap, add,
  cut; with the day's protein covered an add only costs calories, so the swap comes first and the cut after it.
  `nextMeal` follows a fix while protein remains today, and stands alone when no fix exists. `best` is the first; the
  sheet shows only it.
- **The outlier** stays as MM-666 found it: the food with the most calories not backed by protein at the day's target
  density, among foods that count (`countsAsFood`); on the protected path there is none.
- **The words (`format/coach/mealMovesText`)** are MM-682's approved lines A, B and C, built from the figures: the meal's
  calories and share, the protein, the drag named with its figures, the one order. The inline line under the outlier is
  the approved inline line; a `mostlyFat` food says "Mostly fat: {kcal} kcal, {share}% from fat." before the same order.
  `mealBreakdownArchetypeText` and the brief's driver clause say the best move; the sheet's "Suggested swap" row becomes
  "Your move", its subtitle the move in a few words, its trailing the figures.
- **Choices made without asking:** half the calories from protein as "lean"; an add of at most 300 kcal; the table of
  classic swaps kept as the third source of a same-group swap; the next slot named (breakfast to lunch, lunch to
  dinner, dinner to a snack, after a snack "your next meal"); a meal whose outlier has no group gets no swap and falls
  to add or cut; with a catalog installed the add may rank above the cut under the biscuit, so the approved inline line
  is the cut's words where nothing lean is at hand.

## Description
`mealMovesOf` computes the moves and the best one for a meal against the day; `mealBreakdownAnalysisOf` and
`executiveBriefOf` carry them in place of `suggestedSwap` and `replacement`; the sheet's rows, the inline lines and the
brief's words say the best move in the approved lines.

## Acceptance Criteria
```gherkin
Scenario: Line A on the owner's breakfast
  Given the breakfast of MM-683 with 347 kcal left and 100 g to go
  Then the best move is nextMeal and the built-in words are line A of MM-682, word for word

Scenario: Line B when the meal is built wrong and the day has room
  Given lunch of 700 kcal and 22 g with fries at 420 kcal and 5 g, 1,100 kcal left for 110 g, chicken breast in the catalog at 165 kcal and 31 g
  Then the best move is addProtein and the words are line B

Scenario: Line C when the catalog has a same-group swap
  Given breakfast of 520 kcal and 18 g with a croissant at 300 kcal and 6 g, a whole wheat bagel in the same group at 250 kcal and 10 g
  Then the best move is swapSameGroup and the words are line C

Scenario: The inline line under the outlier
  Given the biscuit at 541 kcal and 10 g triggers lightOnProtein
  Then the line is "Light on protein: 541 kcal for 10 g. Half of it next time keeps 271 kcal for protein."
```

## UI/UX
- Your move — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: MealCoachBreakdown). The row says the move; the
  sheet keeps its shape. Dictated by the owner, so no panel; the 360 px story (MealCoachBreakdownScrolled) still draws it.

## Notes
- Tests: `test/engine/mealMoves.test.ts` (the three lines), `test/engine/mealSwapSameGroup.test.ts` (MM-683),
  `test/food/mealCoachBreakdown.test.tsx` and `test/coach/coachNarrationWait.test.tsx` updated. Not run locally; CI validates.
