# Brief: the Add food sheet says what it does (MM-218, MM-219, MM-220, MM-221, MM-411)

## Question
Four stories from the MM-212 walkthrough of the Add food sheet, all marked
"nothing here is decided", and MM-411 from the MM-410 review, are built on
`feat/m2` under the owner's instruction to close the beta's tickets; the
open owner questions in them were decided by the chair and are written into
each ticket for the owner to overrule. The stories that draw the states
exist (`Food.stories.tsx`); this is the review of the changes:

1. **One wording for what will be recorded (MM-218).** A line beginning
   "Logs" in the typed form ("Logs 290 kcal · 20 g protein · 30 g carbs ·
   10 g fat", with the servings in brackets when more than one multiplies
   per-serving numbers), the amount step ("Logs 105 kcal · …", "Logs an
   estimate: …" for a hand portion) and the estimate ("Logs about 520 kcal
   · …"), shown whenever the totals can be known. The caution for typed
   calories that disagree with the macros says which figure is kept.
   Stories `AddFoodManually`, `AddFoodAmount`, `AddFoodEstimate`,
   `AddFoodEstimatedTotals`.
2. **Finding and typing told apart; every way in in reach (MM-219).** Under
   results, "Estimate a meal" (text) beneath "Enter manually" (secondary)
   whenever a query is typed; the method chip "Totals only" instead of a
   second "Estimate"; a found food's row carries the chevron, a recent
   food's does not. Stories `AddFoodNothingFound`, `AddFoodSearching`,
   `AddFoodOwnAndRecent`.
3. **An action that is off says what it needs (MM-220).** "Still needed: a
   name, calories above zero, typed or from the macros." as a caption under
   the totals, the same under "Save food"; with nothing to estimate from,
   the estimate step shows only the notice, "Enter manually" and Back.
   Stories `AddFoodManually`, `AddFoodEstimateNoWeighIn`, the saved-food form.
4. **Editing shows what was typed and says what the day control does
   (MM-221).** "Per serving: 199 kcal · 20 g protein · 15 g carbs · 6 g fat"
   as a caption under the amount of a calculated entry; "Logged on" above
   the day stepper; the snack "Moved to Yesterday." after a save to another
   day; an old entry without an amount shows no method chosen. Stories
   `EditFoodFromThePack`, `EditFoodWithoutAmount`, `EditFood`.
5. **A failed read says so (MM-411).** `ReadFailedNotice` under the search
   field with Try again. Story `AddFoodSearchFailed`.

Does each match its siblings (rule 9) and the sheet's own words? Is the
"Still needed" caption the right weight and place against the inert button
it explains (MM-271 pattern)? Is "Totals only" the domain's word? Does a
screen reader hear the "Logs" line change as the person types (it is plain
text), the move snack, and the failed-read alert? Any state undrawn?

## Inputs
- `apps/mobile/src/food/AddFoodSheet.tsx` (84adc3df99a4e8ef…), `apps/mobile/src/food/FoodAmountStep.tsx` (b5fd513d7f580d54…), `apps/mobile/src/food/estimate/EstimateMealStep.tsx` (dc072e680175ed5c…), `apps/mobile/src/food/FoodSearchResults.tsx` (ad79a5d723525a82…), `apps/mobile/src/food/custom/CustomFoodForm.tsx` (f5ff687b40ad2f52…), `apps/mobile/src/food/food.css`.
- Stories: `apps/mobile/src/gallery/screens/Food.stories.tsx` (those named above).
- Tests: `apps/mobile/test/food/addFoodSays.test.tsx`; the MM-212 run's reports in `docs/agent-runs/mm212-add-food-walkthrough/` for what was found.
- Requirements: MM-218, MM-219, MM-220, MM-221, MM-411 (each with its "Decisions and build (2026-10-19)" section), MM-167, MM-223, MM-271.
- Direction: `design/screen-direction.md`, `design/anti-cruft-and-anti-slop.md`, `design/voice-and-wording.md`.

## Audit mode, coverage, renders
- Mode: change. Baseline `main` at 39f315c; the working tree of `feat/m2`.
- **Depth targets**, counted from the source: (a) a food typed by hand from a label, two servings, calories typed against the macros, logged (1 name, 1 amount, 4 numbers, 1 meal, 1 press); (b) a logged per-serving entry corrected and moved to yesterday (2 presses, the numbers, 1 press). Everything else surveyed.
- **Render supplied**: the stories, read from source (no browser on the owner's Mac in this session). Say so.
- Not reviewed: search ranking, the packs, the camera, the backup.

## Existing facts, non-goals, owner decisions
- MM-167's decisions on quantity, unit and basis; MM-223 (discovery and manual entry apart); MM-271 (an inert action explains itself; a sheet has a Close); MM-293 (this review before the branch ships).
- Non-goals: a redesign of the sheet toward the direction's "Food logging flows" (an owner question carried in MM-220); recents opening the amount step (left as MM-167 says).

## Acceptance criteria
- Each ticket's own scenarios.
