# Review: ux-accessibility

Saved verbatim in substance by the edit owner (the WS-08 logging agent) from the read-only panel-ux-accessibility run of 2026-10-20 on `wt/logging` at 164d118 (the reviewer had no shell; the commit is recorded here).

## Scope and traceability
- Role: ux-accessibility (`agents/roles/ux-accessibility.md`). Reviewer: Claude Code read-only subagent, run `docs/agent-runs/ws08-m2-close`, 2026-10-20.
- Config read in full: `AGENTS.md`, the role, `agents/panel-protocol.md`, `agents/review-contract.md`, the findings template. Brief: `docs/agent-runs/ws08-m2-close/brief.md`.
- Requirements inspected: MM-167, MM-151, MM-152, MM-49, MM-150 (food-logging), MM-153 (food-database); `requirements/HANDOFF.md` 1-140.
- Implementation inspected (`apps/mobile/src/`): `food/FoodAmountStep.tsx`, `food/AddFoodSheet.tsx`, `food/FoodEntryTile.tsx`, `food/FoodSearchResults.tsx`, `food/MealChips.tsx`, `food/FoodTrustMark.tsx`, `food/preparationOf.ts`, `food/estimate/EstimateMealStep.tsx`, `food/MealSection.tsx` (100-135), `food/food.css`, `format/{portionSummary,extraNutrientsLine,cookingFatEntryName,cookingFatKindLabel,preparationLabel,quantitySourceLabel,portionUnitOf,foodSourceLabel,trustTierLabel,detailLevelDescription}.ts`, `domain/food/{CookingFat,CookingFatKind}.ts`, `domain/food/detail/DetailLevel.ts`, `domain/food/portion/unitsOffered.ts`, `domain/{macrosMatchEnergy,energyAgreesWithMacros}.ts`, `ui/{MmChoiceChip,MmSegmented,MmTextField,MmButton,MmActionChip,MmListRow,MmPressable}.tsx`, `ui/ui.css`, `app/app.css`, `theme/tokens.css`, `foodCatalog/FixturePack.ts`, `fixtures/InMemoryFoodRepository.ts` (40-85), `data/SqlFoodRepository.ts` (55-80), `gallery/screens/screenStory.tsx`, `gallery/screens/Food.stories.tsx` (1-135, 880-1043), `settings/SettingsScreen.tsx` (grep).
- Tests inspected (read, not run): `test/food/rawOrCooked.test.tsx`, `detailLevel.test.tsx`, `estimateMeal.test.tsx`, `test/gallery/stories.test.tsx` (18-87).

## Existing facts versus proposals
Repository facts (source, file:line):
- F1. "Cooked with oil?" is offered only while the food being logged has `preparation === 'cooked'`; the food being logged is the alternate once "Weighed as" is switched (`FoodAmountStep.tsx:147-149`). The oil entry is written only if `offersOil` is still true at Log it (`:230-231`).
- F2. The Logs line states the food's totals alone (`:333-339`); the fat's kcal appear only in the caption (`:365`); the macro split adds the fat in (`:381-385`); Log it is described by the Logs line only (`:395`).
- F3. The fat chips sit in `<div role="group" aria-label="Which fat">` with no visible label (`:358`); "Weighed as" and "Cooked with oil?" each have a visible label plus the same text as the group's name. The story `AddFoodAmountCookedWithOil` declared `shows: 'Which fat'`, which the stories test looks for as text.
- F4. `MmChoiceChip` is `<button aria-pressed>`; `MmSegmented` is `<div role="group" aria-label>` of `<button aria-pressed>`; both 48 px tall; `.app-row` wraps; type tokens are rem-based.
- F5. At Simple the typed form hides Carbs g and Fat g (`AddFoodSheet.tsx:600-605`) while the energy check still compares typed calories with 4×protein (tolerance the larger of 15% or 20 kcal). Hidden carbs/fat are saved as 0.
- F6. The recent-food chips when the search is empty are `MmActionChip` with the name only (`:821-826`); the "estimated" mark is in the list row shown only once a query is typed (`:808`).
- F7. The Food row is `MmPressable label={"Edit " + entry.name}` around `FoodEntryTile`; `aria-label` replaces name-from-content, so the lines are not read.
- F8. "Weighed as" starts on the state found by `lastLoggedFrom` (newest entry across the whole log) and pre-selects the Grams chip.
- F9. The row's portion line is "Weighed · 200 g raw · calculated from 365 kcal per 100 g".
Approved requirements relied on: MM-151 Decisions; MM-152 AC "Cooking fat" and Decisions; MM-49 Decisions; MM-150 Decisions and AC "Reuse"; MM-153 Decisions; MM-167 §3.

