---
id: MM-135
status: done
component: adaptive-coach
related: [MM-22, MM-24, MM-28, MM-31, MM-115, MM-116, MM-117, MM-124, MM-130, MM-143, MM-147, MM-148, MM-432]
---

# Spike: Should the diet break be forced, when, and for how long?

## Context
MM-31 forces a one-week maintenance break after sixteen unbroken weeks of deficit. That ticket records that the product owner's decision
was "capped at 12 to 16 weeks, followed by a *recommended* one to two weeks at maintenance", and that the implementation chose 16 weeks,
forced, one week. The panel reviewed the evidence and did not agree among themselves, so this is a decision to make, not a requirement to
write.

Evidence:
- **Moderate, in men with obesity**: alternating two weeks of deficit with two weeks at maintenance produced more fat loss and less
  metabolic slowing than the same sixteen weeks of deficit taken continuously (MATADOR, Byrne 2018, n=51). The breaks were two weeks and
  frequent, at carefully measured maintenance.
- **Moderate, in resistance-trained people**: one-week breaks after every three weeks of deficit gave *no* difference in fat loss,
  fat-free mass, strength or resting expenditure against continuous dieting (ICECAP, Peos 2021). A secondary analysis found lower hunger
  and better muscular endurance in the break group. A later trial in trained women found the same absence of a body-composition effect.
- **Emerging**: two-day carbohydrate refeeds may help retain fat-free mass (Campbell 2020, small).
- **None directly** for a single forced week after sixteen.

Honest summary: a break does not reliably improve body composition in lean trained people; it probably helps hunger and how the diet
feels; it may help metabolic adaptation in people with obesity when breaks are long and frequent. Nobody has shown harm from a break
other than a longer total diet.

## Description
Decide, and record here with reasons:

