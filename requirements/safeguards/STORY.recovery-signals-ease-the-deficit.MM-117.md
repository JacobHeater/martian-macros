---
id: MM-117
status: in-progress
component: safeguards
related: [MM-110, MM-24, MM-31, MM-77, MM-79, MM-116, MM-128, MM-135, MM-138, MM-141]
---

# Story: Offer to ease a deficit when recovery is failing

## Context
MM-116 collects how the user is coping. MM-77 measures strength. This ticket is what the coach does with them.

The rule a good coach applies: on a cut, holding strength is success (MM-79). Losing strength across several lifts for several weeks,
with hunger, energy or sleep at the bottom of the scale, means the deficit is too large or has gone on too long for this person now. The
response is to ease it, briefly or permanently, not to push through.

Evidence: strength is largely preserved in a moderate deficit with resistance training (**moderate**: Murphy and Koehler 2022 found lean
mass gain impaired and strength gain not significantly so), which is what makes a clear, multi-lift decline informative. That such a
decline *predicts* muscle loss, and the thresholds below, are **judgement**.

## Decisions
Choices I made without asking (say if any is wrong):
- **It applies only on a deficit goal** (fat loss or recomp).
- **Two triggers, either sufficient**:
  - strength: the smoothed e1RM (MM-77) is down 5% or more on at least two lifts trained at least three times in the last three weeks;
  - self-report: in each of the last two weekly check-ins (MM-116), at least three of the five answers were in the bottom two points.
- **The response is an offer, never an automatic change**, with three choices: a maintenance week now (a diet break taken early, counted
  as one, MM-31); a slower pace from now on (one step gentler, MM-128); or carry on. The app says which it would pick and why.
- **"Carry on" is respected** and the offer is not repeated for three weeks unless both triggers hold at once.
- **Short sleep adds a line, not a trigger**: when reported sleep averages under six hours, the offer mentions that short sleep during a
  deficit appears to shift loss away from fat, and that sleep may be the cheaper fix. Stated as "appears to" (MM-108).
- **It never recommends eating less, training more, or adding cardio.**

Where the experts disagreed:
- The recovery expert wanted the maintenance week applied automatically. The behavior-change expert: autonomy matters more here than
  anywhere, since a user who feels overruled leaves, and the triggers are too soft to justify overruling. Offer only.
- The bodybuilding coach: a 5% e1RM drop can be a bad night or a deload. Hence two lifts, three sessions each, on a smoothed trend.

## Description
An engine function from the strength trends, recovery answers, goal and deficit history to an optional offer with reasons; shown as an
insight (MM-141) and on the Coach screen.

## Acceptance Criteria
```gherkin
Scenario: Strength falling on a cut
  Given a user on fat loss for nine weeks whose squat and row e1RM are each down 6% over three weeks, with at least three sessions each
  Then the coach offers a maintenance week or a slower pace, and says which it suggests

Scenario: One lift, one bad day
  Given one lift down 8% in a single session
  Then no offer is made

Scenario: Self-report alone
  Given two consecutive check-ins with hunger, energy and sleep in the bottom two points
  Then the offer is made

Scenario: Declined
  When the user chooses to carry on
  Then targets are unchanged and the offer does not return for three weeks

Scenario: Accepted as a break
  When the user takes the maintenance week
  Then targets go to maintenance at once and the unbroken-deficit count restarts afterwards

Scenario: Not on a deficit
  Given the goal is lean gain and strength is falling
  Then this offer is not made

Scenario: Never the other direction
  Then no outcome of this rule lowers calories or suggests more exercise
```

## Notes
- Priority: should-have; the self-report trigger can ship before the training log exists.
- Without the training log (MM-75) only the self-report trigger exists.
- Deloads and program changes are out of scope (MM-79, MM-144); a strength drop from a deliberate deload will trigger this, which is why
  "carry on" must be one tap and free of comment.

## Progress
Built:
- **The self-report trigger** (`findReliefOffer`): on a fat-loss or recomp goal whose current targets are a deficit, when each of the
  last two weekly check-ins (MM-116) had at least three of its five answers in the bottom two points. The two must be 5 to 14 days
  apart, so one week answered twice is one check-in, and the latest must be within 7 days. Not during a pause.
- **An offer, never a change**: a notice on the dashboard and the Coach screen with three choices, and which the coach would pick and
  why. Eight or more weeks into the deficit, or with no slower pace left, it suggests the maintenance week; earlier, the slower pace.
  The suggested choice is the prominent button.
- **A maintenance week now**: targets go to maintenance at once, beyond the weekly step limit, flagged as the week the user chose
  (`TargetFlag.requestedBreak`, explained as such in the target-change summary). The next check-in is a week later. Being at
  maintenance it ends the unbroken deficit, so the count restarts when the deficit resumes.
- **A slower pace**: one step gentler of 1.0, 0.75 and 0.5% a week (`slowerPace`), stored as the chosen pace. It takes effect at the
  next check-in. Not offered on recomp, or at 0.5% already.
- **Carry on**: one tap, no comment, nothing changes.
- **Quiet for three weeks** after any of the three answers.
- **Short sleep adds a line** when the hours given with those check-ins average under six, worded "appears to". It is never a trigger.
- **Never the other direction**: the three outcomes are a raise, a gentler pace or no change. A test checks the slower pace never
  lowers the target and forbids "eat less", "cardio", "train more", "exercise" and "push through" in the offer.
- Thresholds are in `ReliefRule`. Schema version 23 stores the day a maintenance week was taken and the day the offer was last
  answered. Tests: `relief_offer_test.dart` (engine and app), the setup contract and the migration test.

Not built:
- **The strength trigger**: it needs the training log and the strength trend (MM-75, MM-77). So "unless both triggers hold at once"
  does not apply yet: the three weeks of quiet are unconditional.
- It is a notice, not an entry in the insight catalog (MM-141), so it is not rationed with insights. It is a safety offer and should
  not be.
- The pace names and what each costs (MM-128): the offer shows the percentage only.
- Not checked on a device.
