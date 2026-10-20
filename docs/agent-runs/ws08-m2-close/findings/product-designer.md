# Review: product-designer

Saved verbatim by the edit owner (the WS-08 logging agent) from the read-only panel-product-designer run of 2026-10-20 on `wt/logging` at 164d118 (the reviewer had no shell; the commit is recorded here). The reviewer read the tickets before the edit owner's Progress sections landed in 164d118, so PD-4's ticket quotations are of the earlier text.

## Scope and traceability
- Role: product-designer (review lens, `agents/roles/product-designer.md`). Reviewer: Claude subagent, read-only. Config read in full: `AGENTS.md`, `agents/roles/product-designer.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, `agents/templates/findings/role.md`.
- Brief: `docs/agent-runs/ws08-m2-close/brief.md`.
- Requirements inspected (full text): MM-167, MM-151, MM-152, MM-49, MM-150 (food-logging), MM-153 (food-database).
- Implementation inspected: `apps/mobile/src/food/FoodAmountStep.tsx`, `AddFoodSheet.tsx`, `FoodEntryTile.tsx`, `format/portionSummary.ts`, `format/extraNutrientsLine.ts`, `format/{cookingFatEntryName,cookingFatKindLabel,preparationLabel,quantitySourceLabel}.ts`, `domain/food/{CookingFat,CookingFatKind}.ts`, `domain/food/detail/DetailLevel.ts`, `domain/{macrosMatchEnergy,energyAgreesWithMacros}.ts`, `domain/food/micros/{MicronutrientGroup,Micronutrient}.ts`, `food/preparationOf.ts`, `food/MealChips.tsx`, `food/custom/CustomFoodForm.tsx` (150-256), `ui/{MmChoiceChip,MmSegmented,MmTextField}.tsx`, `ui/ui.css`, `app/app.css`, `food/food.css`, `gallery/screens/Food.stories.tsx` (1-175, 660-700, 880-1044), `gallery/screens/screenStory.tsx`, `charts/MacroSplitChart.tsx` (grep).
- Design rules: `design/screen-direction.md`, `design/visual-language.md`. `requirements/HANDOFF.md` 1-70.
- Tests inspected (source only, not run): `test/food/rawOrCooked.test.tsx` 140-205, `test/food/detailLevel.test.tsx` 85-192; grep across `apps/mobile/test` for the new strings.
- Render: **none.** Source inspection of the components and the stories' set-up only.

## Existing facts versus proposals
**Repository facts (source, with lines):**
- The "Which fat" row is `MmChoiceChip`s in `div.app-row.food-chips[role=group][aria-label="Which fat"]`, shown only when `oil !== 'none'`, usual fat preselected (`FoodAmountStep.tsx:355-362`). "Amount in" is `MmChoiceChip`s in `div.app-row[role=group]` (`:295-299`); `MealChips` the same; the typed form's "Unit" chips are `app-row food-chips` (`AddFoodSheet.tsx:548`). Same component, same classes.
- The "Per 100 g" caption is `p.app-caption.food-reference-line` (`FoodAmountStep.tsx:327`); the edit sheet's "Per serving" caption is the same classes (`AddFoodSheet.tsx:688-692`); `food.css:220-223` gives both the same margin.
- "Also on the label" is `p.food-label.food-label-spaced` over `div.food-extra-fields` (2-column grid), four dense `MmTextField`s (`AddFoodSheet.tsx:607-624`). The saved-food form uses the same grid inside `MmDisclosure "More nutrients (optional)"`, folded by default (`CustomFoodForm.tsx:210-229`). The Micros view already uses the heading "Also on the label" for sugars, saturated fat, cholesterol (`MicronutrientGroup.ts:4`, `Micronutrient.ts:34-36`).
- Logs line is `p.app-subhead.food-totals` and excludes the cooking fat (`FoodAmountStep.tsx:333-339`); the split includes it (`:376-387`); the fat caption is `app-caption food-reference-line` under the chips (`:363-367`).
- `offersOil = custom === undefined && food.preparation === 'cooked'` where `food` is the alternate when "Weighed as" is on the other state (`:147-149`).
- Row line: `portionSummary` appends ` raw`/` cooked` or `, as packaged` after the amount (`portionSummary.ts:41-49`); the tile prefixes the method unless the summary starts with it (`FoodEntryTile.tsx:27-29`). Extras line adds "Sugars N g · Saturated fat N g" at Full (`extraNutrientsLine.ts:21-24`).
- Recents subtitle "Your recent food · estimated · 900 kcal" (`AddFoodSheet.tsx:808`).
- At Simple the typed form hides Carbs g and Fat g (`AddFoodSheet.tsx:600-605`) but still computes `fromMacros` from protein alone, shows the placeholder "N from macros", and runs the mismatch warning (`:265-272, 319-322, 640-653`).
- Ticket state as read: MM-152 Progress ended at "Still not built: the user's own usual cooking fat"; MM-151 said "the last 20 distinct entries"; MM-49 said "Not built: sugars and saturated fat ... the add-food form following the level". None named a sibling for the new parts.

**Approved requirements relied on:** MM-49 "changes what is shown, never what is stored; Simple: calories and protein"; MM-151 "the entry says which state it is", "as packaged"; MM-152 "Cooked with oil?" adds the usual fat "as a separate entry"; MM-153 "what the food's label would show and nothing invented"; MM-150 "a small 'estimated' mark"; screen-direction rules 4 (one picture per fact), 9 (like its siblings, written reason for a different pattern), MM-218 (one "Logs" wording), MM-292 (a state no story draws is a defect).

## Audit coverage
- Mode: **change**. Walked (source only): (a) rice weighed, raw/cooked switch, teaspoon of fat; (b) a typed food at Simple and at Full. Surveyed: the row lines (`FoodWeighedRaw`, `FoodFullLabelLines`), the recents row, the remembered-raw opening, the branded amount step.
- Not inspected: `BarcodeScanStep`, `FoodSearchResults`, `src/foodCatalog/` beyond `FixturePack`, `src/foodPipeline/`, Settings, `MacroSplitChart` internals, the repositories, migration 14 to 15, the domain tests.
- Evidence methods: source reading; grep. No test run, no render, no device.

## Novice mobile experience
**Goal (a):** log 200 g of rice weighed raw, cooked in a teaspoon of butter. **Goal (b):** type a protein shake at Simple; type a granola at Full. The heading says which food will be logged; the Logs line (heading weight) says what Log it records; the small captions qualify. The "Weighed as" consequence caption and "about 34 kcal" are the uncertainty words, correctly caption-weight. With a spoon chosen there are five stacked controls before the meal chips; each appears only when it applies (source observation, not a measured burden). The one evidenced hierarchy problem: the heaviest text (Logs) and the chart's caption give different kcal figures once a fat is chosen (PD-2).

### Task walkthrough (source only; no render)
**(a) Rice weighed raw with butter**
1. Tap "White rice, cooked". Sees headline, trust mark, grade, "Amount in" chips. Tap Grams: "Weighed as" [Cooked | Raw] appears with "100 g cooked is about 130 kcal. 100 g raw is about 365 kcal." Passes.
2. Type 200: consequence and Logs update; "Per 100 g: 130 kcal · 3 g protein · 28 g carbs · 0 g fat" between field and Logs line. Passes.
3. Tap Raw: headline "White rice, raw", lines change. Passes for the switch. **Fails for the task:** "Cooked with oil?" is no longer drawn because `offersOil` reads the raw food; the person weighing raw rice they will cook in butter cannot add the butter here. PD-10.
4. (Cooked kept) tap "1 tsp": "Which fat" chips appear, usual one checked, caption "Adds cooking oil as its own entry: about 40 kcal · 4 g fat". Tap Butter: "Adds butter as its own entry: about 34 kcal · 4 g fat". Passes for which fat and that it is a second entry. **Partial fail on which value is kept:** the Logs line still says "Logs 205 kcal · 4 g protein ·…" and the split's caption says "239 kcal from food macros". PD-2.
5. Tap Log it: two rows in the meal (code path only).

**(b) Typed food at Simple**
1. Enter manually: Food name, method chips, Servings eaten, "Nutrition per serving", a single full-width dense "Protein g", "Includes alcohol?", "Calories per serving" with "Leave blank to calculate from macros." The single Protein field reads deliberate.
2. Type Protein 30, Calories 200: Logs "Logs 200 kcal · 30 g protein". **Fails:** the Calories field shows placeholder "120 from macros" and, after typing, the caution helper "Macros add up to 120 kcal; the 200 typed is kept. Double-check the label." A person who cannot see Carbs or Fat has nothing to double-check and the warning fires on every honest entry. If they obey "Leave blank", the entry logs 120 kcal for a 200 kcal shake. PD-1.
**(b') Full:** "Also on the label" and four dense fields after the three macro fields; Logs line with carbs and fat; split drawn. Passes (PD-4 for the written reason, PD-9 for the name).

## Findings
No **blocker** findings. One high.

**PD-1 — Simple typed form: "from macros" hint and mismatch caution fire with carbs and fat hidden.** Class: reproducible implementation defect (by source inspection). Severity **high**. Confidence high (`energyAgreesWithMacros.ts:27-32`, `AddFoodSheet.tsx:265-272, 319-322, 640-653`). Expected: at Simple no "N from macros" placeholder, no mismatch helper, and calories required. Observed: placeholder and caution on the test's own happy path (`detailLevel.test.tsx:99-118` does not assert on the helper). Remediation: when `!showsCarbsAndFat`, (1) require calories, (2) suppress `hint` and the mismatch check, (3) helper neutral or none. Acceptance: at Simple, protein 30 and calories 200 show no caution and no placeholder; blank calories keeps Log it off with "Still needed: calories." Needs a BUG ticket and a regression test.

**PD-2 — Logs line, split and fat caption disagree once a fat is chosen.** Class: usability problem found by inspection. Severity **medium**. Rule: screen-direction rule 4, MM-218. Observed: Logs excludes `oilTotals`; the split includes it and prints "N kcal from food macros". Remediation (one of): (i) the split follows the Logs line and excludes the fat, since the words say "as its own entry" and the fat gets its own row, or (ii) the Logs line states both. Acceptance: with 1 tsp butter chosen, every kcal figure on the step is the food's, the butter's, or labelled as their sum.

**PD-3 — ", as packaged" row state has no story and no test.** Class: documentation/requirement gap (MM-292). Severity **medium**. Remediation: a `FoodScreen` story with a label-serving entry carrying `preparation: 'packaged'`, and a test line beside `rawOrCooked.test.tsx:160`.

**PD-4 — Tickets do not record the new parts, their siblings or the one different pattern.** Class: documentation gap. Severity **medium**. "Also on the label" is drawn inline under a label where the sibling folds the same grid in `MmDisclosure`; inline is defensible but the reason must be written. Remediation: Progress and Decisions in MM-152, MM-151, MM-49, MM-150; `## UI/UX` story links.

