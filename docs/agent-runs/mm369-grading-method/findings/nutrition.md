# Review: nutrition

## Scope and traceability
- Role: nutrition (lens, not a credential). Read-only subagent for the chair's run `docs/agent-runs/mm369-grading-method/`. Branch `spec/food-insights-and-snooze`, HEAD f2e8dfe. Hashes not computed; the chair records them.
- Requirements read: MM-369, MM-370, MM-371, MM-361, MM-310, MM-307. Brief and the canonical role, protocol, contract and template files read in full.
- Code read: `foodCatalog/CatalogFood.ts`, `PackMicros.ts`, `PackMicronutrient.ts`, `PreparationState.ts`; `domain/food/custom/CustomFood.ts`, `RecipeIngredient.ts`; `domain/food/micros/Micronutrient.ts`, `Micronutrients.ts`; `domain/food/portion/NutritionTotals.ts`, `Portion.ts`, `ReferenceNutrition.ts`, `NutritionBasis.ts`, `FoodOrigin.ts`, `PortionUnit.ts`; `domain/FoodEntry.ts`; `food/FoodGrade.tsx`, `FoodGradeLetter.ts`, `FoodGradeValue.ts`; `coach/InsightPreview.ts`; `foodPipeline/node/extract.sql`; `test/engine/evidenceRegister.test.ts`; `docs/evidence.md`; `requirements/HANDOFF.md`.

## Existing facts versus proposals
- A pack food is per 100 g with `kcal`, `proteinG`, `carbsG`, `fatG` required and `fiberG`, `sodiumMg`, `alcoholG` optional; `micros` is a partial record ("a nutrient left out is unknown") whose thirteen micronutrients include `sugars`, `saturatedFat`, `cholesterol`. The only category-like data are `name`, `brand`, `preparation` and `source`/`sourceId`. No fruit/vegetable/legume share, no added sugars, no food category.
- The pipeline takes fiber (USDA 1079), sodium (1093), total sugars (2000 else 1063), saturated fat (1258), and from Open Food Facts `fiber_100g`, `sodium_100g × 1000`, `sugars_100g`, `saturated-fat_100g`. Plausibility caps drop a value, never the food (MM-307).
- A custom food is per serving with `fiberG` and `micros` when stated and `servingGrams` optional. A recipe's `micros` are none by design; a `RecipeIngredient` stores four macros only, so a recipe carries no fiber, sugars, saturated fat or sodium.
- A `FoodEntry` carries `fiberG`, `sodiumMg`, `alcoholG` and `micros` scaled to the amount eaten ("Undefined means not known, never zero"). Per-100 g values must be recovered by dividing by grams eaten or by looking the origin food up again (`Portion.origin`).
- MM-310 and MM-307 bind "missing is never zero". MM-371 binds "a nutrient-profile measure with a published basis, never a moral word".
- The design seam exists: `FoodGradeLetter` (twelve steps), `FoodGradeValue` (`graded | ungradable(reason)`), `FoodGrade.tsx` with "A grade for the food itself, per 100 g…". No engine grading function exists.
- Owner rulings (MM-370): A+ to D-, universal, per 100 g; question mark with a popover naming what is missing; shown with an eating-disorder history; no switch; meal and day = calorie-weighted average of graded entries' scores, question mark under 70% calorie coverage; computed, not stored.
- `evidenceRegister.test.ts` scans six named files by regex; no pattern for a grade file yet.

Proposals are in Findings and Recommendation.

## Audit coverage
Mode `domain` (planning spike). Inspected the food data shapes across pack, custom, recipe, entry and portion; the pipeline's extraction; the design seam; the register and its test. Not inspected: SQL repositories and schema; the pack build report and `coverage.txt` (the chair measures coverage); MM-365's catalogue; USDA `food.csv` columns. Absent: no grading engine. Referrals: coaching and safety (presentation; the eating-disorder decision), food-database (a category column). Methods: source inspection; WebSearch and WebFetch directly. Blocked: every PDF/DOCX (binary). No test run.

## Novice mobile experience (when UX/product design is assigned)
Not assigned.

## Findings

**NU-1. Without the fruit/vegetable/legume (FVL) component, whole fruit cannot reach the letter the published method gives it.** Severity high, confidence high. FVL is worth 0/1/2/5 points at >40/>60/>80%. Apple: score 3 → B- here, A with FVL; banana 4 → C+ here, A with FVL; grapes → C+. Vegetables mostly keep their letter; legumes unaffected. **Remediation:** ship with the deviation stated in How-this-works and the register (`foodGrade.fvlOmitted`); open a food-database ticket for a `category` column (USDA food category / OFF `categories_tags`) enabling an FVL proxy and the category tables.

