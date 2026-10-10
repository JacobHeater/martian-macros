---
id: MM-123
status: in-progress
component: macro-targets
related: [MM-119, MM-41, MM-92, MM-98, MM-107, MM-108, MM-121, MM-124, MM-149, MM-153]
---

# Story: Targets that admit how well food can be measured

## Context
The Food screen shows "2,473 kcal" and counts down to zero. That presents an estimate built on estimates as if it were a bank balance.
The honest error budget of a logged day:

- **Labels.** US rules allow calories and several nutrients to exceed the label by up to 20% before a product is misbranded (21 CFR
  101.9(g)). Measured packaged foods ran about 8% over their labels on average, and restaurant items about 18% over, with large
  item-to-item spread (**moderate**: Urban 2010; Urban 2011).
- **Portions.** Unweighed portions are commonly off by 20% or more; MM-46 assigns 25 to 40% to hand portions.
- **Omissions.** Self-reported intake runs below measured expenditure by roughly 10 to 30% and more in some groups (**strong**: decades of
  doubly-labeled-water studies).
- **The target itself** rests on an expenditure estimate with a stated uncertainty of 150 to 400 kcal (MM-23).

A consistent error is absorbed by the adaptive loop (MM-23). The precision the *display* implies is not, and it does harm: a user 60 kcal
over believes they failed; a user chasing zero eats a rice cake at 11 pm.

Evidence that flexible rather than rigid control is associated with better outcomes and less disinhibited eating is **moderate**
(Westenhoefer; Stewart 2002; largely observational).

## Decisions
Choices I made without asking (say if any is wrong):
- **Calorie targets are rounded to the nearest 25 kcal for display** (2,473 becomes 2,475) and protein, carbohydrate and fat targets to the
  nearest 5 g. Stored and computed values are unrounded.
- **"On target" is a band, and the band is drawn.** Calories: within the larger of 5% and 100 kcal of the target, either side. The bar
  shows the band as a zone, not a line.
- **Inside the band the card says "on target"**, with the figure. It says "N kcal to go" below the band and "N kcal over" above it. Nothing
  is red (MM-108).
- **The primary adherence number is the 7-day average against target**, not today (MM-124, MM-149). One day is weather; the week is
  climate.
- **Carbohydrate and fat have no "on target" judgement at all.** They are shown as amounts against a guide. Only calories and the protein
  minimum are judged (MM-121).
- **The target card says once, in a line that can be dismissed**: "Food labels and portions are only accurate to within about 10 to 20%.
  Close is as good as exact."

Where the experts disagreed:
- The analytical user's advocate (product strategist) wanted an option to show exact, unrounded targets. Agreed as a setting, off by
  default; the band and wording do not change.
- The bodybuilding coach held that precision is a skill worth teaching and that a wide band teaches sloppiness. The band is not a license
  to eat at its top every day: the weekly average is what is judged, and it has no band wider than the same 5%.

## Description
Display rounding, a band definition in the engine or domain layer used by every screen and summary, and the bar's zone.

## Acceptance Criteria
```gherkin
Scenario: Rounding
  Given a computed target of 2,473 kcal and 172 g of protein
  Then the screens show 2,475 kcal and 170 g

Scenario: Inside the band
  Given a 2,400 kcal target and 2,310 kcal logged
  Then the card says on target

Scenario: Below and above
  Given a 2,400 kcal target
  Then 2,200 kcal logged reads as 200 kcal to go
  And 2,560 kcal logged reads as 160 kcal over

Scenario: Small targets
  Given a 1,400 kcal target
  Then the band is 1,300 to 1,500 kcal

Scenario: Fat and carbohydrate are not judged
  Then no screen describes carbohydrate or fat as over, under, hit or missed

Scenario: The engine is unrounded
  Given a displayed target of 2,475 kcal
  Then the stored target is 2,473 kcal and all calculations use it

Scenario: Exact display
  Given the exact-targets setting is on
  Then 2,473 kcal is shown and the band is unchanged
```

## Notes
- Priority: should-have, early; it changes the feel of the most-seen screen.
- MM-41's acceptance criteria use exact figures ("0 of 2,473 kcal"). When this ships that ticket's display examples are superseded; its
  behavior is not.
- The band must never make a day *below the floor* read as "on target" (MM-114, MM-149).

## Progress
Built: the band itself, in the engine: `CalorieBand` (the larger of 5% and 100 kcal either side of the target) and `intakeStandingOf`
(below, on target, above, and below the floor, which is never on target). The adherence summary (MM-149) uses it. Tested in the
engine's `adherence_summary_test.dart`.

Not built: display rounding of targets, the band drawn on the calorie bar, "on target" wording on the day's card, the dismissible
line about label accuracy, and the exact-targets setting. No screen's daily figures have changed.
