---
id: MM-142
status: proposed
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

## Notes
- Priority: should-have. It is the single most direct piece of education the app can give, at the moment the user is most receptive.
- Sodium is carried patchily by the food sources; the rule must not fire on missing data treated as zero (the same coverage check as
  fiber, MM-126).
- The 30% and 9 pm thresholds are **judgement** and should be tuned.
