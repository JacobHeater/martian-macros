# Review: product-designer

Reviewer: product-designer role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm326-water-glasses`; baseline `4527f32` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-326; `MmTally`, `MmSection`, `WaterSection`, `waterGlasses`, `glassesLabel`, the section, rhythm,
tally, progress and chevron CSS, `food-meal-marker`, the ion and protein tokens; the siblings `MealSection`
and `MmRhythmStrip`; `design/screen-direction.md`, `design/color-and-theme-system.md`,
`design/visual-language.md`; nine renders. No hashes.

## Existing facts versus proposals
The tally reuses the rhythm strip's dot, size and fill, packed left on rows of at most 12. The meter sits
outside the header button and stays when folded. The goal check is the meal's marker. In Martian `--ion`
and `--protein` share `#43f5e0`; ion means "estimated" in the design docs. The ticket said "no colour of
its own" and "a second row", both untrue of the code.

## Audit coverage
Mode change. Not inspected: tests, roadmap, motion, a device.

## Novice mobile experience (when UX/product design is assigned)
Walked: a goal and nothing yet (partly fails: nothing visible says a mark is a glass, PD-2); "+" then Glass
fills one mark (passes, the strongest property); later in the day (passes, unit unnamed); the goal reached
(passes, quiet); folded (passes for the tally; chevron unclear, PD-6).

## Findings
- **Answer first: yes**, it is composed of its siblings (MmSection header, the rhythm dot, the meal marker)
  and should stay a separate `MmTally`, not become the rhythm strip (a dot there is a day) nor a bar (the
  owner chose glasses over a bar). Hierarchy acceptable; it does not outweigh the hero.
- **PD-1 (should-fix).** Done marks are Ion ("estimated"), the protein colour in Martian. Either keep Ion,
  correct the wording and ticket the collision, or move both strips to a neutral.
- **PD-2 (should-fix).** Nothing visible says a mark is a glass; name glasses in the summary.
- **PD-3 (consider).** The fill transition is inherited; say "no animation" means no celebration.
- **PD-4 (should-fix).** Row wording wrong in the ticket and a story; give the reason for the packed grid.
- **PD-5 (consider).** A smaller dot for the tally if the owner finds 2-3 rows loud; no change by default.
- **PD-6 (consider).** Re-capture the folded story after the chevron settles.

## Sources and evidence
Kivetz, Urminsky and Zheng (2006), "The Goal-Gradient Hypothesis Resurrected", JMR 43(1):39-58 (RePEc
record https://ideas.repec.org/p/feb/natura/00658.html, retrieved 2026-10-14): discrete stamp-card progress speeds effort toward a reward; indirect for
water.

## Research
Performed, partial.

## Confidence and limitations
Medium; static frames, no hashes, tests unread.

## Acceptance criteria and edge cases
Proposed: the visible summary names glasses. Edge cases: one glass, goals between glasses, 13 marks.

## Dependencies
ux-accessibility: contrast, reduced motion, redundancy of a named summary and a named meter.

## Safety concerns
None in remit; asks whether marks past the goal matter (they are capped).

## Unresolved product decisions
PD-1 colour; PD-5 size.

## Verification
Source and renders only.

## Targeted challenges
None.
