---
id: MM-115
status: done
component: safeguards
related: [MM-110, MM-24, MM-25, MM-28, MM-30, MM-31, MM-113, MM-128, MM-131, MM-138]
---

# Story: When loss outruns the limit, raise calories now, not 100 at a time

## Context
MM-28 sets the fastest allowed loss (1.0% of body weight a week, 0.7% and 0.5% for leaner users). That limit is applied to the *intended*
pace when targets are computed. It is never compared with the *actual* pace.

It also meets the weekly step limit badly. The step limit is symmetric: at most 100 kcal either way. Consider a user whose true
expenditure is 400 kcal above the starting estimate (well within the formula's error). Their 500 kcal deficit is really 900. The engine
sees it after calibration and starts raising the target by 100 kcal a week, so they spend about four more weeks losing faster than the
app's own safety limit. MM-31 records the same defect for the diet break.

The step limit exists to stop a noisy week from swinging the target and to stop the death spiral downward (MM-27). Neither reason applies
to a raise that a safety limit is asking for.

Evidence: slower loss preserving lean mass and performance in athletes is **moderate** (Garthe 2011: 0.7% a week against 1.4%); the
recommendation of 0.5 to 1.0% a week for lean dieters is consensus built on it (Helms 2014). A deficit above roughly 500 kcal a day
preventing lean-mass gain in people who lift is **moderate** (Murphy and Koehler 2022, meta-regression). The specific rule is **judgement**.

## Decisions
Choices I made without asking (say if any is wrong):
- **The step limit becomes asymmetric for safety raises.** A raise required by a safety rule (this one, the floor, the underweight guard in
  MM-111, a diet break) is not step-limited. Ordinary raises and all reductions keep the 100 kcal or 5% limit.
- **The trigger**: the trend slope over the last 14 days is steeper than the user's limit by more than its own uncertainty (slope minus
  1.5 standard deviations still exceeds the limit), with at least 8 accepted weigh-ins in those days.
- **The first 10 days of a new deficit are excluded.** Early loss is mostly glycogen and water (MM-131); reacting to it would cancel every
  deficit in its first week.
- **The raise** is the energy that would bring the pace back to the limit, valued by the partition model, capped at 400 kcal in one
  check-in. A second raise may follow the next week if the pace is still over.
- **It runs during calibration too.** Calibration holds targets against *noise*; a 14-day slope beyond its uncertainty is not noise.
- **The user is told why** (MM-138): "You are losing about 1.4% of your weight a week. The fastest pace the app aims for at your body fat
  is 0.7%, because faster loss costs more muscle. Targets are up 300 kcal."

Where the experts disagreed:
- The bodybuilding coach: an obese beginner losing 1.3% a week in month one is common and not dangerous. The limit for that user is
  already 1.0%, the uncertainty margin gives slack, and the cost of being wrong is eating 200 kcal more for a week. Kept.
- The skeptical engineer: a one-sided exemption from the step limit reopens instability. The exemption is upward only, bounded at 400, and
  the simulator must show no oscillation (acceptance criteria).

## Description
`nextTargets` gains the check; `computeTargets` distinguishes safety raises from ordinary changes when applying the step limit; a new
target flag records it.

## Acceptance Criteria
```gherkin
Scenario: Expenditure was underestimated
  Given a simulated man at 25% body fat whose true expenditure is 400 kcal above the starting estimate, on fat loss at 0.75%
  Then within one check-in of the slope becoming clear his target rises by more than 100 kcal
  And his true loss is under 1.0% a week within three weeks of that check-in

Scenario: The first week does not count
  Given a new deficit and a 1.8 kg drop over the first 8 days
  Then no safety raise is issued

Scenario: Uncertain slope
  Given 5 weigh-ins in 14 days suggesting 1.3% a week
  Then no safety raise is issued

Scenario: Reductions are still limited
  Given data that would cut the target by 250 kcal
  Then the target falls by at most 100 kcal

Scenario: No oscillation
  Given forty simulated users with noisy logging and weighing, over 16 weeks
  Then no user's target rises by a safety raise and then falls by the full step in each of the next two check-ins

Scenario: Lean limit
  Given a man at 11% body fat losing a clear 0.9% a week
  Then a safety raise is issued, because his limit is 0.5%
```

