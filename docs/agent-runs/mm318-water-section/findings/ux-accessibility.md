# Review: ux-accessibility (the UX guard)

Reviewer: ux-accessibility role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm318-water-section`; baseline `75f00ba` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-318, MM-317, rule 9; `WaterSection`, `WaterEntryTile`, `AddWaterSheet`, `showAddWaterSheet`,
`NumberEntry`, `logWater`, `MealSection`, `showAddFoodSheet`, `MmSheet` focus lines, `MmSwipeToRemove`,
the water tests; six captures. No hashes.

## Existing facts versus proposals
Water is a named region with a fold, its total in the summary, "+" heard as "Add water" opening a dialog
of that name; rows like meal rows with swipe and Delete, both with Undo; focus returns to "+" after the
sheet (test). `logWater` stamps the current time on a past day.

## Audit coverage
Mode change. Not inspected: Light and Dark section renders, Goal Reached, AddFoodSheet internals, focus
after a menu delete, contrast, text scaling, TalkBack.

## Novice mobile experience (when UX/product design is assigned)
Walked: a bottle to yesterday (passes, but the row shows today's time, UX-1); another amount (passes,
focus back on "+"); delete and undo (passes visually; repeated amounts sound alike, UX-2).

## Findings
- **Answer first: yes**, Water behaves like the meal sections for a novice and a screen-reader user. Both
  stated differences acceptable.
- **UX-1 (should-fix).** A drink added to a past day shows today's clock time on that day. Leave the time
  out on such rows, or stamp one inside the day.
- **UX-2 (should-fix).** "More actions for 8 fl oz of water" repeats when amounts repeat; add the time.
- **UX-3 (consider).** The inert row gives no feedback; accepted with UX-1.

## Sources and evidence
None external.

## Research
Unnecessary.

## Confidence and limitations
Medium-high; static only.

## Acceptance criteria and edge cases
Proposed: after Bottle on Yesterday the row shows no time from today; unique menu names. Untested:
swipe on a water row, Undo after an add from the Food header, imperial labels in the sheet.

## Dependencies
react-capacitor: unique names, focus after a menu delete. product-designer: the time on past-day rows.

## Safety concerns
None.

## Unresolved product decisions
UX-1: hide the time or stamp one inside the day.

## Verification
Tests inspected, not run.

UX guard: pass

## Targeted challenges
None.
