# Review: ux-accessibility

## Scope and traceability
- Role: ux-accessibility (UX guard), run `mm301-waist-in-place`. Reviewer: a read-only Claude Code subagent (Opus 5.5), one independent pass; no peer reports seen.
- Requirements: MM-301, MM-294, MM-272, and `docs/agent-runs/mm291-weigh-in/decision.md`.
- Baseline: `feature/dashboard-waist-in-place`, uncommitted on `0ad476a`.
- Inputs: `brief.md`; `dashboard/WaistRow.tsx`, `DashboardScreen.tsx`, `WeighInRow.tsx`; `ui/NumberEntry.tsx`, `MmTextField.tsx`, `MmListRow.tsx`, `MmButton.tsx`, `MmOverlays.tsx`, `Overlays.ts`, `ui.css`; `progress/WaistEntryCard.tsx`, `saveWaistReadings.ts`, `ProgressScreen.tsx`; `WaistWriter.ts`, `Fmt.ts`; `Today.stories.tsx`, `waistDueScenario.ts`; `test/dashboard/dashboard.test.tsx`.
- Hashes: not computed by the reviewer (no shell); recorded by the chair.

## Existing facts versus proposals
- `WaistRow` puts `NumberEntry` in `MmListRow entry`: name "Today’s waist", suffix the length unit, hint "Tape level with the navel, snug, breathe out normally."
- `MmTextField` describes the field by error, suffix, helper, then hint; the error is `role="alert"` with `aria-invalid`.
- Both entry rows' buttons are named "Save"; `MmButton` has no prop for another name.
- A save blurs, then the row unmounts and a pressable row replaces it.
- Every rejection shows "That value looks off. Check it."; `saveWaistReadings` rejects out-of-range readings with `FormatError`.
- Both saves use one snack with "Open Progress". A new snack replaces the current one; one with an action never times out; back dismisses it; the host is a polite status after the app root in the DOM.
- `.mm-snack-host` is fixed 16 px above the bottom; the navigation bar is at least 72 px tall at the bottom.
- Progress' waist section is folded, after the hero and weight events; its field names spell the unit ("1st waist reading, inches").
- A save replaces the day's waist; there is no delete or undo.
- No story draws a typed value, the refusal or the snack.

## Audit coverage
Mode `change`. Source and four renders (not-weighed-today-martian-low, waist-due-light-low, not-weighed-today-light, dashboard-dark). Not inspected: device, TalkBack, keyboard resize, motion, measured contrast, 200% text, Progress render, `MmIconButton`, the snack tests. Nothing run.

## Novice mobile experience (when UX/product design is assigned)
Task: an imperial novice records this week's waist on the Dashboard, then optionally sees it in Progress.

| Step | Result |
|---|---|
| 1. Find the row | Pass |
| 2. Measure and type | Pass; the hint's missing timing referred to measurement |
| 3. Save (button or Done) | Visual pass; focus lost (UX-5); "in" reads as a preposition (UX-4) |
| 4. After the save | **Fails** (UX-1): the waiting snack covers the navigation bar, daily after the weigh-in |
| 5. Open Progress | Likely fails "see it" (UX-6) |
| 6. Refusal (3) | Pass for a typo; weak for a unit slip, wrong for storage failures (UX-7, UX-8) |
| 7. Both saved in a row | Pass: the second snack replaces the first, nothing lost |
| 8. Screen reader, both asking | Fails for control lists and voice access: two "Save" (UX-3) |

## Findings

