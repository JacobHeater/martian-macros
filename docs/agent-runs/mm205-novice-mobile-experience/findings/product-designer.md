# Review: Product Designer

## Scope and traceability

Role: Product Designer; reviewer `panel-product-designer`; independent
read-only `feature` audit. Application baseline:
`44251604bac61bdc5dd9eb69bec045e13f7e2929`; actual input hashes are recorded
in `state.json`. Bounded journey: first launch/onboarding → Dashboard/Today →
Food → Add food → choose/enter amount and meal → save/return; limited entry
views of Coach and Progress. Requirements inspected include MM-9/10/12/158,
MM-37/38/39/41/42/49/167/176/179/180, MM-98/99/100, and weight-trend
requirements. Design inputs included screen direction, visual language,
tokens, anti-cruft, interaction and motion, design map, architecture, handoff,
and relevant tests.

## Existing facts versus proposals

The Dashboard is intentionally metrics-heavy under MM-176. MM-179 requires
the macro-energy pie and all three shares in Simple. The two displays have
different meanings: target progress versus recorded macro-energy proportion.
Their presence is not a requirement violation. Visual confidence is based on
stored goldens and source layout; no current device or novice performance was
observed.

## Audit coverage

Inspected `HomeShellState`, Dashboard/metrics, CalorieHero, WeightCard, Food,
MealSection, AddFood sheet/search/results, onboarding screen state, Coach and
Progress entry views, related requirements/design docs, and dashboard/meal/
chart/food/progress tests (tests were inspected, not run by this reviewer).
Viewed stored `dashboard_martian.png`, `dashboard_dark.png`, `food_light.png`,
`food_meals_martian.png`, `onboarding_light.png`, `coach_martian.png`, and
`progress_martian.png`. Goldens are synthetic 360×800 logical-pixel artifacts,
not an emulator or novice observation. No Add-food sheet golden existed.

Not inspected: complete onboarding, sheet keyboard/scroll/focus renders, all
Coach/Progress details, enlarged text, assistive technology, physical devices,
user task performance. UX/accessibility was referred a bounded chart-
comprehension question; its research addendum is included below. The
Product Designer and UX initial reports were independent.

## Novice mobile experience (when UX/product design is assigned)

Dashboard presents intake/targets, coach status, macro-energy chart and
weight/history. Food presents calorie/macro context, then meal groups. The
Add-food sheet source offers search, Scan/Saved/Estimate, recents and a
detailed manual form. These groups have distinct purposes; count alone is not
evidence of burden. The chart represents recorded macro-energy share, while
progress bars represent grams against targets. No novice was observed
interpreting these together.

The golden shows the lower fat label/caption area beneath the Add-food FAB.
This is specific visual occlusion, not a claim that the Dashboard has too
many cards. The sheet's initial visible fold is unknown because no render was
available.

## Findings

### PD-01 — Add-food FAB obscures Dashboard chart content

- **Classification:** reproducible implementation defect.
- **Severity/confidence:** Medium; high after the owner reproduced the
  geometry with bundled Inter/SpaceGrotesk fonts.
- **Requirement/invariant:** retain MM-100 one-tap Add food while preserving
  visible current content.
- **Evidence:** `HomeShellState` supplies the global FAB
  (`apps/mobile/lib/src/app/home_shell_state.dart:63-108`) and
  `DashboardScreen` places `MacroSplitChart` in scrollable content
  (`apps/mobile/lib/src/dashboard/dashboard_screen.dart:36-40,128`).
  `apps/mobile/test/goldens/images/dashboard_martian.png` at its initial
  360×800 logical-pixel view shows the FAB obscuring the lower macro label.
  QA independently agreed it is a FAB/content overlap, not a chart overlay.
- **Expected/observed:** primary action stays available without covering
  chart labels or captions; stored render and source layout place it above the
  lower-right chart content.
- **Impact/remediation:** a novice may miss part of labeled data. Keep the
  action but reposition/scroll-pad the content so no chart content is covered.
  Verify 360×800, themes, Food placement and enlarged text.
- **Verification:** parent enabled the MM-208 geometry guard on a 720×1600
  physical / 2× viewport and loaded bundled production fonts using
  `setUpAll(loadGoldenFonts)`. The assertion reproduced overlap and failed
  at `apps/mobile/test/dashboard_test.dart:143`. Without fonts, Windows
  fallback metrics made the same guard pass; that run is not accepted as
  evidence against the golden. The guard is skipped pending the UI fix.
  Widget-layout reproduction, not emulator/device verification.

### PD-02 — Simple detail's visible scope is ambiguous

- **Classification:** documentation or requirement gap.
- **Severity/confidence:** Low impact; high confidence in code/requirement
  conflict, medium in its effect on users.
