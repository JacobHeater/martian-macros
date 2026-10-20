# Review: chair

## Scope and traceability
Role: chair, the parent session (Claude Code, 2026-10-20), which also implements. Run `mm142-weight-jump`; baseline `feat/m2` at 24130ec; the working tree of `wt/measure`. Requirements: MM-142 (`requirements/coach-insights/STORY.explain-a-weight-jump.MM-142.md`), MM-155 (`requirements/body-measurements/STORY.measurement-protocol-and-noise.MM-155.md`); MM-418 proposed and fixed from UX-1. Inputs and hashes: `state.json` (hashes of the tree after the edits). Reports: `product-designer.md` (PD-1 to PD-14), `ux-accessibility.md` (UX-1 to UX-12).

## Existing facts versus proposals
Facts: both reviewers read the same uncommitted tree from the brief, neither seeing the other; no render, device or assistive technology existed in this session. The dispositions in `decision.md` are the chair's; the edits after the reviews are listed under Findings. Proposals left to the owner are in Unresolved product decisions.

## Audit coverage
Mode `change`. The chair inspected the brief's inputs, both reports and the edited tree, and ran the tests listed under Verification. Not inspected: a render in any palette, a device, assistive technology. Core roles training, nutrition, coaching, measurement and safety were omitted for the reasons the brief records.

## Novice mobile experience (when UX/product design is assigned)
Not assigned to the chair; see the two reports' walkthroughs (Dashboard with a jump saved; Progress with the Waist section opened on two measurements; picking a dot).

## Findings
None of the chair's own. Edits after the reviews: the closed line shortened to the distance and the likely causes, the arithmetic among the figures (PD-1, UX-2); the Settings button only for a line of a listed kind, MM-418 for the rebound note's share (UX-1); the caption says a picked reading once (PD-2, UX-5); arrow keys pick weigh-ins on the focused chart and the note is a live region (UX-3); "Tap a dot, or move with the arrow keys" in "How to read this" (PD-14, UX-4); the offer names the section on Progress (UX-6); dots alone under three waist measurements (PD-8, UX-7); the note at the hero's edge (PD-3) and under the band sentence (PD-4); the picked dot and the figure's tape in the text colour (PD-5, PD-6); a larger navel (PD-7); a label-type sub-head (PD-9); numbered steps (PD-11); the report's waist detail (PD-12); the shorter alternative (UX-10); dead CSS removed (UX-11).

## Sources and evidence
None of the chair's own; the UX guard's three W3C sources are recorded in `state.json`.

## Research
Status: unnecessary. The dispositions rest on the repository's own rules and the two reports.

## Confidence and limitations
Medium: the chair implements and reviews sequentially; the reviewers did not see the edited tree; no render.

## Acceptance criteria and edge cases
MM-142's scenarios and MM-155's remaining items are traced in the two reports and in the tests named under Verification; the review-driven changes are covered by the updated tests (the line's words, the picked caption, the keyboard pick, the two-entry chart, the alternative, MM-418).

## Dependencies
The owner's decisions below; the device checks in `handoff.md`.

## Safety concerns
None new. The guard's concern (a per-reading line with no off switch) is answered: withheld under 18, with an eating-disorder history and with weight hidden; MM-118's setting is its switch.

## Unresolved product decisions
PD-10 (controls in a section on the canvas), PD-13 (the measurement colour), the first drawing of a person, the renders by eye, the device checks (UX-3b, UX-12). Authority: the product owner.

## Verification
Typecheck clean after the edits; `test/engine`, `test/format`, `test/voice.test.ts`, `test/architecture.test.ts`, `test/layers.test.ts` pass (1015); the suites changed by the edits pass; `recoveryCheckIn` passed alone after timing out under a load average above 30 from sibling worktrees' runs. `npm run unseen` and the whole suite are recorded in the ticket's handback.

## Targeted challenges
None run: the reports agree where they overlap.
