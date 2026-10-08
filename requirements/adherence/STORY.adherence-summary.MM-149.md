---
id: MM-149
status: proposed
component: adherence
related: [MM-145, MM-27, MM-33, MM-40, MM-41, MM-92, MM-98, MM-108, MM-114, MM-121, MM-123, MM-124, MM-139, MM-140, MM-141, MM-150]
---

# Story: A weekly summary of what I did, described and not scored

## Context
See MM-145. "Adherence" appears in the monthly report's contents (MM-33) and is needed by the stall diagnosis (MM-140), and has no
definition. Left undefined it will be implemented as the obvious thing, a percentage of days under the calorie target, which is precisely
the measure that rewards under-eating (MM-92) and calls a 1,000 kcal day a success.

Three separate things are usually muddled under the word, and the coach needs them apart:
- **Monitoring**: did the user log and weigh? (Decides whether the coach can know anything.)
- **Intake against plan**: what was eaten relative to target, in both directions? (Decides whether a stall is a plan problem or a model
  problem.)
- **Behavior targets**: protein, training. (What the user actually controls.)

## Decisions
Choices I made without asking (say if any is wrong):
- **The summary covers a week (the seven days before each check-in) and shows five facts**:
  1. days logged, and of those how many complete (marked or classed usable, MM-27);
  2. weigh-ins;
  3. average intake on complete days against the week's average target, as a figure and its distance: "2,180 against 2,100: on target"
     using the band from MM-123;
  4. days at or above the protein minimum (MM-121), out of complete days;
  5. workouts, once the training log exists.
- **Distance from target is symmetric.** 200 kcal under and 200 kcal over are the same distance and are described in the same grammar.
- **A day below the calorie floor is never "on target"**, whatever the band says, and a week whose average is below the floor is described
  as below it, with a pointer to MM-114's notice when that applies.
- **No single adherence score, percentage or grade.** The five facts are shown as five facts. (The same reasoning as MM-116 and MM-139: a
  composite hides which thing is wrong.)
- **Partial and unlogged days are not counted against anything.** Three complete days and four unlogged ones is "3 days logged", and the
  intake line says it rests on three days.
- **Higher days are judged against their own targets** (MM-124); the weekly line uses the weekly average target.
- **Estimated entries are reported**: when more than half the week's calories came from estimates (MM-150), the intake line says "mostly
  estimated", since that limits what the average can be trusted for.
- **The engine consumes the same structure**: the stall diagnosis (MM-140) and confidence (MM-139) read these figures, so the user and the
  coach are always looking at the same account.
- **It feeds process rewards** (MM-92): complete days, protein days, weigh-ins and workouts are exactly the things that ticket counts.
- **Shown with the check-in summary** (MM-138), on the Coach screen, and month by month in the report (MM-33).

Where the experts disagreed:
- The product strategist wanted a weekly "consistency score" as a retention hook, pointing to its success elsewhere. The safety expert:
  any score that rises with logging completeness and closeness to target is one optimization step from compulsive tracking, and the
  literature on tracking apps and eating-disorder symptoms (MM-114) is a reason not to build it. The panel sided with five facts.
- The bodybuilding coach wanted calorie adherence judged one-sidedly on a cut (over is a miss, under is fine). Rejected for the reason
  in the Context.

## Description
An engine function from a week of intake days, completeness, targets, weigh-ins and workouts to the five facts; a card.

## Acceptance Criteria
```gherkin
Scenario: A typical week
  Given 6 days logged of which 5 are complete, averaging 2,180 kcal against a 2,100 target, 4 at or above the protein minimum, and 6 weigh-ins
  Then the summary states each of those, and describes intake as on target

Scenario: Symmetric
  Given two weeks, one averaging 250 kcal over target and one 250 kcal under
  Then the two are described with the same wording apart from the direction

Scenario: Below the floor
  Given a week of complete days averaging 1,050 kcal for a user whose floor is 1,500
  Then intake is described as below the app's minimum, never as on target or under target

Scenario: Few days
  Given 2 complete days in the week
  Then the intake line says it rests on 2 days

Scenario: No score
  Then the summary contains no percentage, grade or single number combining its parts

Scenario: Same account for coach and user
  Given a stall diagnosis citing an average intake
  Then the figure matches the adherence summary for the same period

Scenario: Mostly estimated
  Given a week where 60% of calories came from estimated entries
  Then the intake line says so
```

## Notes
- Priority: must-have before MM-140, which depends on it.
- A free user has targets set by hand (MM-85); the summary works the same against them.
