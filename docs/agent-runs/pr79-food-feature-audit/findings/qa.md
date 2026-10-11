# Review: qa

## Scope and traceability
Actual installed Claude panel-qa, independent source-only review with no peer
findings supplied. Baseline `999d32887778f656080e788a1c9aa556e354ec8c`,
`copilot/implement-expert-panel`, dirty panel/main-merge state.
Read AGENTS, canonical QA/protocol/contract/template and MM-167, MM-48, MM-169.
Chair persists this condensed actual report and separately labels verification.

## Existing facts versus proposals
scaleNutrition/gramsFor centralize arithmetic. Typed totals bypass scaling.
withPortion/portionFromRow persist portion fields. Recommendations are not
approved behavior. No implementation was changed by reviewer or chair.

## Audit coverage
Feature mode; source inspection only by specialist:
- Domain scale_nutrition, grams_for, portion, portion_unit, parse_quantity,
  units_offered, reference_nutrition, nutrition_basis, nutrition_totals, food_entry.
- App food_amount_step_state, add_food_sheet_state, food_entry_tile,
  portion_summary, quantity_text, custom_catalog_food; providers:140-145,
  mm_text_field:36-47.
- Data portion_columns, food_from_row, drift_food_repository;
  fixture in_memory_food_repository:23-51 and food_repository_contract.
- Tests portion_test, food_portion_test, food_search_test:47-93,
  custom_foods_test:63-118, alcohol_test:67-95; titles only food_edit/barcode.

Uninspected: HandModel/MM-46/other requirements, migrations/schema/database
tables, estimates/scan/recipe/custom forms, parseNumber/roundedToZeroNote,
goldens, engine alcohol/source consumers and HANDOFF. Source coverage is
bounded, not whole-feature certification or runtime observation.
Referrals: nutrition (units/alcohol), UX/Flutter (input/recents), architecture
(contract completeness), chair (tracking).

## Findings
Actual implementation paths are repository-relative. Specialist originally
called QA-1/2/3 "reproducible defect" while explicitly reporting no runtime
execution; chair retained that provenance and promoted only after owner guards.

- **QA-1, food UI:** now reproducible implementation defect, medium, high.
  MM-167 unchanged-save/fraction semantics; add_food_sheet_state:88,225 and
  quantity_text:2-8 round edit seeds, _totals:162-170 reparses. Expected same
  quantity/totals; 1/3 serving becomes 0.33. Legacy typed fields also round.
  Impact silent drift, preserve precision/unchanged values. Same cause as
  nutrition N-1/N-5; deduplicated MM-202, two owner-run guards.
- **QA-2, food UI:** now reproducible defect, medium, high. MM-167 calculated
  quantity; _save:338-340 alcohol differs from scaled energy:125-133.
  Expected two servings consume 28 g, observed 14. Existing alcohol_test
  covers entered totals only. Same as N-2; deduplicated MM-203.
- **QA-3, food UI:** now reproducible defect, medium, high. _enterTotalsMyself
  at add_food_sheet_state:242-254 copies macros/energy, not alcohol; _save:
  338-340 then saves null. Expected unchanged consumed alcohol; observed
  loss on conversion. Distinct cause from QA-2, routed MM-204. Acceptance:
  conversion preserves consumed alcohol/energy; origin follow-up remains
  separately scoped under MM-169, not assumed verified.
- **QA-4, recents:** documentation/requirement gap, medium, medium intent
  confidence. _fill:210-231 invoked:515,536 forces enteredTotals; new portion
  drops reference/origin and _scaledExtra drops extras. Expected intent unclear:
  MM-167 copying preserves portion, but recents may not be copying.
  Changing quantity does not change fixed totals. Nutrition read MM-39, which
  expressly permits retyping totals; chair retains interpretation difference
  as an improvement/traceability question, not confirmed violation.
- **QA-5, hand display/history:** unverified hypothesis, low, medium. MM-167
  estimated-not-exact rule; portion_summary:23-37 may lack estimated wording,
  editor:165-170,288-296 recomputes using current hand size. MM-46/HandModel
  unread, so historical impliedGrams semantics unverified. Investigate before
  policy ruling or defect label; record uninspected dependency.
