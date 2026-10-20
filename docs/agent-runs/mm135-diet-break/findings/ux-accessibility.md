# Review: ux-accessibility

Reviewer: ux-accessibility role (the UX guard), read-only subagent of the parent session acting as chair, 2026-10-20.
Run `mm135-diet-break`; baseline `wt/coach` at `5b58368` plus the working tree. Saved by the chair, verbatim but for
this header.

## Scope and traceability
Requirements read: MM-135 (Decided here, Progress), MM-117. Inputs (under `apps/mobile/`): `src/coach/ReliefOfferCard.tsx`,
`src/format/reliefOfferText.ts`, `src/format/targetFlagMessage.ts`, `src/engine/nextCheckIn.ts`,
`src/engine/nextTargets.ts:249-274`, `src/ui/Notice.tsx`, `src/ui/MmButton.tsx`, `src/ui/MmIcon.tsx`, `src/ui/ui.css`,
`src/app/app.css`, `src/coach/CoachScreen.tsx`, `src/coach/MaintenanceCard.tsx`, `src/coach/TargetChangeSheet.tsx:54-76`,
`src/dashboard/DashboardScreen.tsx:100-116`, `src/format/reboundText.ts`, `src/gallery/screens/Coach.stories.tsx`,
`breakOfferScenario.ts`, `onBreakScenario.ts`, `test/coach/reliefOffer.test.tsx`, `test/voice.test.ts`,
`test/tokens.test.ts:66-106`; twelve renders. Hashes not computed (no shell).

## Existing facts versus proposals
Facts: the card is one `Notice` (icon, `<strong>` title, `<span>` text, action row) with `MmButton`s whose accessible
name is the label text (`MmButton.tsx:33-44`); tests query by role and name (`reliefOffer.test.tsx:93-95`). "Carry on"
writes only `reliefAnsweredOn` (`ReliefOfferCard.tsx:55-59`; test lines 135-147). `maintenanceWeekFrom` is written only
by the card and never cleared in `src/`; the break holds for its length (`nextTargets.ts:264`). The icon is
`aria-hidden` (`MmIcon.tsx:7`), so heart/calendar is visual only; the title text carries the distinction. Proposals are
under Findings.

## Audit coverage
Mode: change. Walked: `CoachBreakOffer`, `CoachOnChosenBreak` (source and render). Surveyed: `CoachReliefOffer`,
`CoachOnPlannedBreak`, Notice/MmButton semantics, flag notices. Not inspected: dashboard, engine rules, the `breakEnded`
resumption (no render), any device or screen reader. Render limitation: every capture clips the right edge, so wrapping
at the card's right edge is unobserved. Contrast is not measured here; `tokens.test.ts` measures text roles and
`outline-strong` on surfaces (lines 81-106) but not `--ember`/`--on-ember` (primary fill) or `--ember` on `--surface`
(text button).

## Novice mobile experience
Goal: twelve weeks into a fat-loss cut, open Coach, decide about the offer, live through the first week. Walked:
1. Card at top, calendar, "12 weeks in a deficit". Body says what a break is, the cost, what carrying on means, and the
   coach's view. "Deficit", "maintenance" are the app's words since onboarding; "the count" is never shown as a number
   anywhere (interpretation burden, low). Passes.
2. Two buttons: filled "Take a two-week break", text "Carry on". The coach's suggestion is the only filled control; the
   alternative is quiet and free of comment, as MM-117 requires. In the relief card the three kinds read as three tiers
   in all palettes. Passes. "Nothing changes until you choose" is implied, not said; low.
3. Tap the break: card goes, hero shows 2,600, "Hold weight", next check-in two weeks out, flag notice "This is the
   two-week break you chose". Signs of result: adequate. No undo, no statement that the break runs its full two weeks
   (UX-2); notice is "Heads up" with a warning triangle (UX-4).
4. Days 2-7: the scale rises 0.5-2 kg; nothing on Coach explains it (UX-5).
Alternative at 3: "Carry on" removes the card; nothing else changes; the mis-tap recovery is a three-week wait.

## Findings
- **UX-1** (design-system/coach; usability problem found by inspection; medium; high confidence). The card joins body,
  suggestion and sleep with `\n\n` (`ReliefOfferCard.tsx:27`) but `Notice` renders `<span>{text}</span>` with no
  `white-space: pre-line` (`ui.css:1109-1123`), so the renders show one seven-to-nine-line block; the coach's
  suggestion and the carry-on consequence sit mid-paragraph. Remediation: `Notice` accepts paragraphs (or the span
  gets `pre-line`); acceptance: the break offer renders three visible paragraphs in every palette.
- **UX-2** (coach; usability problem found by inspection; medium; medium confidence). The two-week commitment is
  irreversible in-app and unstated: no confirm, no undo snack, no route out from the flag notice. Consequence is
  benign (maintenance calories), hence not blocking. Remediation: one sentence ("Once taken, the break runs its two
  weeks") or an undo snack.
- **UX-3** (coach wording; unverified hypothesis; low). The body is reused at 15 and 18 weeks; at 18, "asks again in
  three weeks" is after the planned break at 20. Needs the engine's confirmation.
- **UX-4** (product-designer; design improvement; low). The chosen break shows as `kind="caution"`, "Heads up", warning
  icon for something the person chose. Sibling pattern for every flag; designer's call.
- **UX-5** (coach; documentation/requirement gap, partly hypothesis; medium). `reboundText` reaches only the maintenance
  goal (`MaintenanceCard.tsx:29`, `DashboardScreen.tsx:102-104`, `TargetChangeSheet.tsx:55-56`); a break keeps mode fat
  loss, so the glycogen rise MM-130 explains elsewhere is unexplained here. Not verified at runtime. Remediation: show
  `reboundText` for `requestedBreak`/`dietBreak` in the flag notice or sheet.
- **UX-6** (gallery; design improvement; low). `CoachLargeText` uses `stalledScenario`; the card's three-button row is
  never drawn at 200%. Add `CoachReliefOfferLargeText`.
- **UX-7** (design-system; design improvement; low). The notice's title is `<strong>`, no heading or
  `role="group"`/`aria-labelledby`; heading navigation skips the offer. Pre-existing, buttons self-describing; not
  blocking.

Voice: no banned MM-108 word, no metabolic claim; `reliefOffer.test.tsx:92` guards "metabol|good".

## Sources and evidence / Research
None external; in-repo only. Research unnecessary.

## Confidence and limitations
Medium-high: source plus static renders; no device, screen reader, or measured contrast; right-edge clipping in
renders; self-review only.

## Acceptance criteria and edge cases
Existing: MM-135 "no metabolic claim" traced to `reliefOffer.test.tsx:92` and the templates test. Proposed: paragraphs
visible (UX-1); rebound line on a break (UX-5); 200% story (UX-6).

## Dependencies
Chair requests: (1) coaching/engine: can a chosen break be ended early, and what is the next event after "Carry on" at
18 weeks? (2) Edit owner: add `--ember`/`--on-ember` and `--ember`-on-`--surface` to `tokens.test.ts`, or point to
where they are measured. (3) Product-designer: UX-4.

## Safety concerns
None found beyond UX-5's misreading risk; not clinical clearance.

## Unresolved product decisions
Reversibility of a taken break (owner, via chair).

## Verification
Source inspection and render reading only; no tests run.

## Guard ruling
**GUARD PASS.** No blocking finding. UX-1, UX-2 and UX-5 are medium and should be disposed before merge or ticketed.
