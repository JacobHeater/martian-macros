---
id: MM-128
status: done
component: macro-targets
related: [MM-119, MM-25, MM-28, MM-36, MM-111, MM-112, MM-115, MM-117, MM-132, MM-138, MM-143, MM-158]
---

# Story: Choose how fast to lose, and see what each pace costs

## Context
Fat loss runs at 0.75% of body weight a week for everyone, capped by body fat (MM-25, MM-28). The engine accepts a chosen pace; no screen
offers one. Pace is the largest decision in a cut and the one where users most often choose badly, in both directions.

Evidence:
- **Moderate**: slower loss preserves more lean mass and performance in trained people. Athletes losing 0.7% a week gained lean mass
  while those losing 1.4% did not (Garthe 2011, n=24).
- **Moderate**: an average deficit of about 500 kcal a day was the point at which lean-mass gain from resistance training fell to zero
  across trials (Murphy and Koehler 2022). Individual studies vary widely around it.
- **Judgement, widely shared**: 0.5 to 1.0% a week for most; the leaner the slower (Helms 2014).
- **Moderate**: people with more fat can sustain larger deficits with less lean loss (the Forbes relationship behind MM-26).
- **Emerging, and a model rather than a measurement**: a ceiling on how fast fat can supply energy, about 69 kcal per kg of fat mass per
  day (Alpert 2005). Often quoted, never directly validated; used here only as a cross-check.

## Decisions
Choices I made without asking (say if any is wrong):
- **Three named paces**, shown as a percent of body weight a week and in the user's weight unit:

| pace | percent a week | offered when |
|---|---|---|
| Gentle | 0.5 | always (the only one in the caution cases: MM-111, MM-112) |
| Standard (default) | 0.75 | the body-fat limit allows it (MM-28) |
| Faster | 1.0 | the body-fat limit allows it **and** estimated body fat is clearly high: men 25% and over, women 35% and over (MM-132) |

