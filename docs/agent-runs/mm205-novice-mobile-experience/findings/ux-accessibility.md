# Review: UX & accessibility

## Scope and traceability

Role: UX & accessibility; reviewer `panel-ux-accessibility`; independent
read-only feature audit. Baseline application commit:
`44251604bac61bdc5dd9eb69bec045e13f7e2929`; inputs and their current hashes
are indexed in `state.json`. The bounded goal was to log a first meal, verify
it, correct a mistake, and repeat later. Inspected requirements MM-40, MM-42,
MM-48, MM-49, MM-98, MM-100, MM-158, MM-167, MM-176, MM-179 and MM-180.

## Existing facts versus proposals

MM-176 deliberately asks for a metrics-heavy Dashboard. MM-179 requires the
macro-energy split and all three shares, including in Simple mode. The audit
does not classify either as a requirement violation. Wrong-date Dashboard
entry conflicts with MM-100. The deletion alternative is grounded in the
explicit interaction design. The proposed chart-prominence and Add-sheet
changes remain unverified hypotheses, not implementation instructions.

## Audit coverage

Inspected onboarding entry/welcome/goal, Dashboard, Food day navigation,
meal groups, search, manual amount/estimate/barcode entry paths, Add-food
sheet, directly linked Coach/Progress, related requirements, selected
widget/golden tests, and stored Light/Martian renders. Rendered evidence is
from repository PNGs, not a live device or novice study. No tests were run by
the specialist. No broad app audit was claimed.

Uninspected: complete OCR/custom recipe flows; persistence failure recovery;
all onboarding and safety-notice states; measured contrast; enlarged text;
keyboard/focus, reduced motion, TalkBack/VoiceOver; current device behavior;
novice task performance. Flutter and QA received bounded referrals on date
routing and deletion respectively.

## Novice mobile experience (when UX/product design is assigned)

The journey places intake, macro targets, coach status/confidence and the
energy-share chart before routine meal groups. Food offers Search, Scan,
Saved, Estimate, recents and a manual form that asks for measurement method,
amount/unit, nutrition basis and nutrition values. These are real choices and
interpretations; whether they confuse novices was not observed. Helpful
mitigations include named meal-specific Add actions, calculated totals,
estimate labels, database-unavailable messaging, editable entries, copy,
historical-day controls and Undo.

In the initial viewport the Dashboard action is prominent and the macro chart
precedes meals. Stored goldens show placement only, not task success or
cognitive overload. Food's empty copy says “Start with breakfast” although
the global Add route can choose a meal from time of day. The inspected
onboarding explains calibration/logging but not the first meal-entry task;
MM-158's fuller “What to expect” remains proposed.

Research does not justify demoting or removing the chart. The evidence gap
between user preference and task comprehension remains; no novice test was
run.

## Findings

### UX-01 — Dashboard Add food can inherit Food's historical date

- **Classification:** reproducible implementation defect; confirmed MM-100
  requirement violation.
- **Severity/confidence:** High impact (silent wrong-day logging); high
  confidence. Source trace and parent widget reproduction.
- **Requirement:** MM-100 says Dashboard Add food logs to today, returns to
  Dashboard and updates its numbers.
- **Source:** `apps/mobile/lib/src/food/add_food_button.dart:13-19`
  passes `shownDay(ref)`; `apps/mobile/lib/src/food/selected_day_provider.dart:7-13`
  retains Food's date; `apps/mobile/lib/src/app/home_shell_state.dart:63-108`
  keeps both destinations alive; `apps/mobile/lib/src/dashboard/dashboard_screen.dart:56-57,122-128`
  reads today's intake and resets only when the intake hero route is tapped;
  `apps/mobile/lib/src/food/add_food_sheet_state.dart:51,321-345` initializes
  and saves the supplied day. Food historical logging remains valid under
  MM-38/MM-41.
- **Expected/observed:** after selecting Yesterday in Food, switching by
  bottom navigation to Dashboard and saving via Dashboard Add food, the entry
  belongs to today; current path retains the old selected date.
