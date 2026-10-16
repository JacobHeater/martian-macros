# Review: ux-accessibility (the UX guard)

Reviewer: ux-accessibility role, read-only subagent of the parent session acting as chair, 2026-10-14.
Run `mm305-water-micros`; baseline `14aa735` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-310, MM-311, MM-313; `food/{MicrosPanel,CalorieHero,WaterSection,FoodScreen}.tsx`,
`ui/{MmNutrientRow,MmProgressBar,MmSegmented,MmSwitchRow,NumberEntry,MmOverlays,SectionLabel}.tsx`,
`dashboard/WaterRow.tsx`, `settings/NutritionGoalsSection.tsx`, `data/SqlWaterRepository.ts`,
`domain/food/micros/Micronutrient.ts`, `format/nutrientAmount.ts`, `theme/tokens.css`, the relevant
`ui.css` and `food.css` rules, `Food.stories.tsx`, `Today.stories.tsx`. Fourteen Martian captures. No
hashes.

## Existing facts versus proposals
Facts by file and line; remediations are proposals. Contrast calculated from token hex values (WCAG
relative luminance), not sampled.

## Audit coverage
Mode change. Walked: A reading a nutrient on Micros; B the Dashboard one-tap add and Undo; C Food Other
330 ml then remove with Undo; D Settings sodium limit on, type 80. Surveyed: care-team, empty, goal
reached. Not inspected: MmButton semantics, `parseNumber`, Coach hero, TalkBack, device, text scaling,
reduced motion.

## Novice mobile experience (when UX/product design is assigned)
To interpret: "reference" (no route to its meaning), "from 4 of 7 foods" (clear), "No data yet" (never
drawn), Glass and Bottle (no size), "+" (no word), "Full detail" in a Settings subtitle. Competing:
"+ Add food" in the app bar beside the bare water "+". Recovery: Dashboard add has Undo; Food add does
not (delete the row, which has Undo); Other closes by a second tap.

Walkthrough: A1 pass; A2 fail (UX-6); A3 weak (UX-8). B1 fail (UX-3); B2 pass. C1 pass but sizes
unknown; C2 pass; C3 fail (UX-2: no announcement, focus lost); C4 pass in source, not drawn (UX-1). D1
pass; D2 fail against MM-311 (UX-4); D3 fail (UX-7).

## Findings
- **UX-1 (blocking).** States in remit have no story: a "No data yet" row; kidney and under-19 lines; no
  profile; Standard detail with Micros remembered; sodium under the limit with coverage; a water entry
  removed with Undo; Other refused; the sodium limit refused; the kidney Settings subtitle. MM-310's
  "Micros Partial" story does not exist. Fix: add them in three palettes; re-review those only.
- **UX-2 (should-fix).** Glass, Bottle and Other on Food give no status message; saving Other unmounts the
  field and focus falls to the document (WCAG 4.1.3). Fix: a snack naming the day shown, with Undo;
  focus back to Other after a save.
- **UX-3 (should-fix).** No sizes on the water buttons; the Dashboard "+" has no visible word though MM-313
  says "Add a glass"; Other's accessible name lacks the word "Other" and no expanded state. Fix: sizes on
  the buttons; a visible label or amend MM-313; "Other amount of water" with its state.
- **UX-4 (should-fix).** The sodium refusal says "That value looks off. Check it.", not MM-311's range
  sentence. Let `NumberEntry` take the caller's refusal message; same for the water goal and Other; a
  regression test.
- **UX-5 (should-fix).** MM-311's over-limit wording differs from the build; the build reads well. Update
  the ticket.
- **UX-6 (should-fix).** "reference" has no route to its meaning; a novice may read it as a target. One
  line at the top of the panel; wording to micronutrients and coaching.
- **UX-7 (should-fix).** Below Full detail the sodium limit shows nowhere; the subtitle points at another
  row. Say so under the number row.
- **UX-8 (consider).** Each row is 2-3 separate nodes; a visually hidden sentence per row; verify on
  TalkBack; how "µg" is spoken unverified.
- **UX-9 (should-fix).** "Nothing logged yet today." on past days, and duplicated. A bug ticket and
  regression test.
- **UX-10 (consider).** Marker on fill 1.6:1 (Martian), 1.8:1 (Dark), 3.2:1 (Light); exempt under 1.4.11
  as the figures are text, but the bar's one message is lost.
- **UX-11 (consider).** The switch's group name is still "Macro picture".

## Sources and evidence
- W3C, Understanding SC 4.1.3 Status Messages, https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html,
  updated 2026-05-11, accessed 2026-10-14.
- W3C, Understanding SC 1.4.11 Non-text Contrast, https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html,
  updated 2026-09-06, accessed 2026-10-14.
- W3C, Understanding SC 2.5.3 Label in Name, https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html,
  updated 2026-04-05, accessed 2026-10-14.

## Research
Performed, direct (WebFetch).

## Confidence and limitations
Medium. Static only.

## Acceptance criteria and edge cases
Proposed: each water add on Food announced, focus kept; the refusal states the range; a past empty day
never says "today"; every UX-1 state has a story. Edge: a double tap on "+" builds the second snack from
a stale total; water added to a past day carries the current clock time.

## Dependencies
Micronutrients and coaching (UX-6); product-designer (UX-3, UX-10); chair (tickets for UX-4, UX-9).

## Safety concerns
None in remit.

## Unresolved product decisions
The Dashboard water action as "+" or a visible "Glass" label.

## Verification
None run. Requested: UX-1 stories, UX-4 and UX-9 tests, a TalkBack pass.

## Targeted challenges
**Re-review 1 (2026-10-14), after the chair drew every UX-1 state and changed the design.** Captures in
`shots3` (Food micros Martian and Light, micros-not-stated, micros-kidney, water-removed,
water-other-refused; Today water-glass-added, micros-remembered; Settings sodium-limit-refused) and the
current source of `MmNutrientRow`, `MicrosPanel`, `WaterSection`, `WaterRow`.

- UX-1 closed: every listed state is drawn; the no-profile Micros state is accepted as unreachable (the
  Food screen needs a setup).
- UX-3, UX-4, UX-7, UX-8 (in source), UX-9, UX-10, UX-11 closed; UX-6 closed pending micronutrients'
  sign-off of the line's wording; UX-2 partly closed (every add and removal announced).
- **UX-12 (should-fix, new).** Focus does not return to "Other amount" after a save: the ref was on the
  Glass/Bottle container, not the Other button's. A BUG ticket and a regression test.
- **UX-13 (consider, new).** The removal snack does not name the day; the Food add snack builds its total
  from the last render, as the Dashboard did before its fix.

**UX guard: pass** (no open blocking finding).