**NU-2. Drinks graded on the general-foods table are over-graded.** Severity high, confidence high. The beverage table is much stricter (only water is A). A cola scores 3 → B- here (published: E); orange juice → B (published: about C). The app has no drink flag; `densityGPerMl` is not a drink proxy. Remediation: as NU-1; the owner should see the cola example before deciding.

**NU-3. The other category rules cannot be applied without a category.** Severity medium. Cheddar 22 → D- (published D); 85% ground beef 2 → B (published C); almonds 6 → C (published about A on the fats/nuts table); olive oil 20 → D- (published B); butter D/D- (published E). My arithmetic on the fats table gives olive oil C against CRESS's stated B; the 2022 report PDF could not be opened. Do not implement the fats table until verified (NU-6).

**NU-4. MM-370 lacks scenarios the method needs.** Severity medium. (a) a drink above 1.2% alcohol is outside the method's scope (without a rule, beer scores 0 → A); (b) a recipe is always ungradable today; (c) an entry whose grams cannot be derived is ungradable with its own reason; (d) the meal/day mean's rounding (half up on the integer score) and that ungradable entries count toward the 30% uncovered.

**NU-5. The grade is not a Nutri-Score and must not be presented as one.** Severity medium, confidence medium (the Conditions of Use PDF not readable). Verified: the logo is a Community collective mark at EUIPO (§ 4a LMIDV); Santé publique France grants use free of charge to registered companies committing to label all products of the brand, under Conditions of Use (March 2025) and a Graphic Charter; the SPF page says nothing about apps or third parties. EUTMR Art. 14 limits the mark against descriptive or referential use in honest practice. **Interpretation:** the badge, its label and the popover must never say "Nutri-Score"; no five-letter A–E ribbon, no green-to-red ramp, no logo; never "has Nutri-Score B". The current design (one letter with +/−, categorical fills, no red, no E) is already distinct. One referential sentence in How-this-works naming the method, stating the differences and disclaiming registration is the kind of use Art. 14 contemplates. The chair reads `march2025CoU_EN.pdf` before the copy is final; the owner decides whether to email SPF.

**NU-6. The point tables come from Open Food Facts' `Nutriscore.pm` (secondary) and agree with the German Wikipedia table; the official FAQ V11 PDF could not be read.** Severity medium. Before shipping, verify each threshold, the strict ">" and the olive-oil discrepancy.

**NU-7. `evidenceRegister.test.ts` scans only six files; the grading constants need a pattern.** Severity low.

**NU-8. What the grade measures and what the coach says may conflict.** Severity medium. Nutrient-dense but energy-dense foods (nuts C, olive oil D-, cheese D-, peanut butter D-) grade below white rice (B+) or cola (B-). Referral: coaching to check MM-365's lines against these grades; the grade is explained as "the food per 100 g, by energy, sugars, saturated fat, salt, fiber and protein", never "healthy/unhealthy".

## Recommendation

### R1. Method
Adopt the **Nutri-Score 2023 general-foods algorithm** as the score, applied to every food as a general food, with the deviations in R6 documented. Its 2023 revision made the FVL component purely additive, so a missing FVL costs a bounded 0–5 points; the UK NPM gates protein on FVNS and HSR needs FVNL and a category. Its predecessor score is associated, as a dietary index, with all-cause mortality (HR 1.07, 95% CI 1.03–1.10; EPIC, n = 501,594; Deschasaux 2020) and cancer (HR 1.07; Deschasaux 2018): association in adult European cohorts, not validation of a single food's grade. Its inputs are what the pack carries.

### R2. Inputs and units (per 100 g)
Energy kJ = kcal × 4.184; sugars g; saturated fat g; salt g = sodium mg × 2.5 / 1000; fiber g; protein g; alcohol g. For a custom food, per serving ÷ `servingGrams` × 100; a recipe cannot be graded (no fiber, sugars, saturated fat or sodium on ingredients); a logged entry is graded from its origin food when it resolves, else by dividing its amounts by grams eaten (weight units; volume × density; servings × `servingGrams`; hand `impliedGrams`; none for an estimate or an entered-totals entry without a weight).

**Required** (no grade without them): sugars, saturated fat, sodium, fiber (energy and protein are always present). The reason names every missing one in that order. **Not used:** carbohydrate, total fat, cholesterol, vitamins and minerals. **Alcohol:** `alcoholG > 1.2` → ungradable "Alcoholic drinks aren't graded"; undefined alcohol is "not stated" and the food is graded. **Estimate** → "Estimated, so not graded." **Recipe** → "Recipes can't be graded yet". **No grams** → "The amount in grams isn't known".

### R3. Point tables (strict "greater than"; no rounding of inputs)
Negative points N (max 55):