- **Each pace shows three things before it is chosen**: the daily deficit it means for this user today; the calorie target that results
  and whether a floor already limits it; and one sentence of consequence ("Standard: about 550 kcal a day under your expenditure. Most
  people can train normally on this.").
- **A second limit beside the percentage: the deficit never exceeds 35% of estimated expenditure.** A percentage of body weight is a fixed
  number of calories per kilogram (about 8 kcal per kg per day at 0.75%), while expenditure per kilogram varies widely. For an active
  person at 33 kcal per kg, Standard is a 24% deficit. For a heavy, sedentary person at 18 kcal per kg it is 44%, which the percentage
  rule alone does not see.
- **A pace the floor cannot deliver is said plainly**: "At your size, your calorie floor limits you to about 0.4% a week. Choosing Faster
  will not change your target."
- **Recomp has no pace control.** Its deficit stays under 500 kcal by design (MM-25), consistent with the meta-regression above.
- **Changing pace acts immediately and is not step-limited**, like a change of goal (MM-24).
- **The model cross-check is recorded, not enforced**: if a chosen pace implies a deficit above 69 kcal per kg of estimated fat mass, the
  explanation notes that the pace is high for the user's body fat. With an uncertain body-fat figure, this is a note and no more.

Where the experts disagreed:
- The bodybuilding coach wanted a fourth "aggressive" pace (1.25 to 1.5%) for short, hard cuts in high body fat users. The adherence and
  safety experts opposed it for a general app: fast early loss predicts dropout and rebound in unsupervised settings as often as
  success. Not offered. Listed as a non-goal with protein-sparing modified fasts (MM-144).
- The adherence expert wanted Gentle as the default on retention grounds. The product strategist: visible progress in the first month is
  also retention. Standard stays the default; this is worth an experiment if the app ever has consented analytics, which it does not.

## Description
A pace control on the change-goal sheet and in onboarding's plan step for fat loss; a deficit-fraction limit in `SafetyBounds`.

## Acceptance Criteria
```gherkin
Scenario: Three paces for a heavier user
  Given a 100 kg man at an estimated 30% body fat with an expenditure of 3,000 kcal
  Then Gentle, Standard and Faster are offered, with deficits of about 530, 800 and 1,050 kcal

Scenario: Low expenditure for body weight
  Given a 120 kg woman at an estimated 45% body fat with an expenditure of 2,200 kcal, choosing Standard
  Then her deficit is 770 kcal (35% of expenditure), not the roughly 1,050 kcal that 0.75% a week implies
  And she is told the pace this gives

Scenario: Faster is not offered
  Given a man at an estimated 18% body fat
  Then Gentle and Standard are offered and Faster is not, with the reason

Scenario: The floor limits the pace
  Given a 50 kg woman with an expenditure of 1,550 kcal and a floor of 1,200
  Then Standard shows that the floor limits the deficit to 350 kcal, about 0.65% a week

Scenario: Lean
  Given a man at an estimated 11% body fat
  Then only Gentle is offered

Scenario: Changing pace
  Given fat loss at Standard
  When Gentle is chosen
  Then the calorie target rises at once by the difference, without a step limit

Scenario: Recomp
  Given the goal is recomp
  Then no pace control is shown
```

## Notes
- Priority: should-have, early. It completes MM-25, which records "not built: choosing a fat-loss pace".
- The same sheet is the natural home for the projected time to a goal weight (MM-36); a range, never a date.
- Every threshold here is an entry in the evidence register (MM-143).

## Progress (2026-10-19, feat/m2)
Built, closing the ticket:
- **Three named paces** (`FatLossPace`: Gentle 0.5%, Standard 0.75% default, Faster 1.0%), described for this person today by
  `describePaces`, which runs each through the real target calculation with no step limit: the daily deficit, the target that
  results, the pace the deficit actually delivers, what limited it (the calorie floor, the deficit cap, the body-fat limit), and
  whether the deficit is above what the body fat can supply by Alpert's model (a note, never enforced). Gentle is always offered;
  Standard when the body-fat limit (MM-28) allows 0.75%; Faster when it allows 1% and the cautious body-fat figure (MM-132) is
  25% (men) or 35% (women) or more; a caution from the health check or age (MM-111, MM-112) leaves only Gentle. Each withheld
  pace is listed with its reason and cannot be chosen.
- **The deficit cap**: `PaceRule.maxDeficitFractionOfExpenditure` (35%) in `computeTargetsTraced`, with the flag `deficitCapped`
  and its message; the pace recorded on the targets is the one the capped deficit gives, so "Intended pace" stays honest.
- **Where it is chosen**: the Coach tab's "Your targets" has a Pace row with "Change pace" (fat loss only; recomp and the other
  goals have none), opening `PaceSheet`; onboarding's plan step shows the paces under a chosen fat-loss goal, costed from the
  starting estimate of expenditure. The stall card's "gentler pace" option opens the same sheet (MM-140).
- **A pace change acts at once and is not step-limited**, like a change of goal: `nextTargets` issues new targets when the setup's
  pace differs from the one the current targets were asked for (`TargetsRecord.requestedLossFraction`, schema 11), built on the
  expenditure estimate those targets rest on, so only the pace moves the target and a gentler pace never lowers it (MM-117).
  The relief offer's slower pace now applies the same way. `UserSetup.paceChangedOn` records the day.
- Evidence rows for every threshold (MM-143). Tests: `paces.test.ts` (every acceptance scenario), `paceSheet.test.tsx`,
  the contract tests for the new column. Stories: `ChoosePace` (Coach), `GoalPaces` (onboarding).

Decided here (say if wrong):
- The ticket's example deficits (about 530, 800 and 1,050 kcal for a 100 kg man at 30% body fat) assumed 7,400 kcal per kilogram
  lost; the engine's energy density for a trained person at that body fat (MM-26) gives about 600, 900 and, capped at 35% of a
  3,000 kcal expenditure, 1,050. The ratios between the paces are what the test holds.
- The consequence sentences avoid "most people" (MM-108's comparison rule), so Standard reads "Training usually carries on as
  normal at this pace."
- The projected time to a goal weight (MM-36) is not on this sheet; MM-36 is not in M2.
