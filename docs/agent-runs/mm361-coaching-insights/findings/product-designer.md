# Review: product-designer, run `mm361-coaching-insights`

Saved by the chair, as returned by the read-only reviewer (Claude Opus 5.5 subagent, 2026-10-17).

## Scope and traceability
Read-only, from the frozen brief, no peer report seen. Requirements read: MM-362, MM-370; others through
`design/screen-direction.md` rules 1, 2, 4, 7, 9. Baseline `design/inline-insights-and-grades` + working tree;
hashes not computed. Source: `FoodGrade.tsx`, `InlineInsight.tsx`, `RowWithInsight.tsx`,
`MealSection.tsx:70-132`, `FoodDayHeader.tsx`, `FoodSearchResults.tsx:30-63`, `FoodAmountStep.tsx:240-262`,
`WorkoutExerciseCard.tsx:121-135`, `MmPopover.tsx`, `ui.css:925-960`, `coach.css:57-110`, `food.css:75-140`,
`CoachSettingsScreen.tsx`, `CoachAreaScreen.tsx`, `RecentInsightsSection.tsx`; siblings `EasyToMissLine.tsx`,
`InsightCard.tsx`, `ReportsCard.tsx`. Renders: all 21 in martian; light and dark for food, dashboard, workout,
popover and settings.

## Sibling question
| Part | Like its siblings? | Verdict |
|---|---|---|
| Line under a food entry | Mostly: icon in the method column, text in the name column, chevron in the more column | Not on weight: larger than the entry's detail lines and than the same sentence in Recent insights (PD-1) |
| Line under a Dashboard row | Yes, same group child, no hairline | Same weight problem (PD-1) |
| Line in the workout card | Sits above "Last time": advice before its fact | PD-5 |
| Grade badge | Pairs with kcal and with `FoodTrustMark` | Holds for "?", not for graded letters (PD-4) |
| Popover | Same tokens as `MmMenu` | Overflows the edge (PD-2) |
| Recent insights | Built as `ReportsCard` | Does not fold like it (PD-6) |
| Settings > Coach | Rows open screens like Pause; switches in groups | Area switch in the area screen is right; tip rows lack icons (PD-7) |

**Area switch:** agree with the design, disagree with MM-364's text: a row that opens and switches has two
targets, unlike any Settings sibling; the rows state their status; one extra tap for a rare action. Amend MM-364.

## Novice mobile experience
Task 1 passes apart from PD-1 (a four-line paragraph under a three-line entry outweighs it). Task 2 passes on the
entry, fails on the meal header (PD-2). Task 4 passes; the area-off state differs (PD-8). A graded letter's
meaning is in words only on the amount step; "B-" in the day header has no noun and no route to an explanation
(PD-3).

## Findings
- **PD-1 (high), usability problem by inspection.** `coach.css:98` sets `--type-body`, the size of the entry name
  and row titles, wrapping to 3-4 lines; on dashboard-with-insights about 210 of 550 px of the group is coach
  prose. With every qualifying item shown, density must come from weight. Set the line to `--type-caption` in
  `--text2`, keep the 48 dp target and the 20 dp info icon. Acceptance: the row title is the largest text of each
  row+line pair; the line is no taller than the row.
- **PD-2 (high), reproducible defect.** `MmPopover.tsx:39-40` never clamps the left edge; food-meal-grade-why is
  cut off in every palette; any trigger with its right edge under about 316 px overflows. Clamp to 16 px, fall
  back to the trigger's left edge. Stories from the meal and day headers. A BUG ticket and regression test if it
  survives into the build.
- **PD-3 (medium), usability problem by inspection (rule 2).** A graded badge is a bare letter; in the day header
  it has no word. (a) Make every badge a button that opens the same popover explaining the grade, or (b) add the
  word. (a) also resolves PD-4.
- **PD-4 (medium), improvement.** Graded and "?" share an outlined pill but only "?" presses; every badge takes a
  48 dp slot and the method line may now wrap. Apply PD-3(a), or a 40 dp slot.
- **PD-5 (medium), improvement (rule 9).** The workout line sits between the name and "Last time"; place it after
  "Last time" and the suggestion, before the sets. Training: can the line and `progressionText` both advise?
- **PD-6 (medium), usability problem (rule 7).** Recent insights opens expanded with five rows and pushes the next
  section below the fold; the empty state opens too. Fold to the summary as Monthly reports does.
- **PD-7 (low), rule 2 deviation.** Tip rows have no icon; give each one or state the reason in MM-364.
- **PD-8 (low), improvement.** Master off says so on each area row; an area off shows its tips as on with only the
  section summary. Treat them alike.
- **PD-9 (low), defect.** "On · 1 tips" (`CoachSettingsScreen.tsx:36`).
- **PD-10 (low), documentation gap.** "Demo chicken and rice" is C+ in search but B on the log; the Snacks popover
  says 58% but the drawn entries give about 68%. Make the figures agree.

## Research
Unnecessary: visual-hierarchy judgments on repository rules.

## Confidence and limitations
High for PD-1, PD-2, PD-9, PD-10; medium otherwise. No large-text renders; no before render of Food.

## Dependencies
ux-accessibility (PD-3(a), PD-1 at large text); training (PD-5); coaching/safety (is "Large portion" a
food-composition line under an eating-disorder history; is "That is what a well-run cut looks like" praise
MM-108 forbids).

## Unresolved product decisions
"One line, expandable": one sentence or one visual line (recommend PD-1, no truncation). MM-364 amendment.

## Verification
Nothing run.