- **Reproduction:** `fvm flutter test test/dashboard_test.dart --plain-name
  "MM-206: Dashboard logging ignores Food historical-day selection"` from
  `apps/mobile/` failed at the assertion expecting one new record for today:
  actual `WhereIterable<FoodEntry>: []`; exit 1 was the expected failing-before
  outcome. Ticket MM-206; guard is now skipped pending fix.
- **Impact/remediation:** can look like a failed save, prompting repeat entry.
  Keep historical Food behavior; make Dashboard's action explicitly target
  today. Verify today's intake changes, yesterday is unchanged, and navigation
  returns to Dashboard.
- **Limit:** widget/in-memory reproduction; no device or production database
  run.

### UX-02 — Meal deletion lacks a visible non-gesture alternative

- **Classification:** confirmed requirement/design-rule violation.
- **Severity/confidence:** Medium; high confidence for visible UI absence.
- **Rule:** `design/interaction-and-motion.md:76` says gestures are accelerators
  with visible alternatives; `design/screen-direction.md:54` specifies a
  visible overflow alternative plus Undo.
- **Source:** `apps/mobile/lib/src/food/meal_section.dart:134` wraps a row in
  `Dismissible`; row tap edits. The edit form provides fields and save but no
  Delete control. Existing `food_edit_test.dart` covers swipe/Undo only.
- **Expected/observed:** a user can remove a meal entry without discovering a
  swipe gesture; no visible per-entry alternative was found.
- **Challenge/reproduction:** QA independently confirmed the explicit design
  criterion. Enabling the MM-207 widget guard failed at its expectation for
  tooltip `More actions for Chicken and rice` (zero controls); exit 1 was the
  expected pre-fix failure. Guard is skipped pending fix.
- **Impact/remediation:** a novice unfamiliar with swipe has no apparent
  removal route. Add a visible, named, adequately sized action and preserve
  Undo; keep the swipe accelerator. Do not put destructive action next to
  high-frequency save. Verify keyboard/switch/assistive technology.
- **Limit:** semantics/runtime dismiss actions, TalkBack, VoiceOver, keyboard
  and switch access were not tested. Even if semantic dismiss exists, it does
  not replace the required visible alternative.

### UX-03 — Food/search may conflate unavailable with empty data

- **Classification:** evidence-supported domain concern.
- **Severity/confidence:** Medium potential impact; high confidence about
  observed source fallback, unknown incidence.
- **Source:** `apps/mobile/lib/src/food/food_screen.dart:35-80`,
  `FoodSearchResults.build` at `apps/mobile/lib/src/food/food_search_results.dart:26`,
  compared with Dashboard's explicit loading/error states.
- **Expected/observed:** distinguish “no food/no results” from records/search
  that are still loading or failed; source paths can render empty-like content
  when provider values are absent.
- **Impact/remediation:** avoid duplicate entry or loss-of-record confidence.
  Inject delayed/error providers and verify each state before ticketing.
- **Verification:** source inspection only; current tests cover success/no
  results/no installed pack, not injected failures.

### UX-04 — Simple is a partial disclosure mechanism

- **Classification:** documentation or requirement gap.
- **Severity/confidence:** Medium policy impact; high confidence in conflict.
- **Sources:** MM-49 (`requirements/food-logging/STORY.detail-level.MM-49.md:14-18`)
  describes Simple as calories and protein; MM-179
  (`requirements/dashboard/STORY.macronutrient-split-charts.MM-179.md:16`)
  requires all three pie shares in Simple. Manual values and selected-food
  totals also do not consistently consult the preference.
- **Expected/observed:** people need an honest account of what Simple hides;
  current requirement scope has explicit exceptions and incomplete form
  support.
- **Impact/remediation:** clarify scope with the product owner before a UI
  change; preserve MM-179 until then. No violation or permission to suppress
  carbohydrate/fat data is asserted.
- **Verification:** requirement/source inspection; no Simple-mode render.

### UX-05 — Multiple entry routes and metric meanings may burden novices

- **Classification:** unverified hypothesis requiring investigation.
- **Severity/confidence:** Medium provisional; low user-impact confidence.
- **Source:** `apps/mobile/lib/src/food/add_food_sheet_state.dart:348-530`,
  `FoodAmountStepState.build`, `CalorieHero.build` and
  `MacroSplitChart.build` present distinct routes and meanings.
