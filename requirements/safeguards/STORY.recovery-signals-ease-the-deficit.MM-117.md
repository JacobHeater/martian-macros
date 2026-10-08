---
id: MM-117
status: proposed
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
