# UX-accessibility review: Add food says what it does (MM-218, MM-219, MM-220, MM-221, MM-411)

**Role:** ux-accessibility (UX guard), read-only. **Mode:** change; `feat/m2` working tree, 2026-10-19. **Render:** none; components and stories read from source; a 412 by 915 phone, TalkBack or VoiceOver and 200% text assumed, none observed.

## Walkthroughs
**(a) A food typed from a label, two servings, calories typed against the macros.** The sheet announced as a dialog; Enter manually (focus after the swap unknown, F5); the method chip pressed; "Servings eaten" 2, its consequence six controls away (F1); the macros; Calories 400 brings the helper "the 400 kcal typed will be logged" while the Logs line reads 800 (F2); the Logs line a plain paragraph not bound to Log it (F1); Still needed and the dimmed button in the right order (F3); the sheet closes, nothing announced after an add (pre-existing).
**(b) A per-serving entry corrected and moved to yesterday.** "Logged on" a plain label, the stepper's buttons named as on the Food screen (F4); the per-serving caption and "Edit nutrition per serving" (closes the earlier gap); the fields refill; no servings bracket on the calculated edit (F10); Previous day changes the span silently (F4); Save, the snack "Moved to Yesterday." polite and focusable (pass); focus restored to a row that has left the list (F5).

## Findings
**F1 (medium).** The Logs line is reached only by linear swipe and is not bound to the action it qualifies; it should not be live (per-keystroke announcements are the "too chatty" case). Recommend `MmButton` take `describedBy` and the finishing action point at the Logs line.
**F2 (medium).** The calorie caution says a figure "will be logged" that is not what is logged when servings differ from one. Word the helper per serving and say the typed figure is kept; test two servings.
**F3 (medium).** The Still needed caption is right in place and weight (contrast 7.8:1 or better in all palettes) but not programmatically tied to the inert button; the same `describedBy`. Keep native `disabled`.
**F4 (medium).** "Logged on" is not bound to the stepper and a day change is not heard. `DayStepper` takes a name as a group; the day span a status.
**F5 (medium if confirmed).** Focus after in-sheet step swaps and after a save that moves the entry is unverified; device check requested.
**F6 (medium).** Try again gives no sign when the read fails again and nothing while trying: the alert fires on insertion only and the notice never unmounts. An inert "Trying…", a re-announcement on repeat failure, focus to the first row on success; a third MM-411 scenario.
**F7 (medium).** With nothing to estimate from, the step still promises a rough entry and sends the person to a form that needs the numbers they lack; the notice should name the route ("Totals only" and a guessed figure).
**F8 (low).** The chevron is visual only; the rows are told apart in words; no change required.
**F9 (low).** "Still needed" reads as four items; parenthesize the last.
**F10 (low).** The servings bracket is absent on a calculated edit.
**F11 (medium, process).** States no story draws: the typed form with values and the bracket; the caution; Still needed with "an amount"; "Logs an estimate" for a hand portion; the move snack.
**F12 (low-medium).** "Totals only" records the entry at the estimate's uncertainty and the row then calls it "Estimate"; the chip no longer says the numbers are treated as an estimate.

## Verdict
Pass, no blocking finding.

## Research
Performed: W3C, Understanding SC 4.1.3 Status Messages (WCAG 2.2), https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html, updated 11 May 2026, accessed 2026-10-19: a status message informs of the result of an action; the "too chatty" risk. A per-keystroke value should not be live; a day name after a press is one status message.

## Chair request
Measurement: does `quickAdd` at 0.40 relative sigma change anything the person later sees, such that the chip or row should say "estimate"?

## Audit coverage
Source inspection of the sheet, both steps, the results, the custom form, the chips, the sheet and overlays, the hook, the labels, tokens; the Food stories; the batch's test; `unseen.json`; the earlier run's reports; MM-167, MM-223, MM-271; the direction documents. Not inspected: `MyFoodsStep`, `BarcodeScanStep`, the chart, the arithmetic, `trapFocus`, `MmDialog`. Blocked: all runtime behaviour.

## Safety
None in scope; not clinical clearance. F2 can leave a person believing a smaller figure was logged than was.
