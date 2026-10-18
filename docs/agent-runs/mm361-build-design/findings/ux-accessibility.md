# Review: ux-accessibility

## Scope and traceability
- Role: ux-accessibility (the UX guard), read-only. Reviewer: Claude Code subagent (claude-fable-5-1), 2026-10-18.
- Run: `docs/agent-runs/mm361-build-design/brief.md`. Mode `change`.
- Requirements read in full: MM-378. MM-362, MM-364, MM-365, MM-367 as cited by the brief and the earlier decision.
- Earlier artifacts: `docs/agent-runs/mm361-coaching-insights/decision.md` and `findings/ux-accessibility.md`.
- Source read: `coach/InlineInsight.tsx`, `SnoozeLength.ts`, `useItemInsightContent.ts`, `FoodEntryInsight.tsx`, `coach.css`, `useInsightKinds.ts`; `settings/CoachAreaScreen.tsx`, `settings.css`; `format/itemInsightText.ts`; the stories, `screenStory.tsx`, `draftInsightKinds.ts`; `ui/MmOverlays.tsx`, `MmDisclosure.tsx`, `MmOption.tsx`, `MmDialog.tsx`, `MmButton.tsx`, `MmListRow.tsx`, `MmSwitchRow.tsx`, `MmSection.tsx`; `engine/InsightSnooze.ts`, `itemInsightKinds.ts`, `ItemInsightKind.ts`, `allowedItemInsights.ts`; `theme/tokens.css`, `ui/ui.css`; `dashboard/DashboardScreen.tsx`; `settings/CoachSettingsScreen.tsx`; `test/coach/inlineInsights.test.tsx`.
- Renders: all 17 in `shots7/` (Martian) and all 8 in `shots7b/` (dark, light).
- Commit f2e8dfe plus the uncommitted tree. Hashes not computed; the chair records them.

## Existing facts versus proposals
- The closed line is one `MmDisclosure` toggle named `Coach: <line>` with `aria-expanded`/`aria-controls`. Open, it shows "The numbers behind this" as `StatRow`s, then "Settings for “<kind>”" and "Snooze…".
- "Snooze…" opens `overlays.options` titled `Snooze “<kind>” for <item>` with four options, `selected: 'week'`. The dialog is `role="dialog" aria-modal` labelled by its title, a `role="listbox"` labelled the same, `role="option" aria-selected` buttons with a hidden "Chosen" on the selected one, and Cancel.
- Focus enters the dialog at its first button and returns on unmount to the element focused before; Escape and the scrim dismiss; the app beneath is inert.
- After a choice the snack says `Snoozed for <item> until <day>` or `… until turned back on`, with Undo; the snack host is `role="status" aria-live="polite"`; a snack with an action stays until acted on and has a labelled Dismiss.
- A snoozed line renders nothing; the engine filter also drops it.
- Settings > Coach > area lists what is snoozed last under an `MmSection` "Snoozed" (an `h2`), one row per snooze titled by the kind with the item and end, and "Turn back on" with a snack and Undo; shown only when something is snoozed.
- Kinds withheld for an eating-disorder history: Portion check, Mostly fat, Waist, Water.
- A week's snooze resumes on `today + 8`.
- Sizes: buttons min-height 48, text kind min-width 48; options min-height 56; the line's toggle min-height 48; icon button 48×48; switch 48.
- Tests cover snooze with Undo, the Snoozed list and Turn back on, a run-out snooze, the Coach tab while snoozed; none asserts focus.

Proposals are in Findings.

## Audit coverage
Walked: W1 open a food's line and read its numbers; W2 snooze for a week and undo; W3 find the snooze in Settings and turn it back on; W4 open the Dashboard's waist line. Surveyed: the workout line, the Coach tab, the kinds lists, the water line, 200% and 320 px renders. Not inspected: `RowWithInsight.tsx`, the snooze repositories, `MmPopover`, `FoodGrade`. Methods: source inspection; static renders; contrast computed from tokens; normative thresholds retrieved. Blocked: no device, no TalkBack, no real-browser focus trace, no 320 px render (UX-3).

## Novice mobile experience
**W1:** the lightbulb and ion caption with a chevron, hairlined to the entry, no second target; the whole caption is the 48 dp toggle; the numbers match the line and the entry's detail; "Settings for “Mostly fat”" establishes the kind's name. Pass. Screen reader: "Coach: … collapsed, button"; expanded in order. Pass.
**W2:** the dialog's title says what is quieted and on what; a check sits beside "For a week" though nothing is chosen while the focus ring sits on "For a day" (marginal, UX-4); after "For a week" the line is gone and the snack says the end day with Undo (pass for touch; focus has nowhere to return to because "Snooze…" was removed with the line: UX-1); Undo brings the line back (focus again lost; pre-existing snack behaviour).
**W3:** the person must recall Settings > Coaching insights > Food (the only earlier cue is "Settings for …"); the owner declined an empty-state hint; the Snoozed row says what, where and until when; only one row draws though the story saves two (UX-2); "Turn back on" with Undo passes for touch, focus lost (UX-1); every "Turn back on" has the same name (UX-5).
**W4:** the line sits inside the group under the waist row; opened, "Now, smoothed 36.25 in" under a row saying 36.5 in needs "smoothed" understood (marginal, UX-7); the two actions stack because the label is long, each 48 dp. Pass.

