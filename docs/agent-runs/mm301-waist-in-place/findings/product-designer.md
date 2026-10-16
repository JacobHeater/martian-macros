# Review: product-designer

## Scope and traceability
- Role: product-designer (`agents/roles/product-designer.md`). Reviewer: a read-only Claude subagent launched by the panel chair for run `mm301-waist-in-place`.
- Requirement inspected: MM-301. Related MM-291/MM-294 context read through `docs/agent-runs/mm291-weigh-in/decision.md`; the MM-291 and MM-294 ticket files were not opened.
- Commit: branch `feature/dashboard-waist-in-place`, uncommitted working tree on `main` 0ad476a.
- Inputs read: `brief.md`, `design/screen-direction.md`, `apps/mobile/src/dashboard/WaistRow.tsx`, `DashboardScreen.tsx`, `WeighInRow.tsx`, `apps/mobile/src/ui/MmListRow.tsx`, `NumberEntry.tsx`, `ui.css` (list group, entry row, number entry), `MmButton.tsx`, `Overlays.ts`, `apps/mobile/src/progress/WaistEntryCard.tsx`, `apps/mobile/src/gallery/screens/Today.stories.tsx`, `apps/mobile/test/support/hierarchyProblems.ts` (line 22), `test/gallery/hierarchy.test.tsx`.
- Renders viewed (412x915): `not-weighed-today-martian.png`, `-dark.png`, `-martian-low.png`, `-light-low.png`; `waist-due-martian-low.png`, `-light-low.png`; `dashboard-light.png`.
- Input hashes: not computed (the reviewer cannot run commands); recorded by the chair in `state.json`.

## Existing facts versus proposals
**Repository facts (source):**
- Before any measurement the waist entry row is "Waist" with the line "Once a week is enough"; after one, "Last {length} · {day}". It holds a `NumberEntry` titled "Today’s waist" with the hint "Tape level with the navel, snug, breathe out normally." (`WaistRow.tsx`).
- The weigh-in entry row is "Weigh-in", line "Trend so far {weight}" or none; hint "First thing in the morning, after the bathroom." (`WeighInRow.tsx`).
- Once saved, the row's title becomes the value ("Trend 184.1 lb"; "35.8 in" with "Waist · Today"). The two rows follow the same pattern.
- `NumberEntry` always renders a `MmButton` without a `kind`, which defaults to `primary`; it is enabled once a valid number is typed.
- The hierarchy check counts only enabled primaries (`hierarchyProblems.ts` 22).
- Progress' waist Save is `kind="secondary"`; its summary before any measurement is "Not measured yet. Once a week is enough."; its how-to adds "Morning, after the bathroom, before eating… the same tape each time"; the section starts folded.
- The confirmation is `overlays.snack(message, { label: 'Open Progress', … })` for both saves; the waist message is `Saved ${fmt.length(cm)} waist for today`.
- Other "Open …" labels: "Open the report", "Open today’s food".
- Approved direction: rule 6 (at most one Ember fill in view); rule 7 (first viewport); the empty-states paragraph on Waist.

**Rendered observations:**
- Not Weighed Today: the weigh-in row is in the first viewport; the waist title peeks above the navigation bar.
- Scrolled: two structurally identical entry rows of equal weight, about 300 px of the group.
- Waist Due: one entry row among read-only rows, reads clearly.
- The three palettes render consistently.

## Audit coverage
Mode: `change`.
- Inspected: the group's composition, both entry rows, `NumberEntry`, `MmListRow entry`, the snack API and its calls, Progress' waist section (source), the hierarchy check, the screen direction.
- Not inspected: `saveWaistReadings.ts`, `waistDueScenario.ts`, the MM-301 tests, Progress rendered, the snack rendered, typed/error/saved states, FirstDay, the Android shell.
- Methods: source inspection and the supplied static renders; no interaction.
- Referrals: measurement (hint, cadence line), ux-accessibility (where "Open Progress" lands).

## Novice mobile experience (when UX/product design is assigned)
Task: a novice on day 2, morning, not weighed, never measured the waist.
1. First viewport: hero, switch, status, strip, the Weigh-in row; the waist title at the fold. Passes.
2. Scrolled: "Weigh-in" and "Waist" as two identical forms; only "Once a week is enough" says one is weekly. Passes, but equal priority for unequal cadence (PD-3; a hypothesis).
3. Types a waist: Save becomes an enabled Ember primary; with the weigh-in also typed, two Ember fills show (PD-1).
4. Confirmation (no render): "Saved 36.0 in waist for today" reads ambiguously in imperial (PD-2).
5. "Open Progress" (no render): the waist section is folded on arrival (PD-6, hypothesis).

