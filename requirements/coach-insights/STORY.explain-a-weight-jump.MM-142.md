---
id: MM-142
status: done
component: coach-insights
related: [MM-137, MM-15, MM-16, MM-17, MM-18, MM-19, MM-20, MM-75, MM-108, MM-118, MM-127, MM-130, MM-136, MM-141, MM-158]
---

# Story: When the scale jumps, say what probably did it

## Context
The trend chart carries one general sentence: jumps inside the band are noise, not fat (MM-17). That is true and does not survive contact
with a reading 1.4 kg above yesterday's. At that moment the user wants a specific answer, and the app usually has the material for one in
its own data.

Evidence for the causes is **strong** in direction and well understood in mechanism; sizes vary by person:
- carbohydrate: each gram of glycogen is stored with three to four grams of water, so a day 200 g above usual can add most of a kilogram;
- sodium: a salty day raises body water for one to three days;
- food mass: a large or late meal is still in the gut at the morning weigh-in;
- training: hard or unfamiliar sessions cause local inflammation and water retention for a few days;
- the menstrual cycle (MM-19);
- alcohol, illness, travel, and starting creatine (MM-136);
- the first days after a change of phase (MM-130, MM-131).

And the arithmetic that should accompany them: gaining a kilogram of fat overnight would need a surplus of over 7,000 kcal.

## Decisions
Choices I made without asking (say if any is wrong):
- **It is shown when the user is looking at the reading**, on the weigh-in card after saving and on tapping a point on the chart. It is not
  pushed, and it is not an insight (MM-141).
- **It appears when a reading is above the trend by more than one standard deviation of the water noise** (0.6% of body weight, MM-18): for
  an 80 kg user, about 0.5 kg. A reading below the trend by the same amount gets the mirrored explanation, because a false "win" is as
  misleading as a false loss.
- **It lists up to three candidate causes found in the last 48 hours of the user's own data**, most likely first:
  - carbohydrate yesterday more than 30% above the user's 14-day average ("Yesterday's carbohydrate was 340 g; your usual is 230");
  - sodium likewise, when the entries carry it;
  - calories yesterday above the target band, or the last entry logged after 9 pm;
  - a workout logged yesterday or the day before (MM-75);
  - a cycle window (MM-19) or a weight event (MM-136);
  - alcohol logged yesterday (MM-127);
  - a phase change in the last 10 days.
- **With no candidate in the data it says so honestly**: "Nothing in your log explains this. Day-to-day changes this size are normal and
  usually water." It then offers to add a weight event (MM-136).
- **Every explanation carries the arithmetic line once**: "For this to be fat you would have needed about 9,000 kcal over your
  expenditure yesterday."
- **Causes are "likely", never certain** (MM-108). The app is correlating, not measuring.
- **A day far over target is not hidden.** If yesterday really was 3,000 kcal over, the explanation says most of the jump is still water
  and food mass, and gives the fat that such a surplus could actually store ("at most about 0.4 kg"). Honest in both directions.
- **Obeys the weight-display setting** (MM-118): not shown when raw readings are hidden.

Where the experts disagreed:
- The adherence expert wanted the explanation to lead with reassurance. The researcher: lead with the specific cause when there is one;
  reassurance without a reason is what the generic sentence already fails to do.
- Whether to show it for readings *below* trend. The physique expert insisted: users who celebrate a post-illness low are set up for the
  rebound. Kept.

## Description
An engine function from a reading, the trend, and the last 48 hours of intake, workouts, cycle days and events to an ordered list of
candidate causes with their figures; a small explanation component.