## Audit coverage
- Mode: `change`. Depth counted from source: (a) amount step for a paired cooked food: 8 controls, about 21 options; (b) typed form: Full 13 fields/groups, Simple 11; (c) recents re-log: 1 chip then the filled form.
- Walked: (a), (b) Simple and Full, (c). Surveyed: `EstimateMealStep`, `FoodSearchResults` states, the Settings Detail row, `MacroSplitChart`, `FoodTrustMark` "Check this", the edit path, hand portions.
- Not inspected: `BarcodeScanStep`, `MyFoodsStep`, `foodCatalog/`, `foodPipeline/`, `foodPacks/`, Settings beyond grep, schema/migration.
- Render: none. Source inspection over the fixture pack's values. Not possible: contrast, text-scale and wrap at 200%, focus rings, screen-reader output.

## Novice mobile experience
### (a) 200 g of white rice weighed raw, cooked in a teaspoon of butter
1. Types "white rice": two pack rows, each naming the state. ✔
2. Taps "White rice, cooked": headline, source and tier, grade, chips "1 cup (158 g)" (pressed), "Grams", "Ounces"; "How many servings" = 1; "Per 100 g: …"; "Logs 205 kcal · …"; "Cooked with oil?"; split; meals; Log it. ✔
3. Taps "Grams": "Weighed as" Cooked | Raw with "100 g cooked is about 130 kcal. 100 g raw is about 365 kcal." ✔
4. Taps "Raw": headline "White rice, raw"; Logs 365; **"Cooked with oil?" disappears.** ✘ The control needed next is gone with no word; a spoon chosen earlier vanishes silently and is not logged. → UX-1.
5. Types 200: "200 g cooked is about 260 kcal. 200 g raw is about 730 kcal."; "Logs 730 kcal · …". ✔
6. (On Cooked) taps "1 tsp": chips "Oil" (pressed), "Butter", "Ghee", "Coconut oil", no visible heading; caption "Adds cooking oil as its own entry: about 40 kcal · 5 g fat". Taps Butter: "Adds butter as its own entry: about 34 kcal · 4 g fat". ✔ for which fat and its own entry; the row has no label → UX-3. The Logs line still says the rice only while the split includes the butter. ✘ → UX-2.
7. Taps Log it: row "White rice, raw" / "P 14 · C 160 · F 1" / "Weighed · 200 g raw · calculated from 365 kcal per 100 g" / "730". ✔ for sight. ✘ for a screen reader: the row's name is "Edit White rice, raw" and the lines are not read → UX-8 (pre-existing).

### (b) A typed food at Simple, then at Full
Simple: name, seven method chips, "Servings eaten", "Nutrition per serving", "Protein g", "Includes alcohol?", "Calories per serving" with "Leave blank to calculate from macros.", meals, Still needed, Log it. Types "Shake", 30, 200 → "Logs 200 kcal · 30 g protein". ✔ for the path. ✘ at Calories: the caution "Macros add up to 120 kcal per serving; the 200 typed is kept. Double-check the label." for any food whose calories are not within 15% of 4×protein, with the resolving fields hidden → UX-4. Blank calories logs 120 kcal from protein alone. Stored carbs/fat = 0 → UX-5.
Full: adds Carbs g, Fat g, then "Also on the label" with four fields in a 2-column grid, then alcohol and Calories; split; Logs. ✔ Nothing marks the four lines optional; Calories sits beneath them → UX-9. Row afterwards: "Fiber 6 g · Net carbs 54 g · Sugars 18 g · Saturated fat 2 g · Sodium 150 mg" ✔.

