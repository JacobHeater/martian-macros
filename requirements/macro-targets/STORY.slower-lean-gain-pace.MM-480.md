---
id: MM-480
status: done
component: macro-targets
related: [MM-129, MM-25, MM-128, MM-36, MM-533]
---

# Story: A slower lean-gain pace to choose

## Context
MM-129 says a fat-heavy gain would suit "a slower gain, or maintenance for a while", and offers the goal chooser. Lean gain has
no pace of its own to choose: it is set by training status (MM-25), unlike a cut (MM-128). Offering a slower gain needs a
stored choice, which is a setup column and so a migration; MM-129 was built with no schema change, while schema v15 was in
flight.

## Decisions
Choices I made without asking (say if any is wrong):
- **Two paces**: the current one, and half of it. Never faster than MM-25's.
- **Offered where MM-129's card offers a goal**, and on the Coach screen's targets section like the cut's pace row.
- **Built like its sibling, the fat-loss pace (MM-128)**: the same "Pace" row and "Change pace" button in the targets
  section, and a sheet of `ChoiceCard`s like `PaceSheet`, each with the surplus and the target it means today, the
  standard one marked "Default".
- **The change applies at once but inside the weekly step**, unlike a cut's pace change (which has no step limit): the
  scenario asks for it, and nothing about a gain needs calories moved faster. It rests on the expenditure estimate the
  current targets were built on, as MM-128's does, so only the pace moves the target. The sheet's figures use that
  same estimate.
- **Stored as a name** (`standard`, `slower`) on the setup, kept across a change of goal, and on each targets record
  (none for the standard pace), as the cut's pace is (MM-128), so a pace chosen since the current targets is noticed.
- **The card's offer**: "Gain more slowly" opens the pace sheet, beside "Choose a goal" (where maintenance is), only
  while the gain looks fat-heavy, it is not yet time to end it, and it is not already slower. Already slower, the
  fat-heavy line says so and suggests maintenance alone.
- **The half is a register row** (`LeanGainRule.slowerPaceFactor`): product judgement, as MM-129's figures are.

## Description
A stored lean-gain pace, chosen on the Coach screen; `computeTargets` uses it on lean gain, under the MM-129 surplus cap.

## Acceptance Criteria
```gherkin
Scenario: Choosing the slower gain
  Given an intermediate lifter on lean gain at 0.15% a week
  When they choose the slower gain
  Then the next targets aim for 0.075% a week, inside the weekly step

Scenario: Offered with a fat-heavy gain
  Given the Coach screen says the gain looks fat-heavy (MM-129)
  Then the slower gain is offered beside maintenance
```

## UI/UX
- CoachLeanGainSlower — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachLeanGainSlower). The card's
  "Gain more slowly" and the two-pace sheet.
- CoachLeanGainAlreadySlower — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachLeanGainAlreadySlower).
  Already slower: the card offers the goal only; the targets section's pace row.

## Notes
- Schema 17: `setups.lean_gain_pace` (`standard` until chosen) and `targets_history.lean_gain_pace` (null for the
  standard pace and for every record made before). Step 16 to 17 in `apps/mobile/src/data/migrationSteps.ts`; upgrade
  test "a version 16 database comes up to date on the standard lean-gain pace" in `apps/mobile/test/data/upgrade.test.ts`.
- Engine: `LeanGainPace` (domain), `computeTargetsTraced` (the half), `nextTargets` (the change at once, inside the step),
  `describeLeanGainPaces`, `LeanGainReview.offersSlowerGain`. Screen: `LeanGainPaceSheet`, `useLeanGainPaceSheet`, the
  Coach screen's pace row, `LeanGainCard`.
- Tests: `apps/mobile/test/engine/leanGainPace.test.ts` (both scenarios at the engine), `apps/mobile/test/coach/leanGainCard.test.tsx`
  (the offer, the sheet, the targets that result), the setup and targets-history contract suites. Found while building
  it: MM-533 (a held reduction lost its pace).
- MM-36's phase plan is unchanged: it plans by goal and weeks, not pace.
- Not run locally; CI validates. Owed on a device: the sheet and the card's two buttons at phone width, in each palette.