**PD-5 — At Simple the reference caption states carbs and fat the level hides.** Class: design improvement. Severity **low**. Remediation: the reference line follows the level on the amount step and the edit sheet alike, or a sentence in MM-49 saying the source statement is always whole. Same for "· 4 g fat" in the fat caption at Simple.

**PD-6 — "Per 100 ml" on the edit sheet, "Per 100 mL" on the amount step and the row.** Class: implementation defect. Severity **low**. Remediation: "mL" everywhere; one shared label so the sibling and the new part cannot drift.

**PD-7 — "Cooked with oil?" answered with Butter or Ghee.** Class: design improvement (copy). Severity **low**. Alternatives: keep, or "Cooked in oil or butter?". Decision authority: owner.

**PD-8 — A remembered Raw start changes the headline with no sign why.** Class: design improvement; referred to ux-accessibility. Severity **low**. Option: the consequence caption gains "Raw, as last time." when remembered.

**PD-9 — "Also on the label" names two different sets.** Class: design improvement. Severity **low**. Micros view: sugars, saturated fat, cholesterol; typed form: fiber, sugars, saturated fat, sodium.

**PD-10 — Weighing raw removes "Cooked with oil?".** Class: usability problem found by inspection. Severity **medium**. Confidence high (`FoodAmountStep.tsx:147-149`). Policy is product's (MM-152 is silent on state); presentation effect either way: a control should not appear and disappear with the segmented beside it without the ticket saying so.

