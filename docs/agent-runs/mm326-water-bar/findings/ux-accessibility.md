# Review: ux-accessibility (the UX guard)

Reviewer: ux-accessibility role, read-only subagent of the parent session acting as chair, 2026-10-15. Run
`mm326-water-bar`; baseline `feature/water-glasses` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-326; `MmProgressBar`, `usePoured`, `MmSection`, the progress, water and meter CSS, `tokens.css`,
`WaterSection`, the `FoodScreen` call site, `useLoaded`, `WelcomeStep` (the reduced-motion precedent), the
Water stories and MM-326 tests; 19 renders. No hashes.

## Existing facts versus proposals
The bar is `aria-hidden`; the summary in the header toggle carries the figures. The meter is outside the
folding body and re-keyed only on opening. Under reduced motion the keyframes end in the still state.
`usePoured` starts empty whatever the motion setting. The section is not keyed by day.

## Audit coverage
Mode change. Not done: TalkBack, 200% text, a phone; reduced motion read, not rendered.

## Novice mobile experience (when UX/product design is assigned)
Walked: reading the bar, a goal with nothing logged, folding, opening again, adding a glass, the goal,
removing, the screen reader: all pass. Reduced motion: fails in one detail (UX-1). Day change: surveyed
(UX-2).

## Findings
- **Answer first: yes, mostly**; the differences are owner-directed or stated, except reduced motion.
- **UX-1 (should-fix).** Under reduced motion the bar blinks empty for a frame or two on appearing and
  opening; start at the level when reduced motion is set, with a test; a BUG ticket.
- **UX-2 (should-fix).** A day change moves the bar as if water were added, and may drain to 0 while the
  day loads; draw a new day's bar anew once its drinks are in.
- **UX-3 (consider).** Light's track is about 1.06:1 to the canvas; change it for every bar or not at all.
- **UX-4 (consider).** Re-pouring on opening briefly shows less water; say the summary is exact.
- **UX-5 (consider).** A hairline ahead of the fill mid-pour.
- Fill contrast against the track, by hand: Martian 4.2, Dark 6.2, Light 3.0 (just passes).

## Sources and evidence
W3C Understanding SC 2.3.3, https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html;
SC 2.2.2, https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html; SC 1.4.11,
https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html; all accessed 2026-10-15.

## Research
Performed, partial.

## Confidence and limitations
Medium; nothing executed.

## Acceptance criteria and edge cases
Proposed: reduced-motion first paint; the day change; adding past the goal leaves the bar still.

## Dependencies
react-capacitor/QA: UX-1, UX-2 frames. product-designer: UX-3, UX-5. Chair: UX-2 capture, UX-4.

## Safety concerns
None.

## Unresolved product decisions
UX-2: pour from empty or move straight on a day change; UX-3: the Light track.

## Verification
Tests inspected, not run.

UX guard: pass

## Targeted challenges
None.
