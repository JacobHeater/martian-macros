---
id: MM-36
status: in-progress
component: adaptive-coach
related: [MM-22, MM-25, MM-28, MM-31, MM-33, MM-34, MM-129, MM-130, MM-132, MM-133, MM-135, MM-140, MM-507]
---

# Story: Plan the phases ahead

## Context
Changing body composition over a year is a sequence: cut, hold, gain, hold. Today the user picks one goal and the app follows it until they
change it. Nothing says when to change, or how long the current phase should last.

## Decisions (made with the product owner)
- **At each phase boundary the app recommends the next phase** from current body fat and rate of progress (cut, then maintenance, then lean
  gain, and so on).
- **A goal body fat may be set**, within the floors in MM-28.

Choices I made without asking (say if any is wrong):
- **The plan is derived each time, never stored.** The current phase is the trailing run of targets in the goal's mode; its end and the
  next phase come from the targets history, the trend and the body-fat range (`planPhases`, `state.phasePlan`).
- **Body fat is read as a range, never a point (MM-34).** A cut ends once the *lower* end of the range (the estimate less 0.6745
  deviations, the quarter-chance figure MM-132 gives the safety rules) reaches its goal, so a cut stops as soon as the goal is plausibly
  reached; a lean gain ends once the *upper* end reaches its line. A wider range ends a cut sooner and a gain sooner.
- **Without a goal, a cut runs to 15% for men and 23% for women**, the line under which `recommendMode` starts someone on a lean gain;
  a gain ends at MM-129's lines, read from `LeanGainRule` (`stopBodyFatPercent`, 20% or 30%; `stopWeeks`, 26), one source for both.
- **"Sixteen weeks of deficit" is unbroken deficit** (`consecutiveDeficitWeeks`), so a diet break of a week or more (MM-135) restarts
  it. Ending the cut is a recommendation, apart from the break MM-135 plans at twenty.
- **"Progress stalled" is a stall with the target already at the calorie floor** (MM-140, `atFloor`): any other stall is the loop's
  to correct, not a reason to end the phase.
- **After a cut, maintenance for the weeks MM-130 suggests**, then a lean gain if the lower end is at the goal, another cut if not;
  after a gain, two weeks of maintenance, then a cut if wanted. The hold shows its end on the Coach and, once run, recommends the next.
- **The soft floor's time limit is four weeks**: a goal under it, once reached, is held four weeks at most, then a lean gain is
  recommended (`PhaseRule.lowGoalHoldWeeks`).
- **A projected end needs a steady pace**: the trend's slope two of its deviations from flat in the phase's direction. Otherwise only
  the longest-phase date is shown. The fat share of each kilogram follows the partition (`leanFractionOfChange`).
- **Recomp shows only how long it has run**; its review is MM-133. Maintenance chosen for itself is open-ended.
- **With an eating-disorder history the phase and its length show and nothing else**: no projection to a body fat and no
  recommendation from one. A mode the policy does not offer is never recommended.
- **Built like its siblings**: the phase and its projected end are `StatRow`s with what they rest on as `detail`, as the Body row is
  (MM-342), under the goal's blurb; the recommendation is a `Notice` with a title and two `MmButton`s, as the maintenance drift asks
  (MM-130). "Start …" changes the goal through the same path as the goal sheet (a deficit goes through the health check); "Choose
  another" opens the sheet.
- **Setting the goal is MM-507.** Storing it needs a table and the schema was held elsewhere, so this ticket builds the check, the
  words, the engine's use of a goal, and `GoalBodyFatRepository` with its in-memory fixture and contract; no screen sets one, rather
  than a setting that forgets itself on restart.

## Description
- The user may set a goal body fat (or goal weight). Below the soft floor it is accepted with a warning and a time limit; below the hard
  floor it is refused.
- The Coach screen shows the current phase, how long it has run, and a projected end at the current pace.
- When a phase ends (goal reached, sixteen weeks of deficit, or progress stalled), the app recommends the next phase with its reason, and
  the user accepts or chooses another.

## Acceptance Criteria
```gherkin
Scenario: A goal too low
  Given a woman sets a goal of 14% body fat
  Then it is refused, with the reason

Scenario: A projected end
  Given a fat-loss phase at a steady pace toward a goal
  Then the Coach screen shows about when the goal will be reached

Scenario: The next phase
  Given a man has cut to 12% body fat
  Then the app recommends maintenance, then lean gain, and says why
```

## UI/UX
- CoachPhaseProjected — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachPhaseProjected). The phase, how long it has
  run, and about when it ends, under the goal.
- CoachPhaseNext — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachPhaseNext). A man cut to 12%: maintenance, then a
  lean gain, with why; nothing changes until he chooses.
- CoachPhaseChooseAnother — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachPhaseChooseAnother). The goal sheet from
  the recommendation.

## Notes
- Depends on a body-fat estimate better than the formula (MM-34), or the projections are fiction. MM-34 gives the range and what it
  rests on; with the formula alone the range is wide and the plan says so by ending a cut early.
- Part of the paid Coach unlock (MM-84); not gated here, as nothing else in the Coach is yet.
- Built: `engine/planPhases.ts`, `PhasePlan`, `PhaseRecommendation`, `PhaseEndReason`, `PhaseRule` (the gain's end read from MM-129's `LeanGainRule`; each new figure an evidence row, and a
  How this works question), `SafetyBounds.goalBodyFatFloorsPercent`; `state.phasePlan`; `coach/PhaseRows.tsx` in the Coach's goal
  section; the words in `format/phaseEndText.ts`, `phaseNextTitle.ts`, `phaseRecommendationText.ts`, `goalBodyFatCheckText.ts`;
  `GoalBodyFatRepository` (`domain/repositories/`), `InMemoryGoalBodyFatRepository`, `test/contracts/goalBodyFatRepositoryContract.ts`.
- Tests: `test/engine/planPhases.test.ts` (every scenario, the range against the point, sixteen weeks, the stall at the floor, the
  gain's line and length, the hold and what follows it, the projections, the goal floors and the time limit, an eating-disorder history,
  the policy), `test/coach/phasePlan.test.tsx` (the Coach rows, the recommendation and taking it). Not run locally; CI validates. Not
  seen on a phone.
- Remaining: setting the goal (MM-507).
