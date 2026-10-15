# Review: ux-accessibility (the UX guard)

Reviewer: ux-accessibility role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm326-water-glasses`; baseline `4527f32` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-326; `MmTally`, `MmSection`, the tally, rhythm and chevron CSS, the palette tokens and reduced
motion, `WaterSection`, `waterGlasses`, `glassesLabel`, the siblings, the Water stories and the MM-326
tests; nine renders. No hashes.

## Existing facts versus proposals
One `role="img"` with a label inside the region "Water", after the header row and before the rows; outside
the folding body (tested). States drawn by shape and fill, not colour; reduced motion stops the fill
transition. "Glasses" was heard, never seen.

## Audit coverage
Mode change. Not done: TalkBack, 200% text.

## Novice mobile experience (when UX/product design is assigned)
Walked nine steps: how far (pass), how many to go (weak, UX-1), tapping a mark (friction, UX-2), the half
mark, the last mark held, the goal, folded, a goal with nothing yet, no goal, 26 glasses: all pass. Screen
reader: sensible order, heard once.

## Findings
- **Answer first: yes**, it behaves like its siblings; the differences are justified.
- **UX-1 (consider).** The unit "glass" is never visible; say glasses in the summary or record why not.
- **UX-2 (consider).** The marks look tappable and do nothing; keep them inert unless the owner decides.
- **UX-3 (consider).** "Half a glass of 8" breaks the pattern.
- **UX-4 (consider).** The ticket and a story say two rows; 26 is three.
- **UX-5 (consider).** The folded capture may be mid-transition; re-capture.
- Non-text contrast of the empty ring, by hand: Martian about 6.3:1, Dark 3.6:1, Light 3.3:1 (narrow).

## Sources and evidence
W3C, Understanding SC 1.4.11 (WCAG 2.2),
https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html, accessed 2026-10-14; WAI-ARIA 1.2, `img`.

## Research
Performed, partial.

## Confidence and limitations
Medium; nothing executed.

## Acceptance criteria and edge cases
Proposed: a test that no goal draws no glasses.

## Dependencies
product-designer: UX-1, UX-2. Chair: UX-5.

## Safety concerns
None; marks stop at the goal.

## Unresolved product decisions
UX-2: a pressable strip.

## Verification
Tests inspected, not run.

UX guard: pass

## Targeted challenges
None.