1. **Forced, offered or absent?** Positions on the panel:
   - *Forced* (safety and recovery experts): the users who most need a break are the ones who will decline it, and a cap on unbroken
     deficit is a defensible safety limit independent of any metabolic benefit.
   - *Offered* (behavior-change and product experts, and the product owner's original word): autonomy; a forced break mid-momentum is a
     reason to leave; the evidence does not support compulsion.
   - *Signal-triggered* (recovery expert's alternative): offer one when recovery signals fail (MM-117), whatever the week, and keep a hard
     cap only as a backstop at a longer interval.
2. **The interval.** 12 or 16 weeks; and whether it should be shorter for leaner users, in whom adaptation and lean-mass risk are greater
   (the same gradient as the loss limits in MM-28).
3. **The length.** One week (as built) or two (as MATADOR used, and as the original decision allowed). A one-week break is partly consumed
   by the glycogen rebound and the engine's blind period (MM-131).
4. **What counts as a break.** A pause (MM-148), a gap in use (MM-147), a week of higher days (MM-124), a user-chosen maintenance week
   (MM-117): which of these reset the count?
5. **What the app claims.** The explanation must match the evidence: "a rest from dieting, which most people find makes the next weeks
   easier", not "resets your metabolism".

## Decisions
The panel's recommendation, to be confirmed or overruled by the product owner:
- **Offered at 12 weeks; forced at 16 for users in the lean bands of MM-28, and at 20 for others.** Signal-triggered offers at any time
  (MM-117).
- **Two weeks by default, one selectable.**
- **Any 7 or more consecutive days at or above maintenance targets resets the count**, however it came about.
- **Exempt from the step limit** (MM-115).
- **Wording makes no metabolic claim.**

## The product owner's decision (2026-10-13)
**Offered, with a hard cap as backstop.** A break is offered at 12 unbroken weeks of deficit and whenever the recovery signals fail
(MM-117), whatever the week; it is forced only at a longer cap, 20 weeks, as a safety floor. Not adopted from the panel's proposal:
the earlier forced cap at 16 weeks for the lean bands of MM-28 (the owner may add it; it was not put to them). Still the panel's
recommendation, not yet ruled on: two weeks by default with one selectable; seven consecutive days at or above maintenance reset the
count; exempt from the step limit; no metabolic claim in the wording. The engine change (replacing MM-31's forced week at sixteen with
the offer at twelve, the signal-triggered offer and the cap at twenty) is this ticket's remaining work; status moves to in-progress.

## Decided here (2026-10-20, feat/m2; say if wrong)
The panel's recommendations the owner had not ruled on, adopted under the owner's blanket instruction for this branch,
and the choices the build forced:
- **Two weeks, for every break.** A break the person chooses and the one the app plans at twenty weeks are both two
  weeks at maintenance (`DietBreakRule.breakWeeks`). **"One selectable" is not built**: the length chosen has to be
  stored between the press and the check-in that issues the targets, nothing stored carries it (`UserSetup` has the day,
  not a length; `user_preferences` has fixed columns; a targets record's flags are written by the engine from the
  setup), and a `setups` column belongs to the schema lane. Stopped here; MM-432 has it.
- **Any seven consecutive days of targets at or above maintenance end the unbroken run** (`DietBreakRule.resetDays`,
  in `deficitStartOn`), however they came about: a break, a maintenance week, a change of goal and back. Fewer days do
  not: a goal changed and changed back inside a week leaves the count whole. It is *targets*, not eaten intake: a week of
  higher days (MM-124) does not reset it, because the engine estimates expenditure and never reacts to intake. A pause
  keeps MM-148's seven days and a gap MM-147's fourteen (the app does not know what was eaten in a gap).
- **The break is exempt from the step limit both ways**: calories come back at once when it starts (as MM-115 settled),
  and when it ends the deficit resumes in one step, as after a change of goal, not 100 kcal a week (a new explanation
  reason, `breakEnded`). MM-31's break walked back down over several weeks; a planned return is neither a noisy week nor
  a spiral, which are the step limit's two reasons.
- **The planned break at twenty weeks does not wait for the estimate.** It is issued at the check-in whether the
  estimator is held or the coach is learning, like the safety raise: a safety floor with a data-quality gate in front of
  it is not a floor.
- **One offer, two triggers.** MM-117's offer and the twelve-week offer are the same `ReliefOffer` with a `reason`
  (`recoverySignals`, `longDeficit`); the recovery signals take precedence when both hold. The twelve-week offer has no
  slower pace beside the break: its answer is a rest, not a pace. Declining either is quiet for three weeks for both
  (`reliefAnsweredOn`), so a person who carries on at twelve is asked again at about fifteen and eighteen, and at twenty
  the app plans the break.
- **No metabolic claim.** The words call a break "a rest from dieting, which many people find makes the next weeks
  easier" ("many", not the ticket's "most": ICECAP's hunger finding is a secondary analysis). The flag words and the
  offer are tested against "metabol", "reset", "recover" and "repair".
- **Built like its sibling.** The twelve-week offer is `ReliefOfferCard` itself (MM-117), the same `Notice` with a title,
  a body and a row of `MmButton`s, told apart by the calendar icon in place of the heart; a break in force shows as the
  Coach's flag notice (`targetFlagMessage`), as every target flag does, with MM-130's rebound note under it for the
  first fourteen days (`reboundText`, as `MaintenanceCard` shows it after a cut). No new part. The panel (product-designer
  and UX-accessibility, `docs/agent-runs/mm135-diet-break/`, UX guard pass) confirmed the sameness; after it "Carry on"
  sits on its own row under the choices (three buttons wrapped by overflow), a notice's text keeps its paragraph
  breaks, and the words say the break runs its two weeks once taken and, from seventeen weeks, that the app plans the
  break next rather than asking again.
- **Recomp counts as a deficit** here, as MM-31 chose.

## Acceptance Criteria
```gherkin
Scenario: A decision
  Then this ticket records the product owner's answer to each of the five questions

Scenario: The built behavior is reconciled
  Given the decision differs from what MM-31 records as built
  Then a ticket exists to change the engine, and MM-31 notes that it is superseded in that respect

Scenario: The claim matches the evidence
  Then the diet-break explanation shown to users contains no statement about metabolism that the evidence register (MM-143) does not
    grade moderate or better for that user group
```

## UI/UX
- CoachBreakOffer — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachBreakOffer). Twelve weeks in: the
  relief card with the calendar, "Take a two-week break" prominent, "Carry on" quiet; no slower pace.
- CoachOnChosenBreak — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachOnChosenBreak). The first week of
  a chosen break: the flag notice, targets at maintenance, the next check-in two weeks out.
- CoachOnPlannedBreak — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachOnPlannedBreak). The break the
  app planned at twenty weeks, in its first week.
- CoachReliefOffer — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachReliefOffer). MM-117's offer with
  the new break button beside the slower pace, "Carry on" on its own row.