| Points | Energy kJ > | Sugars g > | Saturated fat g > | Salt g > (sodium mg >) |
|---|---|---|---|---|
| 1 | 335 | 3.4 | 1 | 0.2 (80) |
| 2 | 670 | 6.8 | 2 | 0.4 (160) |
| 3 | 1005 | 10 | 3 | 0.6 (240) |
| 4 | 1340 | 14 | 4 | 0.8 (320) |
| 5 | 1675 | 17 | 5 | 1.0 (400) |
| 6 | 2010 | 20 | 6 | 1.2 (480) |
| 7 | 2345 | 24 | 7 | 1.4 (560) |
| 8 | 2680 | 27 | 8 | 1.6 (640) |
| 9 | 3015 | 31 | 9 | 1.8 (720) |
| 10 | 3350 | 34 | 10 | 2.0 (800) |
| 11 | — | 37 | — | 2.2 (880) |
| 12 | — | 41 | — | 2.4 (960) |
| 13 | — | 44 | — | 2.6 (1040) |
| 14 | — | 48 | — | 2.8 (1120) |
| 15 | — | 51 | — | 3.0 (1200) |
| 16–20 | — | — | — | 3.2, 3.4, 3.6, 3.8, 4.0 (1280 … 1600) |

Positive points P (max 12 without FVL): fiber > 3.0/4.1/5.2/6.3/7.4 g (5 pts); protein > 2.4/4.8/7.2/9.6/12/14/17 g (7 pts); FVL > 40/60/80% (1/2/5; not computable here).

Score: `s = N − fiber − protein` if `N < 11`; `s = N − fiber` if `N ≥ 11`. Published letters for general foods: A ≤ 0, B 1–2, C 3–10, D 11–18, E ≥ 19.