**Siblings, weight and words:** "Which fat" is the "Amount in"/"Unit"/"Meal" chip pattern exactly; the caption is the edit sheet's "Per serving" line; the grid is the saved-food form's, the fold is not (PD-4). Nothing is over-weighted. The words are the domain's own; "Cooked with oil?" is the only strain (PD-7). Simple reads deliberate on the amount step and the form's single Protein field; the Calories field's placeholder and caution do not (PD-1).

## Sources and evidence
None external consulted. All claims cite repository files above.

## Research
Status: **unnecessary**. Every finding is against the repository's own rules or arithmetic in the source.

## Confidence and limitations
High for PD-1, PD-2, PD-6, PD-10 (deterministic from source). Medium for PD-3 (grep-based absence), PD-5/7/8/9 (judgement). No render in any palette: spacing, wrap of the four fat chips at 360 dp, caption legibility, and the row line's wrap at large text are **unverified**. Single reviewer; no observed users.

## Acceptance criteria and edge cases
Existing tests pin the reference line, the fat caption, the Simple Logs line, Simple/Full fields and the row extras, the recents subtitle. Gaps: no assertion that the Simple form shows no caution (PD-1); none for ", as packaged" (PD-3); none that split and Logs agree with a fat (PD-2). Edges: Simple with calories blank; a pair weighed raw with a spoon chosen then the state flipped (`oil` state retained but not logged); largest text size on the row line.

## Dependencies
ux-accessibility: PD-2 (which figure a reader lands on via `describedBy`), PD-8, PD-10, chip group names. product/owner: PD-7, PD-10 policy, PD-5. react-capacitor: PD-1 fix and regression test, PD-6 shared label.

## Safety concerns
None found beyond PD-1's understated calories when Calories is left blank at Simple (data quality, not clinical).

## Unresolved product decisions (bounded chair request)
1. May a food weighed **raw** add its cooking fat? (PD-10.) 2. Does the split preview include the cooking fat, or does the Logs line? (PD-2.) 3. Does the reference caption follow the detail level or always state the label whole? (PD-5.) 4. Wording "Cooked with oil?" when the fat is butter or ghee (PD-7).

## Verification
Nothing run (read-only role). Recommended: the detail-level and raw/cooked tests after PD-1 and PD-2, `npm run unseen` after the PD-3 story, Storybook in three palettes for the new stories at 360 dp and largest text.

## Targeted challenges
None; initial independent report.
