---
id: MM-377
status: proposed
component: coach-insights
related: [MM-361, MM-362, MM-366, MM-141, MM-77, MM-79, MM-92, MM-117, MM-118]
---

# Story: Strength held on a fat-loss goal, said under the lift

## Context
See MM-361, MM-362 and MM-366. MM-366's draft had "strength on a cut" under a lift: "Held through 6 weeks of eating below
maintenance. That is what a well-run cut looks like." The panel (`docs/agent-runs/mm366-workout-rules/`) found it undefined
and its words praising the diet, so the product owner put it after "volume jump" (2026-10-17). MM-141's dashboard rule of
the same name is not built either.

## Decisions
The product owner's (2026-10-17): later, once the figures are checked and the words reworked.

Choices I made without asking (say if any is wrong), from the panel's findings:
- **Credit the training, name the goal, not the intake** (CO-2, SA-6). Held: "Your strength on this lift has held through
  6 weeks on your fat-loss goal. Keeping it is the aim right now, and your training is doing that." Gone up: "Your strength
  on this lift has gone up during 6 weeks on your fat-loss goal. Your training is doing more than holding it." No
  "maintenance", "deficit", "cut" or grading word. Titled "Strength on fat loss".
- **The fat-loss weeks are the planned ones**: `consecutiveDeficitWeeks` ≥ 6, the function the relief offer uses, so a
  two-week gap in targets breaks it (TR-6). The words say "your fat-loss goal", not what was eaten, because partial logs
  cannot show intake (CO-2).
- **Held** is the lift's smoothed estimated max (MM-77) at least the value at the start of the 6 weeks, less a tolerance
  of about 2.5%, one rep in the estimate (TR-6). **For the measurement role to check**, or 0% if "held or up" is meant
  literally.
- **At least 4 sessions** of the lift in the 6 weeks, no gap over 28 days.
- **Bodyweight lifts are left out**: their estimate includes body weight, so losing weight looks like losing strength,
  and their figures would show the weight (TR-9, MM-118).
- **No direction beside the progression suggestion**: on a workout in progress the line states the fact only (TR-3).
- **Not shown with an eating-disorder history**, as MM-141 limits intake insights for that person (SA-6). Whether also
  under the low-body-weight caution is for the product owner (SA-6).
- Shown once when the 6 weeks are reached, then rested as MM-366's lines are.

## Description
The rule, its words and evidence rows, and its line under the lift.

## Acceptance Criteria
```gherkin
Scenario: Strength held
  Given 6 whole weeks of planned fat loss
  And at least 4 sessions of a barbell lift in that span with no gap over 28 days
  And its latest smoothed estimated max is at least 97.5% of the value at the start
  Then "strength on fat loss" is shown under that lift, with no direction

Scenario: A bodyweight lift
  Given pull-ups through 6 weeks of fat loss
  Then "strength on fat loss" is not worked out for them, and no estimate including body weight is shown

Scenario: Words
  Then the line names neither intake, maintenance, a deficit nor a cut, and has no word that grades

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then "strength on fat loss" is not shown
```

## Notes
- Needs the measurement role's check of the tolerance and the smoothing, and the nutrition role's view on planned versus
  eaten weeks, before it is built.