### (c) Re-logging "Thai place, usual" from recents
Path 1: "Recent foods" chip with no kcal and no mark → tap → form filled, "Estimated totals" pressed, Log it on. ✔ two taps. ✘ before the tap nothing says it is an estimate → UX-7. Path 2 (typed "thai"): "Your recent food · estimated · 900 kcal" ✔.

## Findings
**Blocking: UX-1 and UX-4.** All others are not blocking.

**UX-1 — "Cooked with oil?" vanishes when the weight is switched to Raw; task (a) cannot be completed.** Class: usability problem found by inspection; also a requirement gap (MM-152's AC cover "cooked" only). Severity **high, blocking**. Confidence high. Remediation: judge `offersOil` from the chosen food's pair (`chosen.preparation === 'cooked' || alternate?.preparation === 'cooked'`) so "Weighed as" never hides it; never discard a chosen spoon silently. Acceptance: `Given "White rice, cooked" is chosen and "Weighed as" is Raw / Then "Cooked with oil?" is still shown / When "1 tsp" and "Butter" are chosen and Log it is pressed / Then two entries are logged`; `Given "White rice, raw" is chosen from search / Then "Cooked with oil?" is shown`.

**UX-2 — The Logs line and Log it's description omit the second entry.** Class: usability problem found by inspection (MM-167 §3, MM-218). Severity **high**, not blocking on its own. Remediation: extend the Logs line when a spoon is chosen, or add the caption's id to `describedBy`; the Logs line and the split must agree.

**UX-3 — "Which fat" has no visible label, and its story's `shows` cannot be found by text.** Class: usability problem + implementation defect (by inspection). Severity **medium**. Remediation: a visible `food-label` "Which fat" as at "Weighed as"/"Cooked with oil?"; prefer `aria-labelledby` to a duplicated `aria-label` (design-system change). Acceptance: "Which fat" is visible text above the chips; the story passes.

**UX-4 — At Simple detail the Calories field warns about a mismatch the person cannot resolve.** Class: reproducible implementation defect (by inspection). Severity **high, blocking** for MM-49's typed form at Simple. Remediation: when carbs and fat are hidden, do not run the mismatch check or the from-macros hint, require typed calories, keep the helper neutral. Acceptance: `Given Simple detail / When 30 g protein and 200 kcal are typed / Then no caution is shown`; `When Calories is blank / Then Log it is off and Still needed names calories`. Note: no story anywhere draws the mismatch caution at any level.

**UX-5 — Carbs and fat hidden at Simple are stored and later shown as 0, a figure nobody typed.** Class: evidence-supported domain concern + requirement gap (MM-49 "a typed entry has only what was typed"). Severity **medium**. Remediation: owner decision; the UX minimum is a line under the fields at Simple saying carbs and fat are not asked, and a row that shows them as unknown if the model allows.

**UX-6 — The remembered state overrides the row the person tapped with no explanation.** Class: design improvement. Severity **low**. Remediation: a caption such as "Last time you weighed this raw" when the start state came from memory.

**UX-7 — Recent-food chips carry no "estimated" mark.** Class: requirement gap (MM-150) + usability problem. Severity **medium**. Remediation: label the chip "Thai place, usual · estimated". Acceptance: with no query, the estimate's chip says estimated.

**UX-8 — The Food row's lines are not read by a screen reader (pre-existing).** Class: usability problem found by inspection (accessibility). Severity **high** for reader users, **not blocking this close** (pre-existing since MM-255; needs its own bug ticket). Remediation: give the tile text an id and pass it as `MmPressable describedBy`, or name the button from content. Acceptance: the row button's accessible description contains the portion line and kcal; a test with `toHaveAccessibleDescription(/200 g raw/)`.

**UX-9 — "Also on the label" fields are not marked optional; Calories sits below them.** Class: design improvement. Severity **low**. Remediation: "(optional)" or a helper, matching "Name (optional)" on the estimate step.

**UX-10 — At Simple the amount step still prints carbs and fat in two captions while the Logs line hides them.** Class: design improvement (MM-153 versus MM-49). Severity **low**. Remediation: owner choice; say which in MM-49 or MM-153.

## Sources and evidence
- W3C, "Accessible Name and Description Computation 1.2", Working Draft 12 October 2026, https://www.w3.org/TR/accname-1.2/, accessed 2026-10-20. Supports: step 2D returns the `aria-label` value, so content is not used for the name (UX-8).
- W3C WAI ARIA APG, "Button Pattern", https://www.w3.org/WAI/ARIA/apg/patterns/button/, date null, accessed 2026-10-20. Supports: `aria-pressed` marks a toggle; the label must not change with state (compliant here).
- W3C WAI APG, "Radio Group Pattern", https://www.w3.org/WAI/ARIA/apg/patterns/radio/, date null, accessed 2026-10-20. Recorded for the design-system owner; toggle-button groups are an accepted alternative; not a finding.

## Research
Status: **performed** (bounded): (1) whether `aria-label` on a button replaces its content as the name; (2) APG guidance on `aria-pressed` groups versus radio groups. WebFetch with known URLs; direct path.

## Confidence and limitations
Medium-high. High on control-flow findings (UX-1, UX-2, UX-4, UX-7, UX-8); medium on UX-3's test failure (not run) and on severity without a render. No render, device, screen reader or text-scale observation; no test executed.

## Acceptance criteria and edge cases
Existing criteria traced to `rawOrCooked.test.tsx`, `detailLevel.test.tsx`, `estimateMeal.test.tsx`; gaps: the raw-weighed fat path (UX-1), the Calories helper at Simple (UX-4), the chip path for an estimate (UX-7). Edge cases: a spoon chosen then "Weighed as" flipped; the raw food tapped first; Simple with Calories blank; an estimate whose name matches a pack food; 200% text with four fat chips; an entry typed at Simple then viewed at Full.

## Dependencies
react-capacitor: UX-1, UX-3, UX-8, `aria-labelledby` on groups. product-designer: UX-2 placement, UX-3 label, UX-9, UX-10. Nutrition/measurement via chair: Unresolved 1 and 2.

## Safety concerns
None clinical found. Question for the chair: the "Easy to miss" line is suppressed for an eating-disorder history; "Cooked with oil?" on the amount step is also a prompt to find more calories and is not covered by that rule in the ticket or code. Not a clinical judgement.

## Unresolved product decisions
1. Should a raw-weighed food with a cooked pair be offered "Cooked with oil?" (UX-1)? 2. Should an entry typed at Simple store carbs/fat as unknown rather than 0 (UX-5)? 3. At Simple, do captions keep stating carbs and fat (UX-10)?

## Verification
Nothing run (read-only). Requested of the edit owner: the story `AddFoodAmountCookedWithOil` through the stories test; a case in `detailLevel.test.tsx` asserting no caution at Simple; a case in `rawOrCooked.test.tsx` for Raw + 1 tsp butter logging two entries; renders at 200% text in three palettes for the chair's record.

## Targeted challenges
None; initial independent report.

---
Summary: two blocking findings (UX-1, UX-4); eight further findings, including a pre-existing screen-reader defect on every Food row (UX-8). No render was available; all evidence is source inspection plus three W3C sources.