- **QA-6, wording/method:** documentation/requirement gap, low, high source
  confidence. Empty prompt:667-670 differs from criterion wording; calculated
  edit:758-822 doesn't visibly show Label serving; _calcMethod:269-273 may
  change source interpretation. Distinguish semantic intent from exact text
  and inspect source conventions before remediation.
- **QA-7, coverage:** documentation/requirement gap, medium, medium bounded
  confidence. Original tests omitted unchanged save, saving after Enter totals,
  source-specific serving methods, invalid catalog amount and recents;
  repository contract:263-297 titled change-or-clear only exercises clear.
  No incorrect numeric expectation found in inspected tests. Chair has since
  added actual failing-before guards for confirmed defects; other gaps remain.

## Sources and evidence
Internal code/requirements/test inspection; no external source consulted by
specialist. Chair attempted official eCFR 101.9 for a separate cup-name question:
access blocked. GovInfo PDF retrieved but not parsed/inspected; HTML variant
404. Neither a retrieved binary nor remembered FDA value supports a conclusion.
No source-supported finding is claimed from those attempts.

## Research
Unnecessary for QA-1 through QA-7 internal arithmetic/traceability.
Separate bounded request: verify the repository's "US legal cup" label against
21 CFR 101.9(b)(5)(viii)/NIST before relying on remembered distinction between
240 mL labeling and 236.588 customary cup. Chair retrieval attempts above
did not establish the claim; request remains blocked/unverified, not silently
substituted from memory. No unit/requirement changes made.

## Confidence and limitations
High inspected code-path confidence; medium interpretation elsewhere.
No specialist test/runtime execution. Native runtime exposed exactly
Read/Grep/Glob/WebSearch/WebFetch without overrides; no shell/write/delegation.
Existing test input changed after review only to append tracked guards;
original assertions and implementation unchanged.

## Acceptance criteria and edge cases
Proposed guards for unchanged round-trip, consumed alcohol scaling/conversion,
source-specific methods and repository portion update. Further unverified
boundaries: zero density, per100ml serving and missing profile for hand edits.
These are not silently promoted to required product behavior.

## Dependencies
Nutrition, UX/Flutter, architecture and chair as referred above. Unreviewed
roles/dependencies retained; no agent agreement used as proof.

## Safety concerns
Alcohol under-recording within observed synthetic paths; not clinical clearance.

## Unresolved product decisions
Recents calculated semantics and historical hand model require full requirement
inspection before owner decision. Cup definition research remains blocked.
None authorizes a silent product change or blocks delivering audit tooling.

## Verification
Specialist ran no tests. Parent guards reproduced QA-1 (100->99 kcal and
100.123->100.1), QA-2 (28->14 g) and QA-3 (14 g->null with 138 kcal retained).
Ticketed MM-202/203/204 guards are explicitly skipped pending separate app
fixes. Full gate previously passed, final post-QA gate recorded in state.
No device/golden/native-food-path verification claimed.

## Targeted challenges
Chair cross-checked independent nutrition report: shared precision/alcohol
causes deduplicated, distinct conversion cause retained. QA recents concern
does not override inspected MM-39 allowance; difference retained as unresolved
traceability/improvement. Source-only "reproducible" labels corrected after
actual owner verification; blocked cup question not treated as remembered fact.

Actual native QA targeted challenge addendum:
Read MM-39 and both reports; no commands, hashes or repeated audit.
QA agrees recents are not a confirmed violation: MM-39:17,31,41-42 documents
fixed-total retyping. N-4 remains improvement; QA-4 remains a traceability gap
until recents-versus-copying scope is reconciled. Dissent retained: Notes are
not necessarily normative criteria, measurement carryover was not rechecked,
and recents widget coverage is absent. No app change authorized.
QA accepts the chair-supplied arithmetic reproductions as separately sourced
results, not tests it ran. Full gate requires actual exit 0/final success marker;
skipped guards do not mean fixed defects. Cup question remains explicitly
PANEL_RESEARCH_BLOCKED, with no validated value.