## Notes
- Priority: must-have before public release. It also settles the open note in MM-31: a diet break is a safety raise and is exempt.
- Depends on MM-131 for the first-days exclusion to be principled rather than a fixed number.
- The mirror case (gaining faster than intended on lean gain) is not a safety matter and stays step-limited (MM-129).

## Progress (built and verified)
- `lossSafetyRaiseKcal` (`packages/engine/lib/src/loss_safety_raise.dart`): the trigger and the amount, with the constants in `coach_constants.dart` (14-day look-back, 8 weigh-ins outside settling windows, 1.5 standard deviations, 400 kcal cap).
  It uses the trend model's current slope and its uncertainty, which already smooth over the recent weigh-ins, not a separate 14-day regression.
- `nextTargets` runs it before the calibration and holding gates, so it works during calibration. `computeTargets` takes `safetyRaiseKcal`: the raise is `max(ordinary step-limited target, last target + raise)`, never lower, flagged `raisedForSafePace`.
- **A diet break is exempt from the step limit when it raises the target** (settles the note in MM-31).
- **Added, not in the ticket: a one-check-in hold.** The week after a safety raise the target is not lowered (`heldAfterSafetyRaise`). Without it the ordinary step limit walked the raise straight back (100 kcal a week for several weeks) and the "no oscillation" scenario failed in simulation. The hold lasts one check-in.
- The simulator (`test/support/coach_loop.dart`) calls the same function, so it cannot drift from the app.
- Tests: unit tests for the trigger (first week of a deficit, too few weigh-ins, uncertain pace, lean limit, cap, no raise when gaining or holding), `computeTargets` tests (not step-limited, never lowers, reductions still limited, diet-break exemption, hold), `nextTargets` tests (raises during calibration; waits when not too fast; waits until the check-in is due), and closed-loop tests over 20 simulated users.
- **Measured** (20 simulated 80 kg men at 25% body fat, expenditure 600 kcal above the starting estimate): a raise is issued for every one, in weeks 3 to 8 (median 4 to 5), each by more than 100 and at most 400 kcal, and the true loss in the three weeks after is under 1.0% a week. With the estimate right, none of 20 users gets a raise. Over 40 noisy users for 16 weeks, no raise was followed by two full-step falls.
- **Deviations from the ticket text**
  - The ticket's example (expenditure 400 kcal above the estimate) does not exceed the limit for a 92 kg man: he loses about 1.0% a week, at the limit, so correctly nothing is raised. The scenario uses an 80 kg man and 600 kcal.
  - The raise is not as early as "within one check-in of the slope becoming clear" might suggest: the trend's pace is noisy for the first weeks after the settling window, and the rule waits until it is over the limit by 1.5 of its own deviations. Trying 1.0 deviations gave first raises in weeks 3 to 6 instead of 3 to 8, with no raises for correctly estimated users in the same 20, but only about 9% fewer weeks over the limit. The ticket's 1.5 is kept; changing it is one constant.
  - The explanation shown to the user is generic ("You were losing weight faster than the app aims for at your body fat, because faster loss costs more muscle. Targets went up."). The numbers in the ticket's example message need MM-138.
- **Not verified**: a real user's data; the effect on a user who is under-eating relative to their target (the raise does not change what they eat); the rule when the estimator itself is held for lack of data (the trend still has to show 8 weigh-ins).
- **Residual risk**: after a raise, a noisy expenditure estimate can lower the target again and the loss can drift back over the limit; the rule acts again once that is clear. That is the estimator's noise (MM-24), not this rule.
