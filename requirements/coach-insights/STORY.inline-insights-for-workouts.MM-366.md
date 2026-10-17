---
id: MM-366
status: proposed
component: coach-insights
related: [MM-361, MM-362, MM-79, MM-92]
---

# Story: The first inline insights on workouts

## Context
See MM-361 and MM-362. The training log already records sets, works out an estimated one-rep max (e1RM) for each lift, and
counts weekly volume (`WeeklyVolumeScreen`). Today the coach says nothing next to any of it.

## Decisions
The product owner's (2026-10-17): every trackable surface, and training is named.

Choices I made without asking (say if any is wrong). **The catalog and its figures are a draft** for the panel's training and
coaching roles to check:

| rule | basis | anchored under | fires when | the line (example) |
|---|---|---|---|---|
| holding steady | pattern | the exercise | e1RM within 1% across the last 4 sessions of that lift | "About the same in your last 4 sessions. A small step up in reps or load is a common next step." |
| volume jump | pattern | the exercise | this week's sets for the lift's main muscle group are ≥ 50% above the previous 4 weeks' average | "14 sets for chest this week against about 9 lately. Big jumps raise soreness; a smaller step is easier to recover from." |
| strength on a cut | pattern | the exercise | MM-141's "strength holding on a cut", for this lift | "Held through 6 weeks of eating below maintenance. That is what a well-run cut looks like." |

- **No "new best" line.** The first draft had one under the set. Drawing it showed the finished workout already has a Personal
  records card that says the same ("estimated max 234.6 lb, up from 231.8 lb"), so the line was dropped at the design stage
  (the rule of siblings, MM-318). No inline line sits under a set.
- **The line comes after "Last time" and the suggestion**, before the sets (the panel's PD-5).
- **No rule comments on one set's reps or form**, because the app cannot see form.
- **Training rules show with an eating-disorder history, except "strength on a cut"**, which talks about intake. MM-141
  limits intake insights for that person to protein and logging.
- **Priority** follows the table's order: holding steady, volume jump, strength on a cut.
- **For the training role**: whether a line about a lift and the progression suggestion (MM-79) on the same card can both give
  advice (the panel's PD-5 question).

## Description
The four rules, their words, evidence and register entries, and their placement in the workout and the exercise's history.

## Acceptance Criteria
```gherkin
Scenario: Holding steady
  Given four bench press sessions with e1RMs of 100, 100.5, 99.8 and 100.2 kg
  Then the "holding steady" insight is shown under the exercise

Scenario: Not enough history
  Given two sessions of a lift
  Then no pattern insight is shown for it

Scenario: Volume jump
  Given 14 chest sets this week and an average of 9 over the previous 4 weeks
  Then the "volume jump" insight is shown under the chest exercises with both figures

Scenario: No line under a set
  Given a set that beats every earlier one for its lift
  Then no inline insight is shown under it, and the Personal records card says the new best

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then "holding steady" and "volume jump" are shown as usual and "strength on a cut" is not
```

## UI/UX
- WorkoutWithInsights, WorkoutInsightOpen, in `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`. The line under the
  demo's lateral raise, whose history really is flat. Reviewed by the panel (`docs/agent-runs/mm361-coaching-insights/`).