- **Hypothesis/impact:** users could confuse Estimate with manual estimated
  values, reference servings with consumed amounts, target bars with energy
  shares, or protein minimum with target. No confusion, abandonment or
  overload was observed; labels and explanatory captions may mitigate it.
- **Suggested check:** observe novice first- and repeat-meal tasks with/without
  database packs; record route choice, amount/basis comprehension, corrections
  and completion separately from preference. No card-count threshold.

## Sources and evidence

Chair-delegated sources and exact provenance are recorded in
`findings/research.md`. Sources relevant to this report include W3C Pointer
Gestures, Resize Text, Error Identification/Suggestion and Target Size;
Apple Accessibility/VoiceOver; Android accessibility apps/principles; and
the Cordeiro food-journaling studies. These support accessible alternatives,
feedback and investigation of logging friction, not the comparative
effectiveness of the current chart hierarchy. The actual URLs appear in
`findings/research.md`.

Evaluated source URLs include
https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html,
https://developer.android.com/guide/topics/ui/accessibility/apps, and
https://depstein.net/assets/pubs/fcordeiro_chi15.pdf. The specialist received
the chair's source summaries and did not independently fetch these pages.

## Research

Status: `performed` via the chair after direct specialist retrieval was
blocked. Question: does applicable mobile/accessibility or food-logging
evidence justify prominent macro bars plus energy shares before meals for
novices? Trigger: the user explicitly requested modern fitness UX guidance.
The specialist evaluated source summaries returned by the chair, not the
underlying external pages directly. No direct controlled novice progressive-
disclosure study was found; no chart-prominence claim is supported.

## Confidence and limitations

High for the code/requirement date mismatch and absent visible deletion
control; parent tests reproduce both. High for the stored-font FAB overlap
after parent reproduction. Medium for the source-level unavailable/empty
concern; low for any assertion of novice confusion. No user test or device
observation occurred. The audit is bounded, not an accessibility or clinical
certification.

## Acceptance criteria and edge cases

MM-206 must distinguish today from yesterday and preserve Food's ability to
log to a selected past day. MM-207 must delete without swipe, retain an
accessible name/target and Undo, and preserve swipe behavior. MM-208 must
keep the Add action available without covering chart labels at 360×800 and
with enlarged text; other themes and Food placement need review. Empty,
loading, error, no-pack, estimate and zero-macro states remain separate.

## Dependencies

Flutter/implementation owns MM-206 routing; QA verifies its integration.
Flutter/product design owns MM-207 visible action placement; QA covers
non-gesture delete/Undo and device accessibility. Product owner decides
MM-49/MM-179 scope. QA/implementation must inject provider failures for
UX-03. Product Designer and UX should independently review proposed changes.

## Safety concerns

Wrong-date intake can corrupt user history; downstream clinical harm was not
established. Do not hide uncertainty or safety notices to reduce density.
No other safety issue was found within this scope; this is not clinical
clearance. No personal data was used in research.

## Unresolved product decisions

Should Simple detail affect the MM-179 chart, or only target-progress bars?
The product owner decides. Evidence does not establish that demoting the chart
would improve novice comprehension.

## Verification

Specialist source inspection and repository golden inspection only. Parent
ran failing-before probes for MM-206/207 and the font-calibrated MM-208 guard.
The focused Dashboard/Food widget suites later passed with all three
ticketed guards skipped (9 passed, 3 skipped). No emulator, production
database, screen reader, keyboard, switch access or novice user test was run.

## Targeted challenges

QA independently confirmed the explicit non-gesture deletion requirement and
the stored golden's visible FAB/content overlap. Flutter independently traced
UX-01 through the manual save path and confirmed MM-100 conflict. Challenge
scope and verification details are in `findings/qa.md` and
`findings/flutter.md`.

The Product Designer asked whether the full macro-energy chart plus target
bars before meal groups improves novice task comprehension enough to justify
its prominence. The chair-delegated evidence did not establish benefit or
harm; comprehension and preference remain separate outcomes. No recommendation
to demote the chart follows, and MM-176/MM-179 remain controlling.
