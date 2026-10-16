# Review: product-designer

Reviewer: product-designer role, read-only subagent of the parent session acting as chair, 2026-10-15. Run
`mm326-water-bar`; baseline `feature/water-glasses` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-326 (rewritten for the bar); `MmProgressBar`, `usePoured`, `MmSection`, `MmProgressKind`,
`MmProgressWeight`, `MacroBar`, the progress, water and section CSS, `tokens.css`, `WaterSection`, the
`FoodScreen` call site; `design/interaction-and-motion.md`, `design/color-and-theme-system.md`,
`design/screen-direction.md`; the previous run's decision; 19 renders. No hashes.

## Existing facts versus proposals
The hero bars are 8 px (emphasized) and 6 px, square-ended, in `slow`. The water bar was 14 px, rounded,
1,200 ms on an ease-out quint, with a ripple and a front-edge slosh that moved -4, +3, -1, 0 px. The meter
is re-keyed on opening; `WaterSection` is not keyed by day. Dark water was about 5 L* from Dark protein.

## Audit coverage
Mode change. Not inspected: tests, a device, Dark and Martian pour frames, tab remounts.

## Novice mobile experience (when UX/product design is assigned)
Walked: scrolling to Water (passes; the loudest graphic below the hero, PD-1); "+" then Glass (passes; a
snap then a shimmer, PD-4; a tab and a hairline at the front, PD-2, PD-5); fold, open, goal reached, no
goal (all pass).

## Findings
- **Answer first: mostly yes**; it should stay a bar of `MmProgressBar`. Full width and the pour are the
  owner's; its own colour is justified in principle; 14 px is not.
- **PD-1 (should-fix).** Use the emphasized macro bar's weight (8 px), not a new `prominent` 14 px.
- **PD-2 (should-fix).** The front-edge slosh reverses direction (overshoot) and draws as a tab; remove it,
  keep the ripple.
- **PD-3 (should-fix).** `--water` lacks figures, and Dark water is about 5 L* from Dark protein; move it
  10 L* away and record measured figures.
- **PD-4 (consider).** The ease-out quint covers 75% in 250 ms; try ease-out cubic so the travel reads.
- **PD-5 (should-fix).** A hairline seam ahead of the front edge mid-pour.
- **PD-6 (consider).** Check whether the pour repeats on every visit to Food.
- **PD-7 (consider).** The rounded front end differs from the hero's square one; keep it, give the reason.

## Sources and evidence
Repository files and renders only.

## Research
Unnecessary; colour figures hand-computed, to be replaced by measured ones.

## Confidence and limitations
Medium; static frames, Light pour only, no hashes.

## Acceptance criteria and edge cases
Proposed: no heavier than the hero's emphasized bar; no motion property reverses; measured colour
figures; pour frames in three palettes. Edge cases: draining to 0, full, two quick adds, a day change.

## Dependencies
ux-accessibility: contrast, reduced motion, the ripple's vestibular load. Chair: tab remount, PD-3.

## Safety concerns
None in remit.

## Unresolved product decisions
PD-3 hue; PD-4 feel; PD-1's 10 px fallback.

## Verification
Source and renders only.

## Targeted challenges
Asks ux-accessibility to challenge PD-1 and PD-2.