## Acceptance Criteria
```gherkin
Scenario: A high-carbohydrate day
  Given an 80 kg user whose reading is 1.1 kg above trend, after a day with 340 g of carbohydrate against a 14-day average of 230 g
  Then the explanation names the carbohydrate, with both figures, as the likely cause

Scenario: Several causes
  Given the same day also had a workout and a meal logged at 10 pm
  Then up to three causes are listed, in order

Scenario: Nothing in the log
  Given a reading 1 kg above trend with an ordinary previous two days
  Then the explanation says nothing in the log explains it, that this is normal, and offers to add an event

Scenario: A low reading
  Given a reading 1 kg below trend the morning after an illness event
  Then the explanation says it is likely water and will probably return

Scenario: A real overshoot
  Given yesterday was 3,000 kcal over target
  Then the explanation says how much of the jump could be fat at most, and that the rest is water and food

Scenario: Inside normal range
  Given a reading 0.2 kg above trend
  Then no explanation is shown

Scenario: Hidden numbers
  Given the weight display is Trend only or Hidden
  Then no per-reading explanation is shown
```

## UI/UX
- Under the weigh-in — apps/mobile/src/gallery/screens/Today.stories.tsx (Stories: WeighInJump, WeighInJumpFigures,
  WeighInJumpNothingInLog, WeighInLowAfterIllness, WeighInOvershoot). The coach's line under the trend row once today's
  weigh-in is saved, its figures one tap down, as the rebound note (MM-130).
- At the point on the chart — apps/mobile/src/gallery/screens/Progress.stories.tsx (Stories: ProgressWeightJump,
  ProgressPickedWeighIn, ProgressPickedJump). The latest reading explained under the chart; a tapped dot said with its
  distance from the trend.

## Progress (2026-10-20, feat/m2)
Built, no schema change:
- **The engine function** (`explainWeightJump`, pure): from a reading, the trend, the intake days, the food entries of
  the last sixteen days, workouts, period days, weight events and the targets history to a `WeightJumpExplanation`:
  the reading, the trend on its day, the threshold, up to three `WeightJumpCause`s in a fixed order, and the energy
  the difference would have cost as fat (`fatMassKcalPerKg`, 9,440 kcal/kg). A reading is explained from one standard
  deviation of the trend model's water noise (0.6% of the trend weight, `WeightJumpRule.noiseFraction`), above or
  below. Thresholds in `WeightJumpRule.ts`, each with a row in `docs/evidence.md` under "Why did the scale jump?".
