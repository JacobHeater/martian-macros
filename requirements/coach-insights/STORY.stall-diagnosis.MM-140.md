---
id: MM-140
status: proposed
component: coach-insights
related: [MM-137, MM-17, MM-19, MM-21, MM-23, MM-24, MM-27, MM-28, MM-32, MM-108, MM-123, MM-131, MM-133, MM-135, MM-136, MM-138, MM-139, MM-149]
---

# Story: When progress stalls, work out which kind of stall it is

## Context
"Plateau" is one word for at least four different situations, and the right response to each is different. Treating them alike is the
most common coaching error, in people and in apps:

| what is actually happening | right response | wrong response |
|---|---|---|
| **Not a stall yet**: too short to tell from noise | wait | anything |
| **Masked**: fat is being lost, water is hiding it (cycle, new training, creatine, a refeed, stress) | wait; show the other evidence | cut calories |
| **Intake**: average intake is above the target | say so plainly; make the plan easier to follow | cut the target further |
| **Data**: the log has become too patchy to know | fix the logging | cut calories |
| **The estimate was high**: intake is on target, data is good, weight is flat | a small reduction, or more activity, or accept a slower pace | blame the user |

The engine already handles the last case in its own way (the weekly loop lowers the target as the estimate falls). It says nothing to the
user in any of them.

Evidence: that fat loss can continue for two to four weeks while scale weight is flat, then show abruptly, is universally reported by
coaches and has a plausible mechanism in water retention; controlled documentation is thin (**emerging**; the Minnesota Starvation
Experiment's edema is the classic record). The durations below are **judgement** informed by the trend filter's own uncertainty.

## Decisions
Choices I made without asking (say if any is wrong):
- **A stall is defined against the goal, not against zero**: on a deficit goal, the trend slope over the last 21 days is less than a third
  of the intended pace, and that shortfall is larger than the slope's own uncertainty. For female profiles without cycle data the window
  is 28 days, so that one whole cycle is always inside it.
- **It is not assessed** in the first 21 days of a phase, during a pause, below Fair confidence (MM-139), or within 14 days of a lasting
  weight event (MM-136).
- **The diagnosis is the first of these that applies**:
  1. **Data**: fewer than 12 usable food days or fewer than 10 weigh-ins in the window. "The log is too thin to tell. Here is what would
     help."
  2. **Masked**: waist has fallen by more than its noise in the window (MM-155); or a cycle window, passing event or the start of training
     falls in the last 10 days. "Your waist is down 2 cm while the scale held. That is usually fat loss hidden by water. Nothing to
     change."
  3. **Intake**: the 21-day average intake on usable days is above the target band (MM-123). "Your average has been about 2,350 against a
     target of 2,100. At 2,350 the app would expect roughly the pace you are seeing." Followed by options, not instructions: keep the
     target; move to a gentler pace that matches what is being eaten (MM-128); shape the week (MM-124).
  4. **The estimate was high**: none of the above. "You have eaten at target and your weight has held. Your expenditure is lower than
     estimated; the target comes down by N at the next check-in." If the target is already at a floor, no reduction is possible, and the
     coach says so and offers a maintenance break (MM-135) or more daily activity.
- **The intake diagnosis is arithmetic, not accusation.** It states the average and what that average predicts. It never uses "cheat",
  "slip", "honest" or "accurate" (MM-108). The possibility that logged intake understates true intake is raised once, gently, only under
  diagnosis 4 when the estimate has fallen below 1.3 times resting energy: "An estimate this low often means some food is not making it
  into the log. Common places to look: oils, drinks, sauces, tastes while cooking."
- **One diagnosis per stall**, shown as an insight (MM-141) and on the Coach screen, updated at each check-in while the stall lasts.
- **Lean gain has the mirror**: no gain for 21 days. Same order, with "intake below target" in place of above.

Where the experts disagreed:
- The bodybuilding coach wanted two weeks, not three. The recovery and research experts held that two weeks is inside the noise for most
  users and inside one cycle phase for half of them. Three, and four without cycle data for female profiles.
- The adherence expert objected to ever stating that intake is above target: users know. The engineer: the app's credibility with users
  who *are* on target depends on distinguishing them from those who are not; a coach that responds to both with the same cut is unfair
  to the first group. Stated as arithmetic, with options.

## Description
An engine function from the analysis snapshot, waist series, events and adherence summary to "no stall", "not assessed (reason)", or a
diagnosis with its figures; rendering as an insight.

## Acceptance Criteria
```gherkin
Scenario: Too early
  Given ten days of flat weight on a new cut
  Then no stall is reported

Scenario: Masked by water
  Given 21 days of flat trend weight on fat loss, intake on target, and waist down 2 cm over four measurements
  Then the diagnosis is masked, and no reduction is attributed to the stall

Scenario: Intake above target
  Given 21 days of flat weight with usable days averaging 2,350 kcal against a 2,100 target
  Then the diagnosis states both figures and offers keeping the target, a gentler pace, or shaping the week

Scenario: Thin data
  Given 21 days with 7 usable food days
  Then the diagnosis is data, with what would help

Scenario: The estimate was high
  Given a simulated accurate logger eating at target whose true expenditure is 300 kcal below the estimate
  Then after 21 days the diagnosis is that expenditure is lower than estimated, with the size of the coming change

Scenario: At the floor
  Given the same with the target already at the calorie floor
  Then no reduction is offered, and a maintenance break or more activity is

Scenario: A female profile without cycle data
  Given 21 days of flat weight
  Then no stall is reported until 28 days

Scenario: Wording
  Then no diagnosis contains a word from the banned list in MM-108
```

## Notes
- Priority: should-have, before week six after launch, when the first real stalls appear.
- Depends on MM-149 for the adherence figures and MM-155 for waist noise.
- "More daily activity" is the only place the app suggests activity, and it suggests walking, not exercise sessions to burn calories
  (MM-144).