No safety content is affected.

## Findings

**PD-1 (design system). Confirmed requirement violation by source inspection. Medium. Blocking. Confidence high from source; not rendered.**
- Rule: `design/screen-direction.md` rule 6, at most one Ember fill in view.
- Observed: both entry rows render a primary Save; typing in both without saving enables two Ember Saves in one viewport. `hierarchyProblems` counts only enabled primaries and every story has empty fields, so the check cannot catch it. Progress' waist Save is secondary, so the action's weight differs between screens.
- Remediation: a meaning-based emphasis on `NumberEntry` passed to `MmButton kind` (a design-system change with its story); the Dashboard waist Save `secondary`.
- Acceptance: with both fields typed, at most one `.mm-button-primary:not([disabled])`; a story draws that state and the hierarchy test runs on it.

**PD-2 (copy). Usability problem by inspection. Medium. Non-blocking. Confidence high.**
- "Saved 36.0 in waist for today": in imperial, "in" reads as the preposition.
- Remediation: the noun first, "Saved waist 36.0 in for today" or "Waist 36.0 in saved for today".
- Acceptance: criterion and test change together; read aloud in both unit systems.

**PD-3 (hierarchy). Improvement. Low. Non-blocking. Confidence medium; burden not observed.**
- The daily and weekly asks render at identical weight; someone who never measures sees the empty field every day.
- Alternatives: (a) as built with PD-1's demotion (minimum); (b) while the weigh-in is asking, the waist as a one-line row that unfolds its field in place; (c) order by cadence, as built.
- Recommendation: (a) now; (b) only if the owner finds the morning heavy. The owner's decision.

**PD-4 (copy consistency). Improvement. Low. Non-blocking. Confidence high.**
- "Once a week is enough" (Dashboard) vs "Not measured yet. Once a week is enough." (Progress) for the same state. The Dashboard's line works there.
- Remediation: one wording for both screens, rendered to confirm.

**PD-5 (Storybook coverage). Documentation or requirement gap. Medium. Non-blocking. Confidence high.**
- No story draws the "Open Progress" snack, the refused waist, a typed waist, or both rows typed (extends UX-8 of mm291).
- Acceptance: stories for these states in the three palettes; the snack checked at 412 with the longest message.

**PD-6 (needs UX). Unverified hypothesis. Low. Non-blocking. Confidence low.**
- "Open Progress" matches the app's verbs. But Progress opens on its weigh-in hero with the waist section folded, so the saved value may not be in view.
- Remediation (chair): open Progress with the waist unfolded and in view after a waist save, or accept the tab change.

**PD-7 (design documentation). Gap. Low. Non-blocking. Confidence high.**
- `design/screen-direction.md` says Waist's summary line says what starting takes, and its register names only the weigh-in row as holding a field.
- Remediation: update both, citing MM-301.

No finding: the titles, the hint fitting one line at 412, the field name "Today’s waist". The hint's missing timing is referred to measurement.

## Sources and evidence
None external; repository files and renders, viewed 2026-10-14.

## Research
Status: unnecessary. The questions concern the repository's own rules and copy.

## Confidence and limitations
Medium. Static captures only; no typed, error or snack states; no Progress render; hashes not computed. One reviewer.

## Acceptance criteria and edge cases
- PD-2 changes the confirmation criterion; PD-6 the landing.
- Proposed: at most one enabled primary with both rows typed; stories for the snack, refusal, typed waist, both typed; unambiguous text in both unit systems.
- Edge cases: a measurement months old (does `Fmt.day` add the year?); "cm" suffix; whether a hide-weight preference touches the waist line (a question).

## Dependencies
- measurement: should the hint carry timing; is "Once a week is enough" right for a first measurement.
- ux-accessibility: the landing (PD-6); a daily ask for someone who never measures (PD-3).
- react-capacitor: an emphasis prop on `NumberEntry` (PD-1).

## Safety concerns
None in the visual remit. A daily body-measurement ask (PD-3) is a question for coaching/safety for anyone prone to body checking; not a finding.

## Unresolved product decisions
- PD-3: both fields stacked, or the waist folded while the weigh-in asks. The owner's.
- PD-6: open Progress with the waist unfolded. The owner's, with ux-accessibility.

## Verification
Source and supplied renders only. The edit owner should add PD-5's stories, cover the both-typed state in the hierarchy test, and render Progress reached from the snack.

## Targeted challenges
None yet.
