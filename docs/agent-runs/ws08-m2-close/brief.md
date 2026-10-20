# Brief: closing the M2 food-logging tickets (MM-167, MM-151, MM-152, MM-49, MM-150; MM-153's amount-step line)

## Question
Workstream WS-08's remaining M2 tickets are built on `wt/logging` (from `feat/m2`, 2026-10-20). The
new states are drawn in `apps/mobile/src/gallery/screens/Food.stories.tsx`. Do the new parts match
their siblings on the amount step and the typed form (rule 9 of `design/screen-direction.md`), say
what they do in the domain's words, and leave a novice knowing what will be logged?

## What changed
1. **The amount step** (`apps/mobile/src/food/FoodAmountStep.tsx`):
   - a caption under the amount field, "Per 100 g: 130 kcal · 3 g protein · 28 g carbs · 0 g fat"
     (MM-153: what the source states, nothing invented; the sibling is the edit sheet's "Per serving:"
     caption, `food-reference-line`, MM-221). Story `AddFoodAmount`, `AddFoodAmountBranded`.
   - "Cooked with oil?" (No / 1 tsp / 1 tbsp, built earlier) now, once a spoon is chosen, shows a chip
     row "Which fat": Oil, Butter, Ghee, Coconut oil, the person's usual one preselected (sibling: the
     "Amount in" choice chips), and a caption "Adds butter as its own entry: about 34 kcal · 4 g fat".
     The fat chosen becomes the usual (MM-152). Story `AddFoodAmountCookedWithOil`.
   - the raw/cooked switch "Weighed as" starts on the state the food was last weighed in, read from
     the whole log, not the last twenty recent foods (MM-151). Story `AddFoodAmountRememberedRaw`.
   - at Simple detail the Logs line says calories and protein and the split is not drawn, as on the
     hero (MM-49). Story `AddFoodAmountSimple`.
2. **The typed form** (`apps/mobile/src/food/AddFoodSheet.tsx`): at Simple detail, Protein g and
   Calories only (Carbs g and Fat g hidden, kept if an edited entry has them); at Full detail a group
   "Also on the label" with Fiber g, Sugars g, Saturated fat g, Sodium mg, two to a line (sibling: the
   saved-food form's `food-extra-fields`, MM-309). The Logs line and the split follow the level.
   Stories `AddFoodManuallySimple`, `AddFoodManuallyFull`.
3. **Rows** (`FoodEntryTile.tsx` via `format/portionSummary.ts`, `format/extraNutrientsLine.ts`): the
   portion line carries the state, "Weighed · 200 g raw · calculated from 365 kcal per 100 g"
   (MM-151's "the entry says which state it is"; "as packaged" for a packaged food); at Full detail
   "Sugars 15 g · Saturated fat 3 g" join fiber and sodium (MM-49). Stories `FoodWeighedRaw`,
   `FoodFullLabelLines`.
4. **Recents**: a recent estimated meal's row reads "Your recent food · estimated · 900 kcal"
   (MM-150). Story `AddFoodRecentEstimate`.

## Not changed (other lanes)
`BarcodeScanStep`, `FoodSearchResults`, `src/foodCatalog/`, `src/foodPipeline/`, `src/foodPacks/`,
the Settings screen.

## Roles and questions
- **product-designer:** does each new part read as one of its siblings (chips, captions, labels); is
  anything given weight it has not earned; are the words the domain's ("as packaged", "estimated",
  "Which fat").
- **ux-accessibility:** walk (a) rice weighed raw, a teaspoon of butter added; (b) a typed food at
  Simple and at Full; (c) an estimate re-logged from recents. Does a novice know which fat will be
  added and that it is a second entry; is "Which fat" discoverable only after a spoon is chosen;
  does hiding Carbs and Fat at Simple leave a typed entry honest; the chip groups' names for a reader.

## Tests
`apps/mobile/test/food/rawOrCooked.test.tsx`, `detailLevel.test.tsx`, `estimateMeal.test.tsx`,
`test/domain/conversionFor.test.ts`, `cookingFat.test.ts`, the food and preferences repository
contracts, `test/data/upgrade.test.ts` (version 14 to 15).