- **The causes found**, in the order listed when several hold: a weight event noted in the last three days (today
  included); a day's carbohydrate 30% or more above the 14-day usual (yesterday or the day before, the larger excess
  named; the usual needs five logged days); sodium likewise, judged only on days where 70% of the calories state it
  (`SodiumDay.minimumCoverage`, the fiber rule's, MM-126), so a missing value is never zero; yesterday's calories
  outside the target band in force (`CalorieBand`), with the surplus over the expenditure estimate and the most fat it
  could store; alcohol logged on either day; a finished workout on either day; the reading inside a cycle window
  (`cycleWindows`, MM-20); the reading inside the settling window after a change of targets (`settlingWindows`, ten
  days). For a reading **below** the trend the carbohydrate, sodium and calorie rules are mirrored (30% under the
  usual; under the band, and only for a day marked complete, since a partial day under target proves nothing).
- **The words** (`weightJumpText`, `weightJumpCauseText`). The line: "Today’s weigh-in is 1.1 kg above your trend.
  Likely cause: carbohydrate yesterday, 340 g against your usual 230 g." With nothing found: "Nothing in your log
  explains this. Day-to-day changes this size are normal and usually water. If something happened, such as illness,
  travel or a salty meal, add it as a weight event in Progress." (on Progress: "add it under Weight events below").
  Below the trend: "This is most likely water and will probably come back." The arithmetic is among the figures one
  tap down, once: "For this to be fat: about 10,400 kcal over your expenditure yesterday". After a day over target
  the figures carry the honest variant instead: "Over target by 3,000 kcal", "Fat this could have stored: at most
  about 0.3 kg", "The rest of the difference: water and food still being digested"; or "None: still under your
  expenditure". Causes are "likely", never certain (MM-108); the voice test covers the words.
- **Where it shows**: on the Dashboard under the trend row once today's weigh-in is saved, as the coach's line with
  "The numbers behind this" one tap down (the same `InlineInsight` the rebound note uses, MM-130); on Progress under
  the trend chart and its band sentence, for the latest weigh-in in range when it is far from the trend, and for any
  weigh-in picked on the chart: a tap on its dot or near it anywhere down the plot, or, with the chart focused, the
  arrow keys (Home and End to the first and last). The picked dot is drawn larger in the text colour, ringed with the
  canvas. A picked reading inside the noise is said as a caption ("Mon, Sep 21: 82.1 kg, +0.1 kg from the trend, inside
  the day-to-day noise."); one with an explanation is said once, the caption carrying the reading ("Today: 83.3 kg.")
  and the line the distance. The note sits in a region that is announced, so a keyboard pick is heard. "How to read
  this" says a dot can be tapped or reached with the arrow keys. Changing the range forgets the pick.
- **Kept back** (`weightJumpWithheld`) under 18, with an eating-disorder history (nothing about weight or the body,
  MM-141), or when weight is hidden: the `weightHidden` safeguard flag that MM-118's setting will set. The setting
  itself is not built (MM-118, M4), so "Trend only or Hidden" cannot yet be chosen; the gate is in place and tested.
- A line of the app's own has no switch and so no "Settings for" button: MM-418, found by the panel here and fixed with it.
- Tests: `test/engine/weightJump.test.ts` (the seven scenarios' engine half and the mirrored rules, 23 tests),
  `test/format/weightJumpText.test.ts` (the words), `test/dashboard/weightJump.test.tsx` (the row, the figures, the
  inside-noise case, nothing in the log, below after illness, the eating-disorder gate), `test/progress/weightJumpChart.test.tsx`
  (the latest reading, a picked dot, the range forgetting the pick).
- Stories: the nine under UI/UX above. Panel review (one round): `docs/agent-runs/mm142-weight-jump/`.

Decided here (say if wrong):
- **The "logged after 9 pm" cause is left out.** Food entries carry a day and a meal, never a clock time, so the app
  cannot judge it; a cause it cannot judge is not claimed. The scenario "Several causes" is met with the carbohydrate,
  the workout and alcohol instead.
- **Order of likelihood is fixed by kind**, not by the size of each signal: what the person noted themselves first
  (their own account), then yesterday's food (carbohydrate, sodium, calories, alcohol), then a workout, the cycle, a
  change of targets. Ranking by size would compare grams with milligrams with days.
- **The weight-event offer is in words**, "add it as a weight event in Progress", not a button in the line: the inline
  insight has no action slot, and the Add button has one home, the Weight events section on Progress (rule 4).
- **A reading below the trend is explained too**, as the ticket decided, with the mirrored rules: a day well under the
  usual carbohydrate, or under the target band and marked complete.
- **The surplus that could be fat is counted over the expenditure estimate**, not over the target: a day 300 kcal over
  target and still under expenditure stores none, and the line says so.
- **The sibling named**: the rebound note under the same row (`reboundText`, MM-130) for the Dashboard; the chart's
  caption and "How to read this" disclosure for Progress. Both are `InlineInsight`, the design system's one home for
  the coach's line under an item (MM-362).
- **The arithmetic sentence lives in the figures, not the closed line** (the panel, PD-1 and UX-2: the line under a
  two-line row was five to eleven caption lines). "Carries the arithmetic line once" is read as once per explanation:
  it is the last of the figures, and after an overshoot the figures say the most that could be fat and that the rest
  is water and food. The line keeps the distance, the likely causes, the honest "nothing in your log" and its offer,
  and for a low reading that it will probably come back.
- **The pick on the chart is a tap or the arrow keys**; the chart stays `role="img"` and takes focus when it can be
  picked. The latest reading is explained without any of that. A list of recent weigh-ins (the direction's "readings
  list") would be the fuller answer and is not built here.
- **No switch for the line** (the panel's UX-1 and its safety note): it is not an insight (MM-141) and has no kind; it
  goes with the weight display (MM-118) and the safeguards. So it offers no "Settings for" (MM-418).

## Notes
- Priority: should-have. It is the single most direct piece of education the app can give, at the moment the user is most receptive.
- Sodium is carried patchily by the food sources; the rule must not fire on missing data treated as zero (the same coverage check as
  fiber, MM-126).
- The 30% and 9 pm thresholds are **judgement** and should be tuned.
