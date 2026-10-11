# Review: nutrition

## Scope and traceability
Actual native Claude `panel-nutrition`, independent read-only pass, no peer
reports supplied. Branch `copilot/implement-expert-panel`, baseline
`999d32887778f656080e788a1c9aa556e354ec8c`, dirty tooling/merge state.
MM-167 and MM-39 inspected. This chair-persisted summary preserves the returned
findings; owner verification below is separately labeled, not specialist execution.

## Existing facts versus proposals
Scaling is centralized in scaleNutrition/gramsFor. Calculated edits recompute
from stored reference, not consumed totals; typed totals intentionally bypass
scaling. Production servingUnit writers inspected use serving or null.
Remediation suggestions below are proposals; no application fix is authorized.

## Audit coverage
Mode: feature. Source inspection/hand arithmetic:
- Canonical nutrition role, protocol, review contract, AGENTS, report template.
- MM-167 quantity/unit/basis and MM-39 recents.
- Domain portion, reference_nutrition, scale_nutrition, grams_for,
  nutrition_totals, portion_unit, units_offered, parse_quantity, hand_model,
  recipe_per_serving.
- App add_food_sheet_state, food_amount_step_state, amount_choice,
  custom_catalog_food, copy_entries, quantity_text, portion_summary.
- Domain portion tests lines 55-141, names for remaining tests; app
  food_portion_test lines 120-399, names for earlier cases.
- Summation sites meal_section, intake_day_from, food_screen: grep hits only.

Not inspected: repository implementation bodies/migrations/contracts,
estimates/cooking fat/recipe/custom forms/barcode/label/catalog pack contents,
engine consumers, calorie hero/providers, full summation bodies, architecture/
handoff and remaining food requirements. Per100ml writer absence was only an
indirect search, not proof no writer exists. No whole-app certification.
Referrals: micronutrients (extras), measurement (precision), UX/coaching
(zero-kcal/recents), safety (alcohol display), data owner (serving semantics).

## Findings
All paths below are repository-relative. Severity follows impact; no clinical
clearance or claimed production-data reproduction.

- **N-1, nutrition/food logging:** confirmed requirement violation, medium,
  high confidence. MM-167 unchanged-save semantics. quantity_text.dart:2-8
  rounds to two decimals; add_food_sheet_state.dart:88,162-170 seeds/reparses.
  Expected unchanged quantity/totals; source calculation 1/3 serving at
  300 kcal becomes 0.33 and 99 instead of 100 kcal. Small quantities may become
  zero and invalid. Impact: silent drift on meal/day-only edits. Preserve
  original precision or unchanged values; regression must keep exact quantity/
  totals. Owner reproduced and routed to MM-202.
- **N-2, nutrition/food logging:** initially called "reproducible defect" by
  specialist on inspection only; chair correctly withheld runtime classification
  until verification. Now reproducible implementation defect, medium, high
  confidence. MM-167 once-consistent scaling; add_food_sheet_state.dart:
  125-156,180-185,338-340 saves unscaled typed alcohol. Two reference servings
  of 10 g carbohydrate/14 g alcohol produce 276 kcal but 14 rather than
  28 g consumed alcohol. Impact: alcohol display disagrees with energy.
  Scale and retain reference alcohol; guard both values. Routed MM-203.
- **N-3, nutrition/food logging:** unverified hypothesis, low, medium confidence.
  food_amount_step_state.dart:400 accepts non-null zero totals while
  add_food_sheet_state.dart:189-196 requires positive energy; potential zero-kcal
  pack entry cannot re-save. Pack contents and complete requirement scope not
  verified. Investigate before assigning a policy violation; make log/edit
  validity consistent and explicit if confirmed. No claimed reproduction.
- **N-4, nutrition/food logging:** design/usability improvement, medium, high
  inspection confidence. MM-39 permits retyped recents; _fill at
  add_food_sheet_state.dart:210-231 switches to enteredTotals. Changing recent
  150 g to 300 g leaves fixed totals, drops source extras/reference; label
  "Everything you ate" mitigates confusion. Not a confirmed requirement
  violation. Consider preserving calculated recents or clearer fixed-total
  messaging; owner decision required, no automatically expanded scope.
