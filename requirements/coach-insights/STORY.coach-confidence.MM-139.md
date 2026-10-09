---
id: MM-139
status: in-progress
component: coach-insights
related: [MM-137, MM-23, MM-27, MM-40, MM-98, MM-107, MM-131, MM-132, MM-136, MM-138, MM-140, MM-149, MM-153]
---

# Story: Say how sure the coach is, and what would make it surer

## Context
The Coach screen shows the expenditure estimate as "2,739 ± 411 kcal / day" and whether it is the starting estimate or a measurement
(MM-23). That is honest and, for most users, unreadable. "± 411" does not tell them whether to trust this week's target, or what to do
about it.

The confidence the user needs is not a statistic. It is an answer to: *is the coach working from good information right now, and if not,
what is the one thing I could do?*

## Decisions
Choices I made without asking (say if any is wrong):
- **Three levels, in words: Learning, Fair, Good.** No percentage, no score out of 100, no meter that fills up. A numeric confidence would
  itself be false precision.
- **The level is the worst of these parts, and the screen shows each part's state**:

| part | Good | Fair | Learning |
|---|---|---|---|
| estimate | a measurement with a standard deviation under 200 kcal | a measurement, 200 to 350 | the starting estimate, or over 350 |
| food log, last 28 days | 20 or more usable days | 10 to 19 | under 10 |
| weigh-ins, last 28 days | 20 or more | 8 to 19 | under 8 |
| stability | nothing below | a logging-style restart (MM-27), a phase change (MM-131) or a lasting weight event (MM-136) in the last 14 days | the estimate is at one of its limits (1.1 or 3.0 times resting energy, MM-23) |

- **One next step, the one that would help most**, chosen by which part is worst: "Weigh in on 4 more mornings this week", "Mark days
  complete when they are", "Nothing to do: the estimate is settling after you changed goal." When parts tie, prefer (in order) waiting
  for stability, completing the food log, recording weight, then continuing to log for a clearer estimate. If the estimate is clamped to a
  safety bound, review food logging first regardless of ties.
- **Level drives behavior that already exists, and is how it is explained**: at Learning the engine holds targets (MM-23, MM-24); the card
  says targets are held *because* the coach is still learning.
- **Level drives wording everywhere**: at Learning and Fair, statements about pace, expenditure and progress use "about" and "so far";
  the stall diagnosis (MM-140) will not run below Fair.
- **The number stays, one tap down**, for users who want it, written as a range ("probably between 2,330 and 3,150") in preference to ±.
- **Shown on the Coach screen in full and on the dashboard as the single word** (MM-98).
- **Body-fat confidence is separate** and shown with the body-fat range (MM-132), not folded in.

Where the experts disagreed:
- The product strategist wanted a visible score that rises with logging, as a motivator. The safety and research experts: a score that
  rewards more logging and more weighing is a compliance game, and its interaction with MM-92 (no rewards that push toward compulsion)
  is poor. Words, not a score.
- The engineer objected to the "worst of" rule as crude compared with deriving one level from the estimate's variance alone. The
  variance already reflects the data; the parts are shown because the user can act on parts and cannot act on a variance.

## Description
An engine function from the analysis snapshot to a level, per-part states and a next-step code; a card.

## Acceptance Criteria
```gherkin
Scenario: A new user
  Given day 5 since onboarding
  Then the level is Learning, the card says targets are held while the coach learns, and the next step names what is needed

Scenario: Good data
  Given 28 days with 24 usable food days, 25 weigh-ins and a measurement with a standard deviation of 170 kcal
  Then the level is Good

Scenario: One weak part
  Given the same but 9 weigh-ins
  Then the level is Fair and the next step is about weighing in

Scenario: After a goal change
  Given good data and a switch from fat loss to maintenance 6 days ago
  Then the level is Fair, and the next step says nothing is needed while the estimate settles

Scenario: At a limit
  Given the estimate is held at 1.1 times resting energy
  Then the level is Learning and the card says food is probably going unlogged

Scenario: A deterministic next step when data parts tie
  Given the estimate is not clamped and has been stable recently
  And there are 6 usable food days and 5 weigh-ins in the last 28 days
  Then the next step is to complete the food log before recording more weights

Scenario: No score
  Then no screen shows confidence as a number, percentage or progress bar

Scenario: Wording follows level
  Given the level is Fair
  Then the pace shown on the Coach screen is worded as approximate
```

## Notes
- Priority: must-have with MM-138.
- The thresholds are starting values chosen to match the engine's existing "enough data" rule (10 usable days, 8 weigh-ins, MM-23) at the
  Learning boundary. Tune the others on the simulator so that Good means the truth is within about 200 kcal nine times in ten.
- Food-source quality (MM-153) could become a fifth part once the database exists.

## Progress (implemented; partially simulator-validated)
- Added the Learning/Fair/Good assessment from estimate uncertainty, usable food days, weigh-ins and recent stability, with one next-step
  code. Learning now holds ordinary adaptive target updates while safety raises and user-requested goal/profile corrections remain immediate.
- Added full Coach-screen part states and next steps, a one-word dashboard label, approximate wording at Learning/Fair, and an expandable
  metabolism estimate shown as a range instead of a visible `±` statistic.
- Saved confidence with each target explanation's JSON, preserving old explanation records that have no confidence field.
- **Baseline simulation passed.** [coach_confidence_simulation_test.dart](../../packages/engine/test/coach_confidence_simulation_test.dart)
  runs 100 deterministic users; at least 70 must reach Good, and at least 90% of those estimates must be within 200 kcal of their
  28-day true expenditure. This validates only the baseline synthetic setup, not weight-event behavior.
- **Not done:** connecting dated weight events once MM-136 exists and validating the confidence behavior with those events in a
  simulator. Next-step priority and data boundaries have engine tests but are not simulator-validated. Keep this ticket in progress
  until event integration and validation are checked.