### R4. Twelve steps
| Step | Score s | Published letter |
|---|---|---|
| A+ | ≤ −6 | A |
| A | −5 … −3 | A |
| A- | −2 … 0 | A |
| B+ | 1 | B |
| B | 2 | B |
| B- | 3 | C (deviation: the published B band has two integers) |
| C+ | 4 … 5 | C |
| C | 6 … 7 | C |
| C- | 8 … 10 | C |
| D+ | 11 … 14 | D |
| D | 15 … 18 | D |
| D- | ≥ 19 | E (the owner's scale has no E) |

Not equal splits. Meal and day: calorie-weighted mean of the integer score of graded entries, rounded half up, then this table; question mark under 70% calorie coverage; ungradable entries count as uncovered.

Illustrative vectors on typical USDA values (recompute with pack values): lentils −7 A+; oats dry −6 A+; chicken breast −5 A; tofu −3 A; egg 0 A-; whole-wheat bread 0 A-; broccoli −1 A-; whole milk 1 B+; brown rice 1 B+; plain yogurt 2 B; apple 3 B-; cola 3 B-; banana 4 C+; almonds 6 C; white bread 7 C; potato chips 13 D+; butter 18 D; olive oil 20 D-; cheddar 22 D-; peanut butter 20 D-; milk chocolate 30 D-.

### R5. Naming and trademark position
Never on the badge, its label, the popover or a screen title: "Nutri-Score", its logo, a five-letter strip, the green-to-red ramp. Never "has Nutri-Score X". Code and row names `foodGrade.*`, `nutrientProfileScore`. One referential sentence in How-this-works and `docs/evidence.md` only, naming the method and its publisher, the differences, and that the app is not registered and the grades are not Nutri-Scores.

### R6. Documented deviations
1. FVL omitted (fruit one to two letters lower). 2. One table for all foods (drinks over-graded; fats, nuts, cheese, red meat differ). 3. B- is the published C's first point; E folded into D-. 4. Alcohol exclusion read by weight (1.2 g/100 g). 5. Only foods with sugars, saturated fat, sodium and fiber stated are graded. Follow-up ticket: a `category` column in the pack and recipe ingredients carrying fiber, sodium and label micros.

### R7. Evidence register rows
`foodGrade.negativePoints`, `foodGrade.positivePoints`, `foodGrade.proteinNotCountedFrom` (11), `foodGrade.fvlOmitted`, `foodGrade.oneTableForAll`, `foodGrade.letterSteps`, `foodGrade.alcoholLimitG` (1.2), `foodGrade.requiredNutrients`, `foodGrade.kJPerKcal` (4.184), `foodGrade.saltPerSodium` (2.5), `foodGrade.rollupCoverage` (70%); grades moderate for the published tables, judgement for the deviations, strong for the unit conversions. A "How is a food graded?" question above the register.

## Sources and evidence
Access date 2026-10-18.
1. Santé publique France, "Nutri-Score" (FR), updated 6 Nov 2025; (EN) updated 19 Mar 2026. Free use after registration; Conditions of Use March 2025; Graphic Charter March 2024; FAQ V11; in force 1 Jan 2024 (DE, BE, CH, NL), 16 Mar 2025 (FR).
2. Merz B, Temme E, Julia C et al., "Nutri-Score 2023 update", *Nature Food* 2024;5:102–110, DOI 10.1038/s43016-024-00920-3 (abstract).
3. SPF, beverage algorithm second update report V2-2023 (landing page; PDF unreadable).
4. Open Food Facts, `lib/ProductOpener/Nutriscore.pm` (main). Every threshold in R3; letters; category rules; "Undefined values are counted as 0" (which the app must not do). Secondary.
5. German Wikipedia, "Nutri-Score", edited 12 Sep 2026; French Wikipedia; English Wikipedia (3 Oct 2026). Tertiary.
6. CRESS, "Nutri-Score update", 15 Feb 2024. Olive, rapeseed, walnut, oleic sunflower oils B; water the only A drink.
7. LexMea, § 4a LMIDV (EN). Collective mark at EUIPO; consent required.
8. EUR-Lex, Regulation (EU) 2017/1001, Art. 14.
9. GOV.UK, "Nutrient profiling model 2018: technical guidance", 27 Jan 2026. Protein excluded when A ≥ 11 unless FVNS = 5.
10. Deschasaux M et al., *PLoS Medicine* 2018, DOI 10.1371/journal.pmed.1002651; *BMJ* 2020;370:m3173 (PMC7491938).
11. Wikipedia, "Health Star Rating System"; Agrolab 6 Jan 2024; Scottish and Welsh HFSS guidance; Menusano (structure only).
Search extracts only: HSR calculator pages; Ofcom/DH NPM 2011; Rödl on the collective mark; EU TRIS 2025/0025 message 106499 (1.2% alcohol); FNR supplementary tables.
Conflict: CRESS says olive oil B under 2023; my fats-table arithmetic gives C. Revalidate when SPF publishes a new FAQ or Conditions of Use.

## Research
Status: performed, with blocked retrievals (all PDFs and DOCX). WebSearch (12), WebFetch (~35, many blocked). Bounded request to the chair: open `FAQ-updatedAlgo-V11.pdf`, the calculator spreadsheet, `march2025CoU_EN.pdf` and the TRIS message.

## Confidence and limitations
Method choice high; point tables medium-high (OFF plus a tertiary table; official PDF unread); letter mapping medium (anchors published, splits judgement); projected grades medium (typical values, not the pack's); trademark medium-low (Conditions of Use unread; US jurisdiction not researched). Self-review only.

## Acceptance criteria and edge cases
Proposed scenarios: the points of a food (116 kcal, 1.8 g sugars, 0.04 g sat fat, 2 mg sodium, 7.9 g fiber, 9.0 g protein → N 1, P 8, score −7, A+); protein stops counting at eleven (N 11, 7 protein, 2 fiber → 9); strictly greater (1.0 g sat fat → 0); salt from sodium (490 mg → 6); alcoholic drink → question mark; alcohol not stated → graded; a recipe → question mark; several values missing named in order; entry without grams; entry graded from its origin whatever the portion; meal mean 2.5 → B-; boundaries −6, −5, −2, 0, 1, 2, 3, 4, 6, 8, 11, 15, 19 → A+, A, A-, A-, B+, B, B-, C+, C, C-, D+, D, D-. Edge cases: sugars above carbs (ungradable, not clamped); kcal 0 foods (water A-); a version 1 pack with no sugars or saturated fat is all ungradable.

## Dependencies
coaching (NU-8; popover wording); safety (grades with an eating-disorder history given the projected grades); food-database (coverage per nutrient; a category column; recipe ingredients' micros); engineering (engine function; register test pattern); product owner (R4 splits, alcohol threshold, disclosures, trademark wording).

## Safety concerns
A population-level profile per 100 g says nothing about a person's needs; energy-dense nutritious foods grade low while sugary drinks grade mid, which could steer restriction toward low-energy foods; no personal data leaves the device; no red and no judging words. No clinical clearance.

## Unresolved product decisions
1. Ship with drinks and fruit misgraded (disclosed) or add the pack category first. 2. The twelve-step splits. 3. Alcohol threshold 1.2 vs 1.0 g. 4. Trademark wording and whether to notify SPF. 5. Whether alcohol and missing data read alike in a meal's popover. Authority: product owner.

## Verification
Nothing executed. Recommended: unit tests for R3/R4; a portion-invariance property test; the register test over `foodGrade.*`; the chair's PDF verifications.

## Targeted challenges
None yet.