## Findings
**UX-1 · usability problem found by inspection · medium · high (trace, not run).** `MmDialog` returns focus on unmount to the element focused before, which is "Snooze…" inside the line, removed once the snooze is saved; focus ends on `body`. The same after "Turn back on" (the row, and when last the section, removed with the button) and after the snack's Undo or Dismiss (pre-existing since MM-272). Expected (WCAG 2.2 Understanding 2.4.3): focus on a stable neighbour. Impact: every snooze and Turn back on for keyboard, switch-access and screen-reader users; recoverable. Change: move focus to a stable neighbour before the line or row unmounts; for the snack, return to where it was when shown, if mounted. Acceptance: after choosing a length, `document.activeElement` is a control of the same entry; after Turn back on, a control on the same screen; after Undo, the line's toggle. A bug ticket with a regression test.

**UX-2 · documentation gap (an undrawn state) · medium · high.** The story saves `kind: 'largePortion'`, which is no kind id, so the "until turned back on" row never renders. Change: `kind: 'portionCheck'`; re-capture; the story's `shows` matches `/until turned back on/`.

**UX-3 · verification blocked · medium for the gate's coverage.** `food-narrow-martian.png` lays out identically to the 412 px render: the capture did not apply the 320 px viewport. Change: capture at 320 px, or put a 320 px check on the owner's phone checklist.

**UX-4 · design/usability improvement · low · medium.** `selected: 'week'` marks a length nobody has chosen while focus is on the first option. Change: drop `selected`, or focus the marked option.

**UX-5 · design/usability improvement · low · high.** Every "Turn back on" and every "Snooze…" has the same accessible name; `MmButton` has `name` for this. Change: `name={`Turn back on ${title} for ${item}`}`, `name={`Snooze… ${rule} for ${item}`}`.

**UX-6 · unverified hypothesis · low.** The Snoozed list shows any live snooze of the area's kinds, including a kind now withheld for the person's health answers, offering "Turn back on" for a line that cannot show. Question for safety and product: hide such snoozes.

**UX-7 · design/usability improvement · low.** "Now, smoothed" under a row with the raw figure: a plainer label ("Now, averaged over recent readings")? For the measurement role.

Checks that passed: names and roles as listed; focus on Cancel, Escape, scrim or back returns to "Snooze…" with the line open; every control ≥ 48 dp (WCAG 2.2 SC 2.5.8's 24 px; Android's 48 dp); contrast computed from tokens: ion line Martian ≈ 13.6:1 on canvas, 11.9:1 on surface; dark ≈ 10.6:1; light ≈ 5.1:1 on white, 4.7:1 on canvas (thin margin at 12 px; do not lighten light's ion); ember text buttons light ≈ 4.8:1 and 5.2:1; snack text ≈ 11:1; non-colour cues present; 200% text wraps and stays tied to its row (the overlaps are MM-373, MM-374, the MM-370 proposal); the eating-disorder state shows the protein line only.

## Sources and evidence
Accessed 2026-10-18 via WebFetch: W3C, "Understanding SC 2.5.8: Target Size (Minimum)" (WCAG 2.2), updated 11 May 2026; "Understanding SC 1.4.3: Contrast (Minimum)", updated 06 September 2026; "Understanding SC 2.4.3: Focus Order", updated 09 March 2026 ("When the dialog is dismissed, focus returns to the button or the element following the button"); Android Developers, "Make apps more accessible", updated 2026-09-22 (48 dp targets). No empirical user-research source.

## Research
Status: performed. The current normative thresholds for contrast, target size and dialog focus return, and Android's target guidance. WebFetch of known URLs, direct.

## Confidence and limitations
Medium-high for the walks and names; medium for UX-1 (trace, not run); high for UX-2 and UX-3. No device, no TalkBack, no real-browser focus trace, no 320 px render, contrast computed not measured, the dialog not drawn at 200%, the Dashboard's snooze dialog and the Body Snoozed list not drawn.

## Acceptance criteria and edge cases
Existing traced: the snooze and Undo, the Snoozed list (one snooze, not two), a run-out snooze; "Workouts too" not found as a named test. Proposed: focus assertions (UX-1); a two-row Snoozed story (UX-2); a 320 px render (UX-3). Edge cases: a food name with a comma or quotes in the dialog title; a long item name at 200%; a snooze of a withheld kind (UX-6); the midnight boundary; undo after leaving the screen.

## Dependencies
react-capacitor (UX-1, UX-5); product-designer (UX-4); safety and product (UX-6); measurement (UX-7); the chair (UX-3).

## Safety concerns
Nothing new. The eating-disorder withholding is in place; the snooze introduces no restriction cue and no praise. Not clinical clearance.

## Unresolved product decisions
1. UX-6: hide or keep snoozes of withheld kinds. 2. UX-4: whether a default length is wanted. 3. UX-3: whether the phone check stands in for a 320 px render.

## Verification
Nothing executed. Recommended: the focus regression test (UX-1), the story fix and re-capture (UX-2), the 320 px capture (UX-3), `npx vitest run test/coach test/gallery`, `mm check`.

## Targeted challenges
None yet.

## GUARD verdict
**GUARD PASS**, on the renders supplied: no step in the four walks fails for a touch user at 100% text; names, roles, focus on Cancel/Escape/back, targets, contrast on all three palettes, 200% text and the eating-disorder state pass. The pass does not cover 320 px (UX-3). UX-1 goes to a bug ticket with a regression test, UX-2 is a one-word story fix, UX-3 is a render the chair produces or hands off; none is a blocking usability failure. If the 320 px render shows the entry's trailing slot or the line's icon column failing, that is a new finding for a targeted re-review.