- **N-5, nutrition/food logging:** initially documentation/requirement gap,
  low, high inspection confidence. _fill:211-217 rounds legacy/typed fields
  to one decimal despite MM-167 unchanged totals. Chair's widget verification
  now confirms the same precision root cause as N-1: 100.123 becomes 100.1.
  Deduplicated into MM-202, retaining distinct field/cause path and guard.
- **N-6, nutrition/domain:** latent documentation/requirement gap, low, high
  inspection confidence. scale_nutrition.dart:23-25 and grams_for.dart:20-23
  treat servingUnit as one unit; no serving-count field. A hypothetical
  2 tbsp/32 g source would mis-scale if declared tablespoon. No reachable
  current writer found; not a reproduced bug. Document invariant or add count
  before such sources; request data-owner challenge and domain boundary test.
- **N-7, nutrition/domain:** documentation/requirement gap, low, medium confidence.
  scale_nutrition.dart:40-48/units_offered.dart:30-36: per100ml with known
  serving volume does not scale serving; volume offerings differ between
  add/edit paths and fluid ounces are not offered. Reachable source/requirements
  not fully checked. Clarify supported units before declaring missing behavior.
- **N-8, nutrition/extras:** evidence-supported internal arithmetic concern,
  low, medium confidence; no external efficacy claim. _scaledExtra at
  add_food_sheet_state.dart:313-319 uses calorie ratio for fibre/sodium/alcohol.
  Correct for proportional calculated quantity; editing a calorie typo after
  entering totals may change extras at fixed amount. Micronutrient referral;
  inspect intended policy and add fixed-amount boundary coverage before fix.

No findings within inspected scope on 150 g/per100g arithmetic, ounce
conversion, 1.5 serving scaling, typed-total bypass, single scaling at log or
refusal to invent density. This is not certification of uninspected cases.

## Sources and evidence
No external sources consulted. Internal requirements, source inspection and
synthetic arithmetic. Unit constants accepted from MM-167, not independently
verified against a current standard.

## Research
Unnecessary: internal consistency/arithmetic/traceability, no new health rule.
Actual native tools included WebSearch/WebFetch but none used. Future external
claims or platform questions must trigger research, not rely on this rationale.

## Confidence and limitations
Source claims high, user impact medium without device/pack observations.
Exact original line references predate inserted regression tests; implementation
files remain unchanged. No hashes invented by specialist; owner records hashes.

## Acceptance criteria and edge cases
Proposed: lossless fractional/legacy round trips, consumed alcohol consistency,
explicit zero-kcal validity, clearer recent fixed-total semantics and serving/
per100ml boundaries. Preserve proposed versus approved distinction. Existing
MM-167 fraction parsing/change-amount tests missed unchanged fractional saves.

## Dependencies
Micronutrients, measurement, UX/coaching, safety and data owner as referred
above. Additional reviewers not commissioned here; referrals remain unreviewed.

## Safety concerns
Alcohol under-display and silent intake drift, not clinical advice or clearance.
No privacy concern found within inspected scope.

## Unresolved product decisions
Recents semantics, zero-kcal policy and beverage-unit scope need broader
requirements inspection before an owner ruling. No blocking decision for the
tooling PR; unresolved app questions are retained rather than silently decided.

## Verification
Specialist ran no commands/tests. Parent's new widget guards executed:
MM-202 fractional expected 100, actual 99 kcal; legacy expected 100.123,
actual 100.1. MM-203 expected 28, actual 14 g alcohol while energy 276.
First alcohol test missed optional toggle; corrected setup reproduced intended
assertion. These tests are skipped with allocated IDs pending separate app fixes,
not passing around defects. No emulator/native/production-data test.

## Targeted challenges
Chair corrected N-2 inspection-versus-reproduction classification and promoted
N-5 only after actual verification; deduplicated precision into MM-202 without
dropping the separate legacy guard. Remaining hypotheses/gaps are not confirmed
bugs, and no peer consensus substitutes for verification.
