# Review: product-designer

Reviewer: product-designer role, read-only subagent of the parent session acting as chair, 2026-10-14.
Run `mm305-water-micros`; baseline `14aa735` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-305, MM-310, MM-311, MM-313; `brief.md`; `design/screen-direction.md`,
`design/color-and-theme-system.md`, `design/design-system-implementation.md` (grep);
`food/{MicrosPanel,CalorieHero,WaterSection}.tsx`, `ui/MmNutrientRow.tsx`, `dashboard/WaterRow.tsx`,
`settings/NutritionGoalsSection.tsx`, `ui/ui.css:759-800,1071-1093`, `food/food.css:27-46,185-190`, the
story list. No hashes (no shell).

## Existing facts versus proposals
`CalorieHero` is shared by Dashboard, Food and Coach; Micros is one remembered preference; the status row
is drawn after the picture. Nutrient fill is `var(--info)`; the marker is 2 px `var(--text)` at 0.8.
`info` has one job in the colour system ("explanations, calibration status"). The uppercase group label is
the only `text-transform: uppercase` in the app.

## Audit coverage
Mode change. All 24 captures read against source. Not inspected: Dashboard and Coach heroes with Micros
(no story), Coach generally, tests. Methods: source and static Storybook PNGs.

## Novice mobile experience (when UX/product design is assigned)
Surveyed: "how much iron today" (visible in the first viewport; the tick's meaning is in a caption; a full
bar hides the tick); "am I over my sodium limit" (plain note; marker same as references); "log a glass from
the Dashboard" (bare "+" beside a chevron); "fix yesterday's water" (clear, but the heaviest block).

## Findings
- **PD-1 (blocking for Dashboard and Coach; owner decision for Food).** The Micros hero is about 1.4
  screens; the global preference pushes the Dashboard's strip and rows and the hero's status line below
  the fold, against rule 7. Remediation (preferred): Food is the Micros home (rule 4, one home per fact);
  Dashboard and Coach offer Grams | Split only and show Grams for a remembered Micros. On Food, ask the
  owner for a rule-7 exception, tighten rows, fold "Also on the label".
- **PD-2 (should-fix).** No story draws Micros on the Dashboard or Coach, a "No data yet" row, kidney or
  under-19 lines; MM-310 lists a "Micros Partial" story that does not exist.
- **PD-3 (should-fix).** `--info` as a data fill overloads a semantic token and reads as protein blue in
  Light and Dark; the `--text` marker is about 1.8:1 over the fill (hand calculation). Use a neutral
  fill (`text3` on `track`) and a marker taller than the bar, or with a gap, at 3:1 in every palette.
- **PD-4 (should-fix).** The Dashboard water "+" has no visible label and pushes that row's chevron out of
  the shared column (x≈303 against x≈367); a second "+" style. Keep the chevron in its column and put a
  labelled "+ Glass" before it, or reuse the meal-header add style with the owner's leave. A ring after
  the press: refer to UX.
- **PD-5 (should-fix).** The Food water section outweighs the meals: an add row, three 48 dp buttons, a
  dead gap, five rows with repeated icons; "Glass"/"Bottle" do not show their size. Label sizes, remove
  the extra margin, optionally fold rows past three.
- **PD-6 (consider).** "Your limit" and "reference" share one marker; a ceiling glyph by form, not colour.
- **PD-7 (should-fix, low).** The uppercase group label is a local style; make it a `SectionLabel`
  variant or use the plain one. Rows about 66 px; notes under the name could save about 200 px.
- **PD-8 (should-fix, low).** The empty Micros line always says "today", even on a past day, and repeats
  the screen's own line. Drop it; a bug ticket and regression test for the wording.
- **PD-9 (consider).** Settings: the sodium row reuses `tune` (Nutrition detail's icon); the field shows
  "2300" while elsewhere "2,300"; "Daily sodium limit" then "Sodium limit". Own icon, "Amount" or fold
  into the switch row.

## Sources and evidence
None external.

## Research
Unnecessary: repository rules and renders.

## Confidence and limitations
Medium-high. PD-1 on Dashboard and Coach inferred from source; contrast by hand from token hex values.

## Acceptance criteria and edge cases
Proposed: Dashboard with Micros remembered shows the strip in 915 px; the marker 3:1 against fill and
track; no nutrient bar uses a semantic or macro token; the water action labelled, its chevron aligned;
sizes on the buttons; the empty text names the shown day or is removed.

## Dependencies
UX: marker contrast, focus ring, the "+" label. Coaching: over-limit wording drift. Micronutrients and
safety: folding "Also on the label".

## Safety concerns
None in the visual remit.

## Unresolved product decisions
Micros on Dashboard and Coach or Food only (chair's choice, owner may rule); rule-7 exception on Food;
the meal-header "+" for water.

## Verification
Source and render inspection only.

## Targeted challenges
None.
