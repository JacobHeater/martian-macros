# Review: product-designer

Run `mm361-build-design`, read-only, from the frozen brief. Reviewer: Claude (Fable 5.1) subagent, 2026-10-18, branch `spec/food-insights-and-snooze`, uncommitted tree (HEAD f2e8dfe). Builds on `docs/agent-runs/mm361-coaching-insights/findings/product-designer.md` and the chair's `decision.md`.

## Scope and traceability
- Canonical inputs read in full: `AGENTS.md`, `agents/roles/product-designer.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, the template, `design/screen-direction.md`.
- Requirements: MM-378 in full; MM-362/363/364/365/366/367/370 through the mm365, mm367 and mm361 decisions.
- Source inspected: `coach/InlineInsight.tsx`, `SnoozeLength.ts`, `useItemInsightContent.ts`, `FoodEntryInsight.tsx`, `coach.css`; `settings/CoachAreaScreen.tsx`, `settings.css`; `format/itemInsightText.ts`, `mealLabel.ts`; `engine/itemInsightKinds.ts`; the stories and `draftInsightKinds.ts`; siblings `train/WorkoutExerciseCard.tsx`, `settings/ThemeSettings.tsx`, `food/FoodCompletenessRow.tsx`, `food/MealSection.tsx`, `foodPacks/FoodDatabaseScreen.tsx`; design system `ui/Overlays.ts`, `MmOverlays.tsx`, `MmOption.tsx`, `MmDialog.tsx`, `MmListRow.tsx`, `MmSection.tsx`, `MmSwitchRow.tsx`, `MmDisclosure.tsx`, `ui.css`, `theme/tokens.css`; `test/coach/inlineInsights.test.tsx` by grep.
- Renders: all 17 Martian in `shots7/` and all 8 dark/light in `shots7b/`.
- Hashes not computed; the chair records them. The stories file moved during review; line numbers in it are approximate.

## Existing facts versus proposals
Facts: the snooze choice is `overlays.options`, the same call as the rest-target chooser, the theme chooser and the completeness question; it pre-selects `'week'`. The message is `overlays.snack(…, { label: 'Undo' })`, as "Removed …". The Snoozed list is `MmSection icon="pause"` + `MmListGroup` + `MmListRow` with a text `trailingAction` "Turn back on", shown only when something is snoozed. The line is `--type-caption` in `--ion` with a 20 dp icon in the row's icon column. `Overlays.options` requires `selected`; `MmOption` says "Chosen" aloud for it; `MmDialog` focuses the first control. The food item label is "<name>, snacks"; the Dashboard items are "Waist" and "Water"; the body kind's title is "Waist: no clear change".
Approved: MM-378's decisions. Proposals: everything under Findings.

## Audit coverage
Mode `change`. Not inspected: `MmSnack`'s source, `FoodEntryTile`, the snooze repositories, `RecentInsightsSection` source, Settings > Coach's top screen. Not rendered: the Snoozed row "until turned back on" (PD-3), the snooze dialog and message from a Dashboard row or a lift, the opened line and the dialog in dark/light, Settings > Coach at 200% or 320 px, "Turn back on"'s own message. Source inspection and Storybook renders; nothing run; no phone.

## Sibling question (MM-318, rule 9)
| New part | Nearest sibling | Same component? | Verdict |
|---|---|---|---|
| Snooze choice | Rest target, Appearance | Yes: `overlays.options` | Matches, except a pre-checked length nothing is set to (PD-2) and a two-line title (PD-6) |
| Snoozed list | "Kinds of insight"; Food database's "Remove" rows | Yes | Matches in all three palettes; the "always" row unseen (PD-3) |
| "Snooze…" and "Turn back on" | "Settings for …"; "Remove", "Change" | Yes: `MmButton kind="text"` | Matches; on the Dashboard the pair stacks (PD-1) |
| Message | "Removed …" with Undo | Yes | Matches |
| The lines, now the app's words | The row's own caption detail; "Last time:" | Yes | Holds in Martian, dark and light; the portion line repeats its row (PD-4) |

## Novice mobile experience
**Task A** (quiet one line for a week and undo it): the chevron says it opens; the caption keeps the entry's name largest; opened, two ember text actions on one line; the dialog shows four rows and Cancel but "For a week" already carries the check while "For a day" carries the focus ring, so the person cannot tell which value will be kept on Cancel (**fails on "which value will be kept"**, PD-2); after choosing, the line is gone and the message offers Undo. **Task B** (find a snooze in Settings and turn it back on): found without a decision; the row says what, where and until when; "Turn back on" with Undo by inspection. The "until turned back on" row is in no render (PD-3). What earns prominence is right on Food and the Dashboard; the opened waist line is where hierarchy slips (PD-1).

## Findings
**PD-1 · design/usability improvement · medium · confidence high (rendered).** In `dashboard-waist-insight-open-martian.png` the opened body ends with "Settings for “Waist: no clear change”" on one 48 px row and "Snooze…" on a second: about 100 px of actions reading as two list rows, where the food line shows the pair side by side. Cause: `.coach-inline-insight-settings` sets only a margin and the kind's title is the catalog's longest. Change: `display: flex; flex-wrap: wrap; column-gap: var(--space-8)` so the pair is one row when it fits; and the question below on a shorter body-area title. Acceptance: the two actions share a row at 100% on every area's line at 412 px, or wrap with the dialog's spacing.

**PD-2 · usability problem found by inspection · medium · confidence high.** Every sibling passes the value in force as `selected`; the snooze passes `'week'` when nothing is set, so the check and the spoken "Chosen" claim a state that does not exist, and the render shows two emphasised rows at once. Change: offer the four lengths with no check (`Overlays.options.selected` made optional), or make a wanted default the first row. Acceptance: no row is checked before the person chooses; Cancel leaves no snooze.

**PD-3 · reproducible story defect and documentation gap · medium · confidence high.** `CoachSettingsFoodSnoozed` saves a second snooze with `kind: 'largePortion'`, which is no kind id (`portionCheck`), so the screen filters it out and the render shows one row; the story's comment and MM-378's UI/UX ("one timed, one always") are untrue of the render. Change: `kind: 'portionCheck'`; re-capture; a story-level check that the story's `shows` names both rows; a bug ticket. Also unseen: the snooze dialog and message from a Dashboard row and from a lift.

**PD-4 · design improvement · low · confidence medium.** The Garlic bread row's detail and the line under it say the same fact twice in two voices and two units; only the question is new. Change (coaching): lead with the question and leave the figures to "The numbers behind this". Not a blocker.

**PD-5 · documentation gap · low.** The app's item label is "Peanut butter, snacks"; MM-378 and the Coach tab's design data say "snack". Change the ticket and the preview data, not the app.

**PD-6 · design improvement · low · confidence medium.** The dialog's title runs to two lines where every sibling's is one; no change required at 100%; no 200% render exists.

**Palettes (no finding).** `--ion` reads as a voice apart from `--text2` captions in all three palettes; ember text and the pause icon match their siblings.

## Sources and evidence
None consulted externally.

## Research
Status: unnecessary (sibling-matching and hierarchy against the repository's own rules).

## Confidence and limitations
High for PD-1, PD-2, PD-3, PD-5; medium for PD-4, PD-6. No hashes; the stories file changed under review; several states unrendered; nothing run on a phone.

## Acceptance criteria and edge cases
Proposed: the opened-line actions share a row or wrap on every area at 412 px; no length is checked before a choice; `CoachSettingsFoodSnoozed` renders both a dated and an always row; the dialog at 200% keeps all four options and Cancel in view. Edge cases: a long food name wrapping the dialog title; a 320 px Snoozed row; an area with several snoozes.

## Dependencies
ux-accessibility (PD-2's announcement; PD-6 at 200%); coaching (PD-1's title question, PD-4, PD-5); react-capacitor (`Overlays.options.selected` optional); the chair (PD-3's ticket and re-capture).

## Safety concerns
None found in the visual remit; the eating-disorder render shows the protein line only. Not clinical clearance.

## Unresolved product decisions
1. May the body kind's title be shorter than "Waist: no clear change"? 2. May the portion-check line lead with the question? 3. May `Overlays.options` take no `selected`? Authority: the owner for 1 and 2 if the panel disagrees; the chair for 3.

## Verification
Nothing run. Recommended: fix PD-3 and re-capture; a story for the opened Dashboard line in three palettes and for the dialog at 200%; the gallery and `unseen` suites.

## Targeted challenges
None yet.

## Verdict
**Passes the design gate from the product-designer lens, with three changes to make with the build:** PD-1, PD-2, PD-3. PD-4 to PD-6 are improvements and documentation alignments. The BLOCK/PASS call on accessibility is the UX guard's.
