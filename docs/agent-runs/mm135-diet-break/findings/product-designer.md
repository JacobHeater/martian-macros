# Review: product-designer

Reviewer: product-designer role, read-only subagent of the parent session acting as chair, 2026-10-20. Run
`mm135-diet-break`; baseline `wt/coach` at `5b58368` plus the working tree. Saved by the chair, verbatim but for
this header.

## Scope and traceability
Requirements read: MM-135 ("Decided here", "Progress", "UI/UX"); MM-117 located, not read in full. Inputs: the brief,
`ReliefOfferCard.tsx`, `reliefOfferText.ts`, `targetFlagMessage.ts`, `CoachScreen.tsx`, `MaintenanceCard.tsx`,
`UnderEatingNotice.tsx`, `TrainingLapseNotice.tsx`, `ui/Notice.tsx`, `ui/MmButton.tsx`, `ui/ui.css` (notice rules),
`app/app.css` (`.app-row`), `Coach.stories.tsx` 289-322, the three scenarios, `design/screen-direction.md`, and the
twelve PNGs. SHA-256 not computed (no shell).

## Answer first (the brief's sibling question)
**Yes: the twelve-week offer is the relief card**, the same `Notice` with title, body and `MmButton` row
(`ReliefOfferCard.tsx:28-62`), with `reason` switching only the icon (line 31) and the words
(`reliefOfferText.ts:17-28`); the slower pace is absent because `offer.slowerPace` is undefined, not because of a
second branch. The three differences and their reasons:
- **Calendar for heart:** good enough. Rule 2 says a notice carries meaning in its icon; the heart already means the
  recovery check-in on this screen (the "Answer this week's five questions" row), so a heart on a time-triggered offer
  would mislead.
- **No slower pace:** good enough ("its answer is a rest, not a pace"). The pace is not lost: "Change pace" sits in
  Your targets on the same screen (`CoachScreen.tsx:260-265`). Two buttons also keep one Ember fill and avoid the wrap
  in PD-2.
- **Title as a count of weeks:** acceptable. The sibling's title is also a count of weeks ("Two hard weeks in a row");
  digits over ten match `MaintenanceCard.tsx:35`. Mixed numeral style between the two titles is a preference, not a
  finding.

## Existing facts versus proposals
Facts: the card sits above the hero with the other safeguards (`CoachScreen.tsx:200-208`); primary + text buttons
(lines 36-59); target flags are all drawn `kind="caution"` below the hero (lines 221-225), including the user-chosen
`heldByUser`, `easingIn`, `maintenanceCorrection` (`targetFlagMessage.ts:12,31-36`). Proposals are PD-1 to PD-4.

## Audit coverage
Mode `change`. Inspected: the files above, the stories and scenarios, the renders in three palettes. Not inspected:
the engine, the dashboard's copy of the card, `underEatingText`, `trainingLapseText`, MM-117 in full, tests beyond
`test/coach/reliefOffer.test.tsx:80-152`. Evidence: source inspection and static renders; no device, no user
observation, no test run.

## Novice mobile experience (when UX/product design is assigned)
**Walked:** a person twelve weeks into a cut opens Coach and answers the offer (source + `coach-break-offer-*`).
1. Sees the card first, above the hero: calendar, bold "12 weeks in a deficit". Passes.
2. Reads seven lines: what a break is, that the deficit resumes and the count restarts, the coach's lean, the
   three-week re-ask, the cap at twenty. Must decide: break or carry on. Everything but the first sentence earns its
   line (PD-1). Passes.
3. Acts: the one Ember fill is the break; "Carry on" is text. Passes; the hierarchy is right.
4. Result: the card leaves; for the break, the hero reads 2,600 at maintenance, the next check-in two weeks out and
   the flag beneath explains it (`coach-on-chosen-break-*`). For "Carry on" the only sign is the card leaving, by
   design. Passes. The transition is inferred from the two stories, not observed.
**Surveyed:** the planned break and the MM-117 card.
Burden: the long body is evidenced in the render (seven lines); whether novices skip it is a hypothesis.

## Findings
- **PD-1** (design/usability improvement; low; confidence high, rendered). `reliefOfferText.ts:19-22`: the body opens
  by restating the title ("You have been in a deficit for 12 weeks without a break" under "12 weeks in a deficit").
  Remedy: open the body at "A break is two weeks at maintenance…". Acceptance: `CoachBreakOffer` renders six body
  lines at 412 px; the words test still passes.
- **PD-2** (design/usability improvement; low; confidence medium, rendered). `coach-relief-offer-*`: with three
  buttons the `.app-row` wraps (`app.css:27-31`), leaving "Carry on" orphaned left under the secondary button. The
  break-offer row (two buttons) fits. The row is MM-117's; the longer "Take a two-week break" label is this change's.
  Limitation: every capture is cropped at the right edge, so true row width is unverified. Remedy: a capture at
  exactly 412 px; if it still wraps, put "Carry on" on its own line deliberately rather than by overflow.
- **PD-3** (design/usability improvement; low; confidence high). A break in force as "Heads up" with the warning
  glyph: **it should simply be one of them.** Every flag is a caution, including three the person chose; the chosen
  break is a fourth. The planned break at twenty is a safety floor and reads rightly as a caution in all palettes. If
  a chosen state ever ought not to carry a triangle, that is one decision for all four flags in a separate ticket, not
  a variant here (rule 9).
- **PD-4** (documentation gap; low; confidence high). `design/screen-direction.md:85-88` and the register row at line
  122 say target flags sit above the hero; `CoachScreen.tsx:221-225` draws them below it, and the renders confirm.
  Pre-existing. Below serves the break well (the flag explains the 2,600 above it); the doc should say so.

## Palettes and identity
Break offer, both breaks and the relief card render cleanly in Martian, Light and Dark: one flat Ember fill, no
colored notice fill, caution border and word as every flag. No mascot, no decoration. The voice matches the sibling.

## Sources and evidence
None consulted: all claims rest on repository rules and renders.

## Research
Status: unnecessary. No question needed an outside source.

## Confidence and limitations
High on sameness and hierarchy; medium on PD-2 (cropped captures). Static renders only; no text scaling, no device.

## Acceptance criteria and edge cases
MM-135's UI/UX lines trace to the four stories and `reliefOffer.test.tsx:80,93,152`. Proposed: PD-1's six-line body;
a 412-px capture for PD-2. Edge not drawn: the offer at 15 and 18 weeks, covered by the same template.

## Dependencies
ux-accessibility: comprehension of the body and the three button kinds (PD-1, PD-2). Coaching: none raised.

## Safety concerns
None found in the visual remit; not clinical clearance.

## Unresolved product decisions
None for this change. PD-3's broader question (chosen states as cautions) is the owner's, outside this ticket.

## Verification
No commands run. Request to the edit owner: a 412-px-wide capture of `CoachReliefOffer` and `CoachBreakOffer`.

## Targeted challenges
None yet.
