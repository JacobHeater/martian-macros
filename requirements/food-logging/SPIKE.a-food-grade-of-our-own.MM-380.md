---
id: MM-380
status: done
component: food-logging
related: [MM-369, MM-370, MM-371, MM-381, MM-382, MM-383, MM-305, MM-307, MM-310, MM-365, MM-108]
---

# Spike: A food grade of the app's own, from what a food gives per calorie

## Context
MM-369 chose the point tables published for the Nutri-Score label and MM-370 built the grade on them. On 2026-10-18 the
product owner said that was not what they asked for: the grade is to be the app's own method, not a published one. The
owner's answer on 2026-10-17 was "universal nutrition quality"; the spike read that as "adopt a published model".

## Decisions
The product owner's (2026-10-18, through the question tool):
- **The grade rewards nutrient density per calorie.** Protein and fiber per 100 kcal count for a food, and the vitamins and
  minerals the app tracks (MM-305) count for it; sodium, sugars and saturated fat per 100 kcal count against it; energy
  density (kcal per gram) counts against it. Universal: the same grade for everyone.
- **Required to grade: calories, the four macros, fiber and sodium.** Sugars and saturated fat refine the grade only when
  stated, and the popover says they were not counted. The vitamins and minerals likewise.
- **Unnamed.** Badges and popovers keep saying "Grade B+ for Lunch"; the register describes the app's own method and names no
  outside model.
- **Twelve steps, A+ to D-** (MM-370, unchanged); a question mark with a reason when a food can't be graded (MM-370).
- **Run end to end** (spike, build, merge) with the chair's choices recorded as "say if any is wrong".
- **The food packs' data**: "more micro data", and the question whether to explore more robust packs (MM-381, MM-383).

The method as built is in `docs/food-grades.md`, reviewed by the panel's nutrition, micronutrients, measurement and
integrations roles (`docs/agent-runs/mm380-proprietary-grade/`; all four "build with the listed changes"; the decision
record lists every finding's disposition). Choices I made without asking (say if any is wrong), where the roles left a
choice or disagreed:
- **The per-calorie floor applies to what counts against a food only** (40 kcal per 100 g): measurement's floor of 50 on
  everything demoted every raw vegetable to A or B, against nutrition's order; what counts for a food stays per 100 kcal.
- **The sugars waiver is nutrition's three gates as measurement's ramps**: watery foods (under 1.5 kcal/g, fading by 2),
  fiber 0.5 to 1 g and protein 2.25 to 4.5 g per 100 kcal. Flavoured dairy with protein, flavoured yogurt and canned fruit
  in syrup leak through until an added-sugars column exists.
- **Energy density** starts at 3 kcal/g and stops at 5 points (3, 4, 5, 6, 7.5), between the two roles' proposals.
- **The sodium scale runs to 14,000 mg per 100 kcal** so soy sauce reads C; no per-100 g backstop (chips and salted butter
  pay little per calorie), to be decided after the first pack build shows the distribution.
- **The D bands** are D+ ≥ −5 and D ≥ −8 (nutrition's NU-6).
- **The vitamins and minerals count from four stated** (the four a US label must state), over the stated, bounded by how
  many reach 5% of their Daily Value per 100 kcal, and at most 3 points when counted sugars pass 8 g per 100 kcal (a
  fortified sweetened cereal reads B-, not B). Fortification otherwise counts as the label states it.
- **Protein keeps its weight of 8** (nutrition's decision 5: the app is about strength on fat loss).
- **No unsaturated-fat positive**: walnuts read beside chips and olive oil beside cola, disclosed.
- **Recipes stay ungraded** (their ingredients carry no fiber or sodium), with a reason naming both.
- **Pack foods are graded now** without sugars, saturated fat or the vitamins and minerals (the owner's decision), so a
  cola scores 0 and reads C until a format 2 pack states its sugars (nutrition's NU-4); the popover says what was not
  counted; the rebuild (MM-383) completes the grades.
- **The eating-disorder decision of MM-370 stands on the new method**: nutrition notes every A+ in the calibration set is
  a vegetable and the per-calorie method ties more strongly to low energy density than the old one; the owner may want
  to re-affirm or revisit showing grades with an eating-disorder history.
- **The grade does not reflect a clinician's restrictions** (potassium, sodium, protein); the register entry says so.

## Description
Answer, with `docs/food-grades.md` rewritten and the evidence register's "How is a food graded?" entry replaced:
1. The components and their scales; low-calorie foods; energy density; the sugars waiver.
2. The vitamins and minerals: the reference, the cap, the minimum stated, sparse sources.
3. The twelve steps against a calibration set.
4. Inputs and when a food can't be graded.
5. What the popover says when sugars, saturated fat or the vitamins and minerals were not counted.
6. Evidence rows for every figure, graded honestly.
7. The build's shape (MM-382).

## Acceptance Criteria
```gherkin
Scenario: The method is the app's own
  When the spike is done
  Then docs/food-grades.md and the register's "How is a food graded?" entry describe the per-calorie method and name no published model as the basis

Scenario: The panel has reviewed it
  Then docs/agent-runs/mm380-proprietary-grade/ holds the nutrition, micronutrients and measurement roles' findings and a decision

Scenario: A calibration set is recorded
  Then the report lists the reference foods, their inputs and the letters the method gives them, and MM-382's tests hold those letters
```

## Progress
- Done 2026-10-18: `docs/food-grades.md` (the method, the calibration set of 61 foods with their letters, the coverage
  measured on the published packs), the register entry and 23 rows, the decision record. Built as MM-382. The pack data
  question is answered in `docs/food-packs-data.md` (MM-381) and built as MM-383.
