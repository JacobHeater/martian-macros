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
| new best | item | the set | the lift has at least 3 earlier sessions and the set's e1RM beats every earlier one for it | "A new best estimate for this lift: 102 kg, up from 99." |
| holding steady | pattern | the exercise | e1RM within 1% across the last 4 sessions of that lift | "About the same in your last 4 sessions. Adding one rep at this weight before adding load is a common next step." |
| volume jump | pattern | the exercise | this week's sets for the lift's main muscle group are ≥ 50% above the previous 4 weeks' average | "14 sets for chest this week against about 9 lately. Big jumps raise soreness; a smaller step is easier to recover from." |
| strength on a cut | pattern | the exercise | MM-141's "strength holding on a cut", for this lift | "Held through 6 weeks of eating below maintenance. That is what a well-run cut looks like." |

- **"New best" is praise MM-92 allows**: an outcome earned by training, like a personal record.
- **No rule comments on one set's reps or form**, because the app cannot see form.
- **Training rules show with an eating-disorder history, except "strength on a cut"**, which talks about intake. MM-141
  limits intake insights for that person to protein and logging.
- **Priority** follows the table's order: new best, volume jump, holding steady, strength on a cut.

## Description
The four rules, their words, evidence and register entries, and their placement in the workout and the exercise's history.

## Acceptance Criteria
```gherkin
Scenario: A new best
  Given a bench press set with an e1RM above every earlier bench press set
  Then the "new best" insight is shown under that set with both figures

Scenario: Holding steady
  Given four bench press sessions with e1RMs of 100, 100.5, 99.8 and 100.2 kg
  Then the "holding steady" insight is shown under the exercise

Scenario: Not enough history
  Given two sessions of a lift
  Then no pattern insight is shown for it

Scenario: Volume jump
  Given 14 chest sets this week and an average of 9 over the previous 4 weeks
  Then the "volume jump" insight is shown under the chest exercises with both figures

Scenario: The first sessions of a lift
  Given a lift's first session
  Then no "new best" insight is shown under any of its sets

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then "new best", "holding steady" and "volume jump" are shown as usual and "strength on a cut" is not
```

## UI/UX
- To be drawn: a workout with an insight under a set and under an exercise.
