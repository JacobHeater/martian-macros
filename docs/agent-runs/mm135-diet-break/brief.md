# Run brief

- **Task ID and requested outcome:** `mm135-diet-break`. MM-135, the diet break as the product owner decided it on
  2026-10-13: offered at twelve unbroken weeks of deficit and whenever the recovery signals fail (MM-117), planned by the
  app only at twenty as a safety floor; two weeks at maintenance; seven consecutive days at or above maintenance targets
  end the unbroken run; exempt from the step limit; no metabolic claim. Outcome: the Coach screen's offer and the two
  break states drawn in stories, reviewed against their siblings, an outcome for every finding, blocking findings fixed.
- **Audit mode:** `change`: `ReliefOfferCard` (one card, two triggers), `reliefOfferText`, `targetFlagMessage` (the two
  break flags), the stories `CoachBreakOffer`, `CoachOnChosenBreak`, `CoachOnPlannedBreak`, `CoachReliefOffer` and their
  scenarios. Not in scope: the engine (`DietBreakRule`, `findReliefOffer`, `nextTargets`, `breakInForce`), which the
  tests hold; the dashboard, which shows the same card.
- **For a new section, row or control: its nearest siblings on the same screen** (rule 9 of
  `design/screen-direction.md`): the twelve-week offer *is* `ReliefOfferCard` (MM-117), the same `Notice` with a title,
  a body, and a row of `MmButton`s, told apart by the calendar icon in place of the heart and by having no slower pace.
  A break in force is the Coach's flag notice (`targetFlagMessage`), as every target flag is. The other siblings on the
  screen: `MaintenanceCard`'s drift question (a `Notice` with two secondary buttons), `UnderEatingNotice`,
  `TrainingLapseNotice`. **The question every design reviewer answers first: is the twelve-week offer the relief card,
  and where it differs (icon, no slower pace, title as a count of weeks), is the stated reason good enough?**
- **Baseline:** `wt/coach` at `5b58368` (branched from `feat/m2`).
- **Requirements:** MM-135 (this; read "Decided here"), MM-117 (the sibling offer), MM-31 (superseded in part),
  MM-115 (step limit), MM-148, MM-147 (pauses and gaps), MM-432 (the one-week choice, not built).
- **Existing facts and owner decisions:** the owner's decision in MM-135; the one-week choice is not built because it
  needs a `setups` column (MM-432); the wording must make no metabolic claim; "good" is banned (MM-108).
- **Renders supplied** (412 by 1500, static Storybook, headless Chrome, in the chair's scratchpad `shots/`): the four
  stories above in Martian, Light and Dark. Reviewers read the PNGs with their Read tool.
- **Roles:** product-designer (sameness with the relief card, hierarchy) and ux-accessibility (the UX guard:
  comprehension of "12 weeks in a deficit", the two-week commitment, the cap at twenty, the three button kinds).
- **Omitted roles:** chair (the parent session chairs and owns the edits); training, nutrition, coaching, measurement,
  safety: the policy was decided by the owner on the panel's earlier review recorded in MM-135; the engine change is
  held by tests, not a design review.
- **Writer:** the parent session (Claude Fable 5.1), single edit owner. Reviewers are read-only. One round.
