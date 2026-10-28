---
id: MM-681
status: in-progress
component: coach-insights
related: [MM-609, MM-617, MM-663, MM-665, MM-667, MM-677, MM-678]
---

# Bug: the coach is mute on training, cardio and steps, in the brief and on the day

## Context
The owner, 2026-10-28: "neither in the deterministic model or the ai model does coach hold the user accountable for
cardio/steps in their body recomp/fat loss journey. that's a fundamental failure. in fact, coach is completely mute on
training at all. i don't care about past decisions. coach is a goon here."

Why it was mute:
- The Executive summary at the top of the Coach tab (MM-667) narrates an `ExecutiveBrief` (MM-663) that holds only
  energy, protein and logging consistency. Neither the deterministic paragraph nor the model's narration (MM-665) is
  given a single training, cardio or steps figure, so neither can say one.
- "What your data says" opens on 1d, and on 1d only the food of the day is analysed; the training signals (MM-609) and
  the new cardio and steps signals (MM-678) run only on 7d and longer, where most people never go.

## By the product owner
- The coach holds the person accountable for lifting, cardio and steps on a fat-loss or recomp program, in both the
  deterministic words and the model's, every time the Coach tab opens.

## Description
- The brief carries a `TrainingBrief`: lifting sessions this week against the days a week the person set, days since
  the last session, the week's cardio minutes against the floor, steps a day against the floor, whether a wearable is
  in use (MM-677), and the goal. The deterministic paragraph ends with the training orders; the model is given the same
  figures, told to hold the person to them, and allowed to cite them. The Executive summary card shows the three rows.
- On 1d the day's findings include the week's accountability findings from the training analysis: training stopped or
  dropped, cardio under the floor, steps under the floor, and their holding-up counterparts.

## Decisions
Choices made without asking (say if any is wrong):
- **Lifting is held to `trainingDaysPerWeek`** from the setup (the days a week the person said they train), over the
  last seven days through today, counting finished workouts with a hard set (MM-609's session).
- **Cardio and steps are held on fat loss and recomp** (the owner, MM-678); on maintenance and lean gain the brief
  speaks of lifting only. With no wearable in use on fat loss or recomp, the brief says cardio and steps are not being
  counted and where to connect one.
- **Nothing about training under the eating-disorder or under-eating safeguards** (`restricted`, MM-609) and nothing on
  the protected path: the brief's training block is left out.
- **Draft lines** (the owner reads them on the phone, as MM-678's):
  - "Lifting: {n} of the {target} sessions you set this week; {left} to go." / "...; the week is covered."
  - "No lifting in {days} days." when a week or more has passed.
  - "Cardio {minutes} against the {floor} floor: {more} more on the watch this week." / "Cardio {minutes}, over the floor."
  - "Steps about {steps} a day against {floor}: {short} more a day." / "Steps about {steps} a day, over the floor."
  - "No watch connected: cardio and steps are not being counted. Connect one in Settings › Health."

## Acceptance Criteria
```gherkin
Scenario: The brief holds the person to training
  Given a fat-loss goal, 4 training days a week set, 1 lifting session in the last seven days, 96 minutes of cardio and about 6,100 steps a day
  When the Coach tab opens
  Then the Executive summary says 1 of 4 sessions with 3 to go, 1 h 36 min against 2 h 30 min with 54 min more, and 6,100 against 8,000 with 1,900 more
  And the model's request carries those figures and allows them

Scenario: The day's findings hold the person to training
  Given the same person
  When "What your data says" opens on 1d
  Then the cardio and steps fixes are among the day's findings

Scenario: Maintenance speaks of lifting only
  Given a maintenance goal
  Then the brief says the sessions and nothing of cardio or steps
```

## Notes
Guarded by `apps/mobile/test/engine/trainingBriefOf.test.ts`, `apps/mobile/test/format/trainingBriefText.test.ts` and
`apps/mobile/test/coach/coachTrainingAccountability.test.tsx`.