**UX-1 (design system). The waiting confirmation snack covers the navigation bar after every routine save. Usability problem by inspection. High. Blocking.** Confidence medium-high (geometry and the bar's rendered position; no capture with the snack up).
- The snack spans about y 851–899 of 915 with pointer events; the bar about 843–915; with an action it never expires; both Dashboard saves now carry one. Before this change the weigh-in snack had no action and left after 4 s.
- Device edge cases (unverified): the keyboard may bring the waiting snack over the field being typed in; the first back press dismisses the snack.
- Remediation (required): in the design system, the snack's bottom becomes the bar's height + 16 px + safe area while a bar shows; a story with the snack up in three palettes.
- Acceptance: with the snack up every destination can be pressed; it does not cover a focused field (device).
- Optional, the owner's: a convenience action that repeats a destination could time out (amends MM-272).

**UX-2 (process). The states the save creates are not drawn. Confirmed requirement violation (MM-293, MM-292). Medium. Blocking.**
- No story for a typed value, the refusal, the snack after a waist or weigh-in save. mm291's UX-8 still pending.
- Remediation: stories for Waist Due typed, refused (3), saved with the snack; Not Weighed Today saved with the snack; three palettes at 412×915.

**UX-3. Two buttons named "Save" in one group. Medium. Non-blocking.** WCAG 2.4.6, 2.5.3.
- Identical when moving by controls or with voice access; likely breaks `getByRole('button', { name: 'Save' })` in the tests (unverified).
- Remediation: `NumberEntry` names its button "Save " + what is entered ("Save waist", "Save weigh-in") through a name prop on `MmButton`.

**UX-4. "in" as a unit reads as the word "in". Medium. Non-blocking.**
- "Saved 36.0 in waist for today"; the field's description starts with "in"; Progress spells "inches".
- Remediation: the unit last ("Waist saved for today: 36.0 in"); the field named "Today’s waist, inches"; the suffix spoken in words or hidden from the description.

**UX-5. Focus dropped to the document after an in-place save. Medium. Non-blocking.** WCAG 2.4.3; the focus half of mm291's UX-1.
- Remediation: focus the row that replaces the entry. Acceptance: after "36{Enter}" the "Waist · Today" row has focus; same for the weigh-in's trend row.

**UX-6. "Open Progress" lands where the waist cannot be seen. Medium. Non-blocking.** Confidence low-medium.
- Remediation: the waist snack's action opens Progress at the Waist section with focus on it; the weigh-in's keeps the hero.

**UX-7. The refusal is said for failures that are not refusals. Low. Non-blocking.**
- A storage failure is told "looks off". Remediation: "looks off" only for a `FormatError`; otherwise "Could not save. Try again." keeping the value. Pre-existing for the weigh-in: a BUG ticket and regression test.

**UX-8. Correcting an accepted wrong value is undiscoverable. Low. Non-blocking.**
- 92 typed in inches (a cm slip) is accepted; no undo; the fix is re-saving in Progress, which says nothing. Remediation: Progress says saving again replaces today's; a plausibility check referred to measurement.

Checked, no finding: weigh-in and waist saved one after the other.

## Sources and evidence
1. Flutter docs, "SnackBar with action no longer auto-dismisses", https://docs.flutter.dev/release/breaking-changes/snackbar-with-action-behavior-update, updated 2026-09-29, accessed 2026-10-14: an action snack stays until dismissed, an accessibility improvement aligned with M3; `persist: false` restores auto-dismiss. Convention, not user research.
2. W3C, Understanding SC 4.1.3 Status Messages (WCAG 2.2), https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html, accessed 2026-10-14: confirmations are status messages announced without moving focus.
3. mdui.org mirror of Material 1 "Snackbars & toasts", https://mdui.org/en/design/1/components/snackbars-toasts.html, accessed 2026-10-14: one at a time, one action.
4. A search snippet attributed to material.io, "Consecutive snackbars should appear above persistent bottom navigation" — not retrieved; unverified. UX-1 rests on the geometry.
5. Android Developers, Compose Snackbar, https://developer.android.com/develop/ui/compose/components/snackbar, accessed 2026-10-14: `SnackbarDuration.Indefinite` exists.

WCAG 2.4.3, 2.4.6, 2.5.3 cited from standing knowledge.

## Research
Performed, partially (WebSearch, WebFetch; no repository data sent). The M3 snackbar placement page could not be retrieved; bounded request to the chair to confirm it.

## Confidence and limitations
Medium. Source claims high; overlap, focus, speech, keyboard and the Progress landing not rendered or observed; tests not run; hashes not computed; one pass.

## Acceptance criteria and edge cases
Existing: all six MM-301 scenarios have tests. Proposed: destinations pressable with the snack up; unique Save names; the unit in words in the field's name, none before a word in the confirmation; focus on the replacement row; the waist landing; non-format failures not called "looks off"; stories for typed, refused and saved. Edge cases: cm, a unit slip, keyboard with a waiting snack, back with a snack up, both rows asking, first measurement, large text.

## Dependencies
product-designer (UX-1, UX-3, UX-4, UX-7 wording); measurement (hint conditions and cost; a plausibility check); react-capacitor/QA (run the tests; device checks).

## Safety concerns
None found. Not clinical clearance.

## Unresolved product decisions
Routine snack lifetime (the owner, amends MM-272): A, keep waiting, lifted above the bar (the minimum); B, a convenience action expires after longer, holding on focus or pointer.

## Verification
Nothing run. Requested: run the dashboard tests; capture the UX-2 stories in three palettes; device checks of focus and the keyboard.

## Targeted challenges
None yet.
