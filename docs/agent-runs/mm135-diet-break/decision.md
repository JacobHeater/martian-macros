# Panel decision: the diet break on the Coach screen (MM-135)

- **Facts versus proposals and traceability.** Two read-only reviews of the stories and the card at `5b58368` plus the
  working tree: product-designer (4 findings) and ux-accessibility (7, **GUARD PASS**). Both answered the sibling
  question first: the twelve-week offer *is* the relief card (MM-117), and the three differences (calendar for heart,
  no slower pace, a count of weeks as the title) have reasons good enough. The owner's policy (MM-135, 2026-10-13) was
  not under review; the engine is held by tests.
- **Coverage.** Source inspection and static renders in three palettes (412-px frame, headless Chrome); no device, no
  screen reader, no measured contrast, no test run by a reviewer. Not inspected by either: the dashboard's copy of the
  card, the `breakEnded` resumption (no render), the engine.
- **Findings, deduplicated, and their disposition.**
  - *The body restates the title* (PD-1): **built**; the body opens at "A break is two weeks at maintenance".
  - *Three buttons wrap by overflow, "Carry on" orphaned* (PD-2): **confirmed** by a capture at exactly 412 px, then
    **built**: "Carry on" is on its own row under the choices, by design, for both triggers.
  - *A chosen break shown as a "Heads up" caution* (PD-3, UX-4): **not changed**; it is one of the flag notices, as the
    designer ruled (rule 9); whether chosen states should carry the triangle is one decision for all four such flags,
    the owner's, outside this ticket.
  - *Flags drawn below the hero while `design/screen-direction.md:85-88` says above* (PD-4): **recorded**, pre-existing
    and a documentation matter for the design guide, not this ticket; below serves the break (the flag explains the
    number above it).
  - *Paragraph breaks collapse in a notice* (UX-1): **built** in the design system: a notice's text keeps its
    paragraph breaks (`ui.css`, `.mm-notice-body > span`); the three paragraphs now show.
  - *The two-week commitment is unstated and irreversible* (UX-2): **built** in the words: "Once taken, it runs its two
    weeks." on both triggers' break text. The chair's answer to the reviewer's question: a break cannot be cut short
    except by changing goal (a change of goal applies at once); a pause does not end it. No undo snack: the consequence
    is maintenance calories for two weeks and the sentence says so before the tap.
  - *"Asks again in three weeks" is false near the cap* (UX-3): **confirmed** against the engine (declining is quiet
    for 21 days; the cap fires at the check-in at twenty weeks) and **built**: from seventeen weeks the offer says the
    app plans the break next and when ("in 3 weeks", "in 2 weeks", "at the next check-in"); a test holds each.
  - *The water rebound is unexplained during a break* (UX-5): **built**: the Coach shows MM-130's rebound note under
    the break's flag notice for the first fourteen days of a break (`breakInForce`, `MaintenanceRule.reboundNoteDays`),
    as `MaintenanceCard` shows it after a cut.
  - *The relief card never drawn at 200% text* (UX-6): **built**: `CoachReliefOfferLargeText`.
  - *The notice's title is not a heading* (UX-7): **recorded**, pre-existing design-system matter for every `Notice`.
  - *Ember contrast not in `tokens.test.ts`* (the UX reviewer's request 2): **recorded**, outside this ticket.
- **Rejected:** none.
- **Safety blockers:** none.
- **Owner decisions:** none asked; the chair's choices are recorded in MM-135 as "Decided here (say if wrong)". Two
  questions for the owner, outside this ticket: chosen states as cautions (PD-3/UX-4); the one-week choice (MM-432).
- **Edit owner:** the parent session (chair): `ReliefOfferCard.tsx`, `reliefOfferText.ts`, `CoachScreen.tsx`,
  `ui.css`, `Coach.stories.tsx`, `templates.test.ts`.
- **Verification:** the words test, the card's app test, the Coach stories and the architecture test after the fixes;
  then the whole suite, `npm run typecheck`, `npm run unseen` and `mm req` (results in `state.json`). Renders of the
  four stories re-taken after the fixes. Not verified on a phone or with a screen reader.
