# Review: product-designer

Reviewer: product-designer role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm318-water-section`; baseline `75f00ba` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-318 and rule 9 of `design/screen-direction.md`; `WaterSection`, `WaterEntryTile`, `AddWaterSheet`,
`showAddWaterSheet`, `MealSection`, `FoodEntryTile`, the head of `AddFoodSheet`, `logWater`, the water rules
in `food.css`, the water stories; all ten captures in `shots4`. No hashes (no shell).

## Existing facts versus proposals
Header, rows, row actions and the sheet container are the meal section's own parts. The two stated
differences: the row not pressable, no copy button. `logWater` stamps `clock.now()` even on a past day.

## Audit coverage
Mode change. Not inspected: tests, `NumberEntry`, the Dashboard row, an Add food render.

## Novice mobile experience (when UX/product design is assigned)
Walked from source and renders: the Water header lines up with the meals; "+" opens "Add water" with the
day; Bottle closes it with a snack and Undo; tapping a row to fix it does nothing (PD-1).

## Findings
- **Answer first: yes**, Water looks and behaves like the meal sections. No copy: justified.
- **PD-1 (should-fix).** The row looks pressable like a meal row but is inert, and "delete and add again"
  re-stamps the time (on a past day, today's). Press opens "Edit water" with the amount; saving keeps the
  time.
- **PD-2 (should-fix).** No story for a goal set with nothing logged, or partway to it.
- **PD-3 (consider).** On a past day Water's chevron sits where an empty meal's does (no copy button); an
  `MmSection` matter, not this ticket's.
- **PD-4 (consider).** MM-318's story list leaves out Water Other Amount.

## Sources and evidence
None.

## Research
Unnecessary: an internal sibling comparison.

## Confidence and limitations
Medium-high. No Add food render; some states Martian only.

## Acceptance criteria and edge cases
Proposed: pressing a drink opens Edit water and keeps its time; stories for the goal states.

## Dependencies
Chair: whether a drink's time is meaningful on a past day.

## Safety concerns
None.

## Unresolved product decisions
PD-1 (decided by rule 9: the chair built it).

## Verification
Source and render inspection only.

## Targeted challenges
None.