- **Evidence:** MM-49 describes Simple as calories and protein; MM-179
  explicitly retains all three macro shares. Dashboard and Food render
  `MacroSplitChart` regardless of detail preference.
- **Expected/observed:** the product has not stated whether Simple limits all
  overview content or only target progress bars; current code follows
  MM-179.
- **Impact/remediation:** users seeking simpler detail may still see carbs
  and fat. Product owner must clarify before a visual change; preserve the
  required pie until then.
- **Verification:** requirement/source inspection; no Simple-mode screenshot.

### PD-03 — Add-food sheet exposes multiple entry modes beside manual entry

- **Classification:** design/usability improvement.
- **Severity/confidence:** Low; medium confidence in source arrangement,
  low confidence about actual first-view competition.
- **Evidence:** `AddFoodSheetState.build` at
  `apps/mobile/lib/src/food/add_food_sheet_state.dart:348-530` composes
  Search, Scan, Saved, Estimate, recents and a manual form with method,
  amount, nutrition basis, macro/calorie fields, meal and save. The design
  direction describes Search/Scan/Quick add and Recent as the default
  choices; MM-167 requires portion/basis data and does not authorize removing
  it.
- **Impact/remediation:** multiple routes may compete with a first search,
  but the sheet fold and user comprehension were not observed. Render at
  phone size and test novice search/recent versus manual entry before
  proposing a flow change.
- **Verification:** code/test inspection only; no sheet render or user test.

## Sources and evidence

The chair returned current platform/accessibility sources and four HCI
papers. The designer evaluated summaries rather than directly retrieving
those sources; full URLs, dates, supported claims and limits are in
`findings/research.md`. Directly relevant sources include W3C Pointer
Gestures/Resize Text/error guidance, Apple Accessibility/VoiceOver, Android
accessibility docs, Cordeiro et al. (2015) food-journaling studies, Epstein
et al. (2015) general personal informatics, and Silva & Epstein (2021).
They do not establish the effect of macro-chart prominence on novice task
comprehension.

Evaluated source URLs include
https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html,
https://developer.apple.com/design/human-interface-guidelines/accessibility,
https://depstein.net/assets/pubs/fcordeiro_chi15.pdf, and
https://depstein.net/assets/pubs/lsilva_dis21.pdf. The designer received the
chair's research summary rather than independently fetching these sources.

## Research

Status: `performed` through the chair-delegated path after direct
specialist retrieval was blocked. Question: does displaying all three macro
energy shares with target bars before meals improve routine novice meal-log
comprehension enough to justify first-view prominence? Trigger: explicit
owner request for externally grounded modern mobile fitness guidance.
Evidence is insufficient to support either increased or decreased
prominence. Preference and comprehension are different outcomes; keep
MM-176/MM-179 unchanged pending owner decision and novice task testing.

## Confidence and limitations

High confidence that the stored-font geometry overlaps, corroborated by
image, source and widget test. Lower confidence about first-view sheet
competition and novice burden. No emulator/device or user study occurred.
Light/Dark/Food and enlarged-text FAB states remain unverified.

## Acceptance criteria and edge cases

Retain the Add food action while ensuring no FAB overlap with chart labels,
captions or controls at 360×800; also check themes, Food, enlarged text and
scrolling. Keep the full macro split unless product owner changes MM-179.
Inspect initial and selected-food amount states of the sheet before any
route simplification; retain required measurement and nutrition-basis
information.

## Dependencies

UX & accessibility owns user task choices and accessibility; QA/Flutter
verify geometry and interaction states; product owner decides Simple detail.
The owner should test comprehension (correctly distinguish target progress
from energy share) separately from preference.

## Safety concerns

Do not hide meaningful uncertainty or safety information in the name of
visual simplicity. No new safety finding within this visual scope; not
clinical/nutrition clearance. No personal or private data was used in
research.

## Unresolved product decisions

Does Simple detail apply to the macro-energy chart or only progress bars?
Product owner decides. No change to MM-176/179 is inferred from visual
preference or the indirect studies.

## Verification

Specialist inspected code, requirements, design material and stored goldens;
did not run tests or emulator. Parent's font-calibrated geometry probe
reproduced the overlap. No device, large-text, user, VoiceOver or TalkBack
verification.

## Targeted challenges

QA independently assessed PD-01 as visible in the stored golden and
consistent with source layout, while correctly distinguishing that from a
current runtime result. Parent then reproduced it with the geometry guard
and the bundled production fonts. UX answered the bounded prominence
question after delegated research: evidence is insufficient to change the
design. See `findings/qa.md` and `findings/research.md`.
