# Review: chair

## Scope and traceability
The sleep workstream session as chair and edit owner, 2026-10-20. Requirements: MM-250, MM-252 (`requirements/sleep/`), the epic MM-249. The brief froze the stories, the components, the tests and the tickets on the working tree of `wt/sleep`, later committed as c5ac538; two read-only reviews ran in parallel from the same brief, neither seeing the other. Input hashes are in `state.json`.

## Existing facts versus proposals
Facts: the reports in `findings/product-designer.md` (PD-1 to PD-13) and `findings/ux-accessibility.md` (F1 to F10, verdict: no blocking finding). Proposals: the dispositions in `decision.md`, which are the chair's, and MM-416, which is the owner's to accept.

## Audit coverage
Mode: change. The chair inspected the two reports, the brief's inputs, and the tree after the edits; ran `npm run typecheck`, the focused suites and `npm run unseen` (results in `state.json` and the workstream's final report). Not inspected by anyone in this run: a render in any palette, a phone, TalkBack or VoiceOver, text at 200%. No browser, device or assistive technology was available.

## Novice mobile experience (when UX/product design is assigned)
Not the chair's; see the two role reports.

## Findings
None of the chair's own. The reviewers' findings and their dispositions are in `decision.md`; the edits made for them are: `MmDurationField.tsx` (names containing their labels; the error to the field it concerns), `format/durationFieldsOf.ts` and `format/parseDurationFields.ts` (one rounding and one parsing helper for the card and the check-in), `SleepNightCard.tsx` (the Waist layout, the note naming the picked night, a save snack, the failed-read notice with Try again, the loading spinner, the plainer caption), `RecoveryCheckInScreen.tsx` (the same parsing, the error under the field, Save held, the caption after typing), `RecoveryCard.tsx` ("Not read" for a failed read; a detail naming where nights come from), `AppState.retrySleep`; stories `SleepMinutesMistyped`, `SleepReadFailed`, `SleepLoading`, `RecoveryCheckInMistyped`, `CoachSleepReadFailed` and the catalog's minutes-error state; tests for the exact names, the right field marked, the two extra messages, the snack, the note, the check-in refusal, the failed reads on both screens and the rounding helper; tickets MM-414 and MM-415 (bugs, done) and MM-416 (proposed).

## Sources and evidence
None consulted by the chair; neither reviewer cited an external source.

## Research
Status: unnecessary. Both reviewers marked research unnecessary; no finding rested on an external claim.

## Confidence and limitations
Medium: the chair implements and reviews sequentially, which is not independent review; the reviewers did not see the edited tree. No render, device or assistive technology.

## Acceptance criteria and edge cases
MM-250 and MM-252's criteria are traced to tests in the role reports; the proposed criteria per finding became the tests named above. Edge cases carried: fractional averages (MM-415), totals over a day and zero, a day rollover while the section is open, an imported night after today.

## Dependencies
None open for other roles; the owner's questions are in `handoff.md` and MM-416.

## Safety concerns
None found by either reviewer or the chair; the offer changes nothing until pressed; no sleep figure is graded or coloured; nothing new leaves the device.

## Unresolved product decisions
Q1 to Q6 in `handoff.md`: the surface or the written exception (MM-416), the order of chips and fields and whether chips carry hours, the morning naming of dated nights, a render at 200% text, a device pass with TalkBack and VoiceOver, and whether a typed night can be removed.

## Verification
`npm run typecheck` clean after the edits; the focused suites, `npx vitest run` and `npm run unseen` on the final tree are recorded in `state.json` and the workstream's final report, with exit codes.

## Targeted challenges
None run: the two reports agreed on every shared finding, and the one divergence (PD-3 against the guard's step 4) is recorded for the owner rather than argued.