- CoachReliefOfferLargeText — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachReliefOfferLargeText). The
  same at 200% text (the panel's UX-6).

## Progress (2026-10-20, feat/m2)
Built:
- **The rule** (`DietBreakRule`: `offerFromWeeks` 12, `forceFromWeeks` 20, `breakWeeks` 2, `resetDays` 7), each a row
  in `docs/evidence.md`, all judgement; `SafetyBounds.maxContinuousDeficitWeeks` (16) is gone with its row. The
  "When does the app slow or stop a deficit?" question on How this works says the new policy.
- **The offer at twelve weeks** (`findReliefOffer`, reason `longDeficit`): on a fat-loss or recomp goal whose targets are
  a deficit, not during a pause, quiet for three weeks after any answer; needs no check-in. Shown on the Coach and the
  dashboard by `ReliefOfferCard` ("12 weeks in a deficit"; the body says what a break is and that at 20 weeks the app
  plans one). Choices: the two-week break (`maintenanceWeekFrom`, as MM-117's week was) or carry on.
- **The planned break at twenty** (`computeTargets` with `consecutiveDeficitWeeks >= 20`, flag `dietBreak`): issued at
  the check-in, estimate held or not, beyond the step limit; the words: "You’ve been in a deficit for 20 weeks, the
  longest the app plans without a rest. These two weeks are at maintenance; the deficit resumes after them."
- **A break's length** (`breakInForce`): `nextTargets` holds for fourteen days from the break's first record; targets
  reissued inside it (a corrected profile, an app update, a pace change) stay on it under the same flag
  (`TargetInputs.continuingBreak`) and do not stretch it; `nextCheckIn` says two weeks on the Coach, the dashboard and
  the coach line. When it ends the deficit resumes at once (`breakEnded`), and the count starts from the new targets.
- **What resets the count**: `deficitStartOn` ends the run at seven consecutive days of targets at or above maintenance;
  a shorter stretch does not. Pauses (MM-148) and gaps (MM-147) keep their restarts.
- **MM-117 reconciled**: its "maintenance week" is now the two-week break (`ReliefChoice` `break`, flag
  `requestedBreak`, words "the two-week break you chose"); the slower pace and sleep line are unchanged.
- **The simulator** (`runCoachLoop`) holds a break for its length, resumes unthrottled, counts deficit weeks with the
  engine's own function, and can take the offer (`beforeCheckIn`).

Tests:
- `test/engine/dietBreak.test.ts`: the seven-day reset (7 resets, 6 does not; above maintenance; a chosen or planned
  break; a pause's and a gap's restart), `breakInForce` through reissued targets, `nextCheckIn`, and the planned break
  through `nextTargets` with a held estimate: issued at 20 and not at 19, held for 13 days, resumed at 14 in one step
  with the count restarted.
- `test/engine/dietBreakLoop.test.ts` (closed loop, simulated people): first offered at week 12, taken, held two weeks,
  resumed unthrottled, nothing forced in the 12 weeks after; declined throughout, planned at week 20 for two weeks (two
  seeds), exempt from the step limit at both ends; a maintenance week at week 10 moves the planned break to week 31;
  every other step is still at most 100 kcal.
- `test/engine/reliefOffer.test.ts`: the twelve-week trigger (84 days yes, 83 no; no check-ins needed; the recovery
  signals win when both hold; the restart counts; quiet; not at maintenance or in a pause), and the chosen break's hold,
  resume and reissue. `test/coach/reliefOffer.test.tsx`: the offer on the dashboard at twelve weeks with no slower pace
  and none at eleven, the break's button and two-week check-in. `test/format/templates.test.ts`: the words, and the
  forbidden metabolic words. `test/engine/targets.test.ts`: planned at 20 and not 16; a continuing break.
- Departures recorded in-test: `dartMessages.test.ts` leaves the two break flags out of the Dart comparison;
  `dartParity.test.ts` compares the glycogen7 run through week 15 (Dart forced its break at 16).
- The panel's reviews and the outcome of every finding are under `docs/agent-runs/mm135-diet-break/` (one round;
  UX guard pass; seven findings built, four recorded as pre-existing or the owner's). Whole suite, `npm run typecheck`,
  `npm run unseen` and `mm req` run clean on the branch at completion.

Not built: the one-week choice (MM-432, a `setups` column); MM-117's strength trigger (MM-75, MM-77, as before); the
forced cap at 16 for the lean bands of MM-28 (not adopted by the owner). Not verified on a phone.

## Notes
- Priority: decide before any user reaches week twelve. Decided and built.
- MM-31 recorded that the break was throttled by the step limit and rose only 100 kcal; MM-115 fixed the start and
  this ticket the end.
- The closed-loop test MM-31 lacked exists (`dietBreakLoop.test.ts`).
