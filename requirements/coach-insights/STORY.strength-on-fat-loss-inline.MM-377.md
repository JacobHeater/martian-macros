---
id: MM-377
status: done
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
- Shown on every workout while it holds, until snoozed (MM-378); the weeks figure is live ("through 9 weeks").

The panel's measurement and nutrition roles reviewed this (`docs/agent-runs/mm377-strength-on-fat-loss/`, both "build
with the listed changes"). Choices I made without asking (say if any is wrong), from their findings:
- **The weeks are fat-loss weeks, not recomp weeks** (NU-2, ME-10): every targets record of the run is in fat-loss mode; a
  mode change inside the window breaks it. Recomp gets no line.
- **The basis is taken as of the workout's date** (NU-1, ME-5): the run of deficit targets in force then (`deficitStartOn`,
  with the restart a 14-day gap or a 7-day pause set, MM-147, MM-148), not "a two-week gap in targets", which targets never
  have. A maintenance week ends the run; the line can come back 6 weeks into the next run (NU-5).
- **Held is 2.5% below the smoothed value at the start, gone up is 5% above** (ME-2, ME-3): one effective rep, and two;
  about 0.75 and 1.5 times the noise of the comparison, so falling (MM-117's 5%), held and up sit on one scale.
- **The baseline is the latest session within 7 days either side of the start** (ME-1), so a person who began logging with
  the diet has one; **both ends rest on at least 2 sessions** and **4 sessions on distinct days with no gap over 28 days**
  lie between (ME-4).
- **No intake requirement** (NU-3): logged intake cannot establish a deficit (food records under-report by 11–41%). But the
  line is not said while progress is assessed as stalled: "your fat-loss goal" means little then.
- **Not shown while under-eating, nor with the underweight or low-body-weight cautions** (NU-6, SA-6), as well as the
  eating-disorder history.
- **The numbers show the band** (ME-6): the smoothed estimate at the start, now, and the value counted as held down to.
- **Declined**: the mixed-RIR guard (ME-8), recorded as a limitation; a recomp variant (NU-2).

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
- A best set logged with reps in reserve at one end and without at the other moves the estimate by about 5% with the same
  performance (the panel's ME-8); not guarded. The line claims nothing about muscle or lean mass: strength held does not
  show lean mass was kept (Murphy and Koehler 2022), and the words test forbids the words.

## Progress
- Built 2026-10-18. Engine: `strengthOnFatLossInsights`, `StrengthOnFatLossRule`, `deficitStartOn` (which
  `consecutiveDeficitWeeks` now counts from). Kind `strengthOnFatLoss`; words in `format/itemInsightText.ts`.
- Tests: `test/engine/strengthOnFatLossInsights.test.ts` (held with a bad day absorbed, not held, gone up at 5%, no or a
  lone baseline, a 29-day gap, distinct days, judged on the workout's own date, in progress, a restart, a maintenance week,
  recomp, a goal switch, a stall, a bodyweight lift, pounds, a deload), `test/format/itemInsightText.test.ts` (no muscle,
  mass, eating, kcal or weight in the words), `test/engine/itemInsightEvidence.test.ts`.
- Evidence register: `strengthOnFatLoss`, `StrengthOnFatLossRule.*`, `deficitStartOn`, `GapRule.deficitBreakDays`,
  `PauseRule.deficitBreakDays`, `estimatedOneRepMax`, `buildStrengthTrends.smoothing`.
- No story: the demo's lifts are not on six weeks of fat-loss targets with a flat strength; the line reuses the reviewed
  `InlineInsight`, and its states are covered by the workout stories.
