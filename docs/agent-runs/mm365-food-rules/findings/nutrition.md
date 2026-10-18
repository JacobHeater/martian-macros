# Review: nutrition

## Scope and traceability
- **Role:** nutrition and body composition (panel read-only lens, no credential claimed). One subagent session, single pass; not independent personnel.
- **Run:** `docs/agent-runs/mm365-food-rules/brief.md`. **Branch:** `spec/food-insights-and-snooze`, HEAD f2e8dfe. **Hashes:** not computed; the chair records them.
- **Canonical inputs:** `AGENTS.md`, `agents/roles/nutrition.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, the findings template.
- **Requirements inspected:** MM-365 (subject), MM-362, MM-378, MM-141, MM-144, MM-108, MM-125, MM-121, MM-150, MM-167, MM-370, MM-369; HANDOFF by search.
- **Code inspected:** `domain/FoodEntry.ts`, `QuantitySource.ts`, `macrosMatchEnergy.ts`; `domain/food/portion/{Portion,PortionUnit,FoodOrigin,NutritionBasis,ReferenceNutrition,ReferenceBasis,gramsFor,scaleNutrition,unitsOffered}.ts`; `domain/food/custom/{CustomFood,CustomFoodKind,recipePerServing,recipeServingGrams}.ts`; `domain/food/hand/HandModel.ts`; `domain/food/estimate/estimateMeal.ts`; `domain/food/CookingFat.ts`; `domain/food/micros/Micronutrient.ts`; `domain/repositories/{RecentFoodReader,FoodDayReader}.ts`; `foodCatalog/{CatalogServing,CatalogServingLookup,CatalogFood,FoodPack,SqliteFoodPack,FixturePack,PackMicronutrient}.ts`; `foodPipeline/candidateFromRow.ts`, `foodPipeline/node/extract.sql`; `food/{FoodAmountStep.tsx,AddFoodSheet.tsx,AmountChoice.ts}`; `engine/{ProteinTargets,SafetyBounds,findInsights,InsightRule,ProteinSpreadRule,ItemInsight,ItemInsightKind,itemInsightKinds,allowedItemInsights,InsightSafeguards,volumeJumpInsights}.ts`; the stories (40-136), `draftInsightKinds.ts`; `test/engine/evidenceRegister.test.ts`, `test/engine/itemInsightEvidence.test.ts`.
- **Other inputs:** `docs/evidence.md`; the mm366 decision and reports; the mm361 decision.

## Existing facts versus proposals
**Repository facts:**
1. A food entry stores totals (`kcal`, `proteinG`, `carbsG`, `fatG`, optional `fiberG`, `sodiumMg`, `alcoholG`), a `source`, scaled `micros` (saturated fat when the pack states it) and an optional `Portion` (`FoodEntry.ts:26-75`). `alcoholKcal` is 7 kcal/g.
2. A `Portion` carries `method`, `basis`, `quantity`, `unit`, a `reference` (`ReferenceNutrition`: per100g/per100ml/perServing, `servingDescription`, `servingGrams`, `servingMilliliters`, `servingUnit`, `densityGPerMl`), an `origin` and, for hand units, `impliedGrams`.
3. When a pack food is logged, the reference's serving fields are filled only from the serving the person chose; logging by gram leaves them undefined (`FoodAmountStep.tsx:145-152`). The pack's own servings are reachable only through `CatalogServingLookup.servingsOf` (async), never from the entry.
4. Branded sources carry one serving, the label's (`extract.sql:64-69, 102-104`); generic USDA foods carry every household measure, none marked usual (`:179-191`). A `CatalogFood` has no category.
5. Custom foods have `servingDescription` and optional `servingGrams`; a recipe's serving weighs cooked weight / servings.
6. Typed foods: `labelServing` with a servings count scales a per-serving reference; other methods record entered totals; Estimate (`quickAdd`) has no quantity. Macros left blank parse as 0 and an entry is valid with calories alone (`AddFoodSheet.tsx:228-235, 265-270`). Estimated "rich" meals are 50% fat.
7. Hand units are counts converted through `HandModel` ("This is judgement, not measurement").
8. Protein targets: minimum 1.6 g/kg when lifting, 1.2 otherwise; kidney cap sets minimum and target to `capGPerKg × weightKg` (`SafetyBounds.ts:128-167`). `proteinByMeal` uses `ProteinSpreadRule.almostNoneG = 10` g.
9. Only `volumeJump` is in `itemInsightKinds`; the food kinds are design drafts.
10. The evidence test requires a row for every kind id and every key of a rule-constants object.
11. The story's peanut butter: 190 kcal, 7 g protein, 7 g carbs, 16 g fat, `labelServing`, no portion; the garlic-bread example has no portion data from which "usual serving" could be worked out.
12. MM-362 still quotes "or a smaller portion".
13. `docs/evidence.md` has no row for any food rule, figure, or "usual serving".

**Proposals:** everything under Findings, the rows and the criteria.

## Audit coverage
Mode `change`. Methods: source inspection, arithmetic on fixture-pack and story figures, web research. Not inspected: `energyAgreesWithMacros` tolerance; the SQL food repository; `design/voice-and-wording.md`; rendered stories; the real pack's coverage of `saturated_fat_g`. Absent: no food rule, no "usual serving" concept, no food category or RACC data. Referrals: safety (NU-3, NU-6), coaching (NU-1, NU-2, NU-7 words), react-capacitor/data (NU-5), food-pipeline (NU-2 b, NU-5).

## Novice mobile experience (when UX/product design is assigned)
Not assigned.

## Findings

### NU-1: "Mostly fat" fires on protein-dense whole foods and then says something false
**Blocker**, confidence high. Fat share = 9 × fat / kcal on typical values: whole egg 60%, firm tofu 56%, cheddar 74%, cooked salmon 52% (fattier crosses 55%), lean beef 54%. Three eggs get "A leaner choice leaves more room for protein" while carrying 35% of their calories as protein. The AMDR for fat (20–35%) is a daily range, not a per-food test; protein foods are high in fat share because they have no carbohydrate. **Change:** a protein guard: no "mostly fat" when protein supplies ≥ 20% of the item's calories (`FoodInsightRule.proteinDenseShare = 0.20`). Eggs, cheese, tofu, fish, meat are left alone; nuts (almonds 14.5%), peanut butter (17%), avocado, oils, butter, cream, pastry still qualify.

### NU-2: "Mostly fat" still fires on nuts, nut butters, olive oil and avocado, which guidance treats as foods to include; the data cannot tell them apart
Severity **high**. 30 g of almonds, 2 tbsp of peanut butter (the owner's example), half an avocado and 2 tbsp of olive oil all qualify. Nut intake associates with lower cardiovascular disease and mortality (Aune 2016); nut-feeding trials show no weight gain (Xia 2020 for pistachios). `CatalogFood` has no kind; typed foods have none. Energy density does not help (nuts and oils are the densest foods). **Options (owner):** (a) a saturated-fat-aware trigger (fire only when saturated fat is ≥ a third of fat, or unknown on a packaged or typed food): olive oil, almonds, avocado and peanut butter stop firing; **the owner's peanut-butter example no longer fires**; (b) keep total fat share and add a food kind to the pack (new pipeline ticket), exempting nuts, seeds, nut butters, oils and avocado by kind; typed foods still fire; (c) keep as drafted with fact-only words. Recommendation: (a) if the owner accepts losing the example; otherwise (b).

### NU-3: "Light on protein" tells people with a kidney cap, or with no targets, to add protein toward a minimum that is a ceiling or does not exist
Severity **high**, confidence high. With CKD, minimum = target = the cap, exceeding it flagged with a care-team note (MM-121); after bariatric surgery no minimum exists. **Change:** fire only when a protein minimum is in force and is not a kidney cap. Criteria: kidney answer ticked → no line; no targets → no line.

### NU-4: No definition of "calories from fat/protein"; misfires on typed entries with blank macros and label-rounded items
Severity **high**. A 450 kcal typed curry with no macros reads as 0 g protein; olive oil is 102% fat by 9 × fat / kcal; alcohol entries undefined at kcal ≤ 0. **Change:** fat share = min(1, 9·fat/kcal); protein share = 4·protein/kcal; undefined at kcal ≤ 0; composition rules run only when 4P + 4C + 9F + 7A ≥ 75% of kcal (`knownMacrosShare = 0.75`) and never for `quickAdd`.

### NU-5: "Large portion" has no computable "usual serving" for most entries; redefine the trigger by origin
Severity **high**. By origin: branded pack food logged by its serving: yes (the label serving, from FDA reference amounts "customarily consumed per eating occasion", 21 CFR 101.12), ratio = `quantity`; branded logged by gram: no serving on the entry; generic USDA: no ("1 cup" is a measure, not what people eat); custom food and recipe: yes, the person's own serving; typed label serving: yes, the typed serving; typed totals, hand portions, estimates, legacy entries: no. **Change:** define `usualServing(entry)` in the domain (one declaration); fire only when defined: `quantity ≥ 2` for serving-counted entries and ≥ 300 kcal. Generic foods get no line until a reference amount reaches the pack. Hand units never qualify. The evidence names the serving compared against.

### NU-6: The premise (twice the usual serving suggests an entry error) is judgement, and 2× is ordinary eating for many foods
Severity **medium**. People under-estimate large meals (Wansink and Chandon 2006); energy-dense portions are over-estimated by 20–50% in a lab study (Almiron-Roig 2013). At 2× the line will mostly meet real eating. **Change:** keep 2× only for serving-counted entries; also fire on an implausible count alone (≥ 10 servings), which is the typo the rule can genuinely catch; 300 kcal floor fine.

### NU-7: "Light on protein" fires on drinks and on alcohol
Severity **medium**. Two thirds of a bottle of wine (400 kcal) or a litre of cola gets a protein prompt; so do plain staples (2 cups of rice at 8.3%). **Change:** no line when alcohol supplies ≥ half the calories (`alcoholShare = 0.5`); drinks and staples cannot be told apart without a kind; the words stay about adding to the meal.

### NU-8: The protein figures are coherent with the app's rules but are not from evidence
Severity **low**. 10% is the AMDR lower bound for the day's energy; 10 g at 400 kcal matches MM-125's "almost none". Per-meal synthesis breakpoints (0.24 g/kg young, 0.40 older; 0.4 g/kg over four meals) are far above, so the rule is a weak floor, which suits MM-144. Register as judgement.

### NU-9: Evidence rows missing for every rule and figure
Severity **medium** (blocks the build mechanically). Rows, all Checked = No:

| Name | Value | Where | Decides | Source | Grade | Population |
|---|---|---|---|---|---|---|
| `mostlyFat` | entry ≥ 150 kcal, ≥ 55% of calories from fat and under 20% from protein; not for estimates or entries whose macros do not explain their energy | engine foodItemInsights.ts | whether the coach says most of an item's calories are fat | no guideline tests one food's fat share; the AMDR 20–35% is daily (Health Canada 2025); nuts, oils and avocado meet it although guidance includes them (Aune 2016) | judgement | adults; off with an eating-disorder history |
| `FoodInsightRule.mostlyFatShare` | 55% | engine | how much of an item must be fat | judgement, above the AMDR ceiling | judgement | none |
| `FoodInsightRule.mostlyFatMinKcal` | 150 kcal | engine | the smallest item spoken about | judgement | judgement | none |
| `FoodInsightRule.proteinDenseShare` | 20% | engine | a protein food is never called "mostly fat" | judgement inside the protein AMDR | judgement | none |
| `FoodInsightRule.knownMacrosShare` | 75% | engine | a composition line needs the macros to explain the energy | judgement | judgement | none |
| `lightOnProtein` | entry ≥ 400 kcal with under 10% of calories from protein; a protein minimum in force, not a kidney cap; alcohol under half; not for estimates | engine | whether the coach says an item is light on protein | the AMDR lower bound (Health Canada); 10 g at 400 kcal matches MM-125; per-meal breakpoints (Moore 2015; Schoenfeld and Aragon 2018) are not the trigger | judgement | adults with a protein minimum |
| `FoodInsightRule.lightOnProteinShare` | 10% | engine | how little protein counts as light | the AMDR lower bound by judgement | judgement | adults |
| `FoodInsightRule.lightOnProteinMinKcal` | 400 kcal | engine | the smallest item spoken about | judgement | judgement | none |
| `FoodInsightRule.alcoholShare` | 50% | engine | a mostly-alcohol drink gets no protein line | judgement | judgement | none |
| `largePortion` | entry ≥ 2× its usual serving and ≥ 300 kcal, or ≥ 10 servings; only where a usual serving exists | engine | whether the coach asks if an amount was entered right | 21 CFR 101.12 reference amounts; the error premise is judgement (Wansink and Chandon 2006; Almiron-Roig 2013) | judgement | US adults; off with an eating-disorder history |
| `FoodInsightRule.largePortionRatio` | 2 | engine | how far above the usual serving counts | judgement | judgement | none |
| `FoodInsightRule.largePortionMinKcal` | 300 kcal | engine | the smallest item asked about | judgement | judgement | none |
| `FoodInsightRule.largePortionMaxServings` | 10 | engine | a count that is almost surely a typo | judgement | judgement | none |
| `usualServing` | the label serving of a branded food; the saved serving of a custom food or recipe; the typed serving of a label-serving entry; none otherwise | domain food/portion/usualServing.ts | what "usual serving" means | 21 CFR 101.12; a person's own serving is their own; USDA measures are measures | moderate (branded), judgement (the rest) | US packaged foods |

### NU-10: Ticket and story inconsistencies
Severity **low**. MM-362's "or a smaller portion"; "spread" vs "choice"; the basis/priority columns; the garlic-bread example cannot be computed from the story's data: the story should log it with a label-serving portion so the real engine draws it.

## Sources and evidence
All accessed 2026-10-18.
1. Health Canada, "Dietary reference intakes tables: Reference values for macronutrients", updated 2025-11-19. AMDR carbohydrate 45–65%, protein 10–35%, fat 20–35%; protein RDA 0.80 g/kg/day.
2. 21 CFR § 101.12 (LII), last amendment 81 FR 34041 (2016). Reference amounts customarily consumed per eating occasion; nuts 30 g, nut butters 2 tbsp, cheese 30 g, oil 1 tbsp, avocado 50 g, bread 50 g, cooked rice or pasta 140 g.
3. Aune D et al., *BMC Medicine* 14:207, 2016. Per 28 g/day nuts: RR 0.79 CVD, 0.78 all-cause mortality; observational.
4. Schoenfeld BJ, Aragon AA, *JISSN* 15:10, 2018. About 0.4 g/kg per meal over at least four meals.
5. Moore DR et al., *J Gerontol A* 70(1):57–62, 2015. Breakpoints 0.24 g/kg young, 0.40 older men.
6. Almiron-Roig E et al., *Appetite* 71:95–103, 2013. 32 adults; energy-dense portions over-estimated 1.2–1.5×.
7. NHS, "Food labelling terms", reviewed 2026-06-30. High fat > 17.5 g/100 g; saturated fat high > 5 g/100 g.
8. Xia K et al., *Medicine* 99(34):e21136, 2020. 11 RCTs of pistachios: no significant weight change.
9. Cornell Chronicle, 2006-11-01, on Wansink and Chandon 2006: estimation accuracy declined as meals grew larger.
Not opened: Flores-Mateo 2013; Chandon and Wansink abstract; Dietary Guidelines 2020–2025; Rolls 2009; Volumetrics bands; eCFR copies.

## Research
Status: performed, with gaps. Questions: per-item fat share as a test and nuts/oils/avocado; 10% protein at ≥ 400 kcal; "usual serving" and the 2× premise; energy-density bands. WebSearch (10) and WebFetch (about 20, 9 successful), direct.

## Confidence and limitations
High on NU-1, NU-3, NU-4, NU-5, NU-9, NU-10; medium on NU-2's remedy, NU-6, NU-7. Fixture-pack compositions are rounded; no render; no tests; no hashes; no clinician review.

## Acceptance criteria and edge cases
Existing traced: the owner's example passes NU-4's definition and needs protein under 20%; "Protein" needs a minimum in force; "Two rules" relies on table order; "Estimated entries" (`quickAdd` only; NU-4 adds blank-macro typed entries). Proposed: tofu not "mostly fat"; calories only → no composition line; olive oil shows 100%; kidney cap → no protein line; mostly alcohol → none; generic rice by weight → no portion line; 2 palms of chicken → none; 100 servings → a line whatever the calories. Edge cases: legacy entries with no `Portion`; edits; a recipe with no cooked weight; a cooking-oil companion entry; unit changes; seniors; vegan logs.

## Dependencies
safety (NU-3, NU-6, NU-2); coaching (NU-1, NU-2, NU-7 words; per-meal pressure); data (NU-5 storage or lookup); food pipeline (NU-2 b, NU-5). Interfaces: `FoodEntry`, `Portion`, `ReferenceNutrition`, `CatalogServingLookup`, `DailyTargets.proteinMinimumG`, `CoachingPolicy`, `ItemInsight`, `itemInsightKinds`. MM-370: a C-graded peanut butter and a "mostly fat" line on one row say two things about one food.

## Safety concerns
A protein push under a kidney cap (NU-3). "Mostly fat" under eggs, fish, cheese, nuts and oil discourages foods guidance includes; near a fat floor repeated lines could push fat too low. "Large portion" at 2× will often comment on real portions. Not clinical clearance.

## Unresolved product decisions
1. NU-2: saturated-fat-aware trigger, a food kind in the pack, or fact-only words. 2. NU-5/NU-6: generic foods out until a reference amount exists; 2× versus 3× by weight. 3. NU-5: store the usual serving or resolve it in state. 4. NU-3: under a kidney cap, no line or fact-only. 5. NU-8: absolute floor or scaled. Authority: product owner.

## Verification
Source inspection only. Requested: engine tests per criterion; the evidence test with a `FoodInsightRule` object; the words test extended; a story logging the three example foods with real portions; `mm req`; `mm check`.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** Blocking: NU-1, NU-3, NU-4, NU-5, NU-9. Needing a ruling: NU-2 and NU-6. NU-7, NU-8, NU-10 before ship.
