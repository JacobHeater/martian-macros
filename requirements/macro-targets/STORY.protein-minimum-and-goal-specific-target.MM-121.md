---
id: MM-121
status: done
component: macro-targets
related: [MM-119, MM-24, MM-28, MM-29, MM-41, MM-92, MM-112, MM-120, MM-123, MM-132, MM-143, MM-149]
---

# Story: A protein minimum to clear and a target chosen for my goal

## Context
Today the protein target is the midpoint of the allowed range (1.9 g per kg for most users) for every goal, and the screen shows it as one
number to hit. Three weaknesses:

- **The midpoint ignores the goal.** Needs are higher in a deficit than at maintenance or in a surplus. Evidence: with resistance training
  at maintenance or above, gains in fat-free mass stop rising at about 1.6 g/kg, with an upper confidence limit near 2.2 (**strong**:
  Morton 2018, 49 trials; Nunes 2022 agrees in direction with a smaller effect). In a deficit, especially for lean trained people, more
  is protective: 2.3 to 3.1 g per kg of fat-free mass (**moderate**: Helms 2014 review; later meta-regression in energy-restricted
  lifters supports higher intakes with less certainty about the top of the range).
- **One number invites false precision in both directions.** 165 g against a 172 g target is not a miss; 240 g is not an error.
- **It ignores age and training.** Older adults need more per kilogram to get the same response (**moderate**: PROT-AGE, ESPEN). Someone
  who does not lift gains little muscle from extra protein (**moderate**: Nunes 2022 found no significant effect without resistance
  exercise) but still benefits from it for satiety and lean-mass retention when losing weight.

## Decisions
Choices I made without asking (say if any is wrong):
- **Two numbers, both shown: a minimum and a target.** The minimum is the bottom of the range; the target is a point in it chosen by the
  table below. The bar on the Food screen marks both.
- **The target, in g per kg of reference weight (MM-120)**:

| situation | minimum | target |
|---|---|---|
| fat loss or recomp, lifting | 1.6 | 2.0 |
| maintenance or lean gain, lifting | 1.6 | 1.8 |
| any goal, not lifting (0 training days and "not lifting yet") | 1.2 | 1.6 |
| lean user in a deficit (unchanged, per kg fat-free mass) | 2.3 | 2.6 |
| age 65 or over | never below 1.2, unless the kidney-disease cap applies | as above |
| chronic kidney disease (unchanged) | both are 0.8 per kg of body weight, overriding the age floor | same |

- **A day "met protein" at or above the minimum.** That is what streaks and summaries count (MM-92, MM-149). Reaching the target is shown,
  not scored separately.
- **There is no upper warning.** Above the range the bar simply fills; nothing turns red. In healthy adults intakes well above 2.2 g/kg have
  not shown harm in trials lasting up to a year (**moderate**; small studies, one research group). The kidney cap is the exception and is a
  hard ceiling with its own wording.
- **Protein is fixed in grams across the week**, including on higher-calorie days (MM-124) and through a diet break.
- **The lean-rule step is smoothed**: within 3 body-fat points above the lean threshold the target is interpolated between the two rules,
  so crossing the threshold does not jump it (MM-132).

Where the experts disagreed:
- The bodybuilding coach wanted 2.2 or more as the deficit target ("nobody lost muscle from too much protein"). The sports nutritionist
  and the adherence expert: every extra 20 g of protein comes out of carbohydrate and fat at a 1,600 kcal intake, and food enjoyment
  predicts adherence. 2.0 with a visible range up to 2.2 was the compromise; a user who wants more can simply eat more.
- The nutritionist wanted the non-lifter target at 1.2 on the evidence. The recomposition expert: the product exists to get people
  lifting, and 1.6 costs little. Kept at 1.6 target, 1.2 minimum.

## Description
`computeTargets` returns a protein minimum and target. Food, Dashboard and Coach show both; streaks and summaries judge against the
minimum as specified by MM-92 and MM-149.

## Acceptance Criteria
```gherkin
Scenario: A cut
  Given an 80 kg, 180 cm man who lifts, on fat loss
  Then his protein minimum is 128 g and his target 160 g

Scenario: Maintenance asks for less
  Given the same man on maintenance
  Then his target is 144 g

Scenario: Not lifting
  Given the same man with 0 training days and "not lifting yet"
  Then his minimum is 96 g and his target 128 g

Scenario: Meeting protein
  Given a minimum of 128 g and a target of 160 g
  When 135 g is logged
  Then the day counts as having met protein and the bar shows it between the two marks

Scenario: Well over
  Given the Food screen shows a 128 g minimum and a 160 g target
  When 230 g of protein is logged
  Then nothing is flagged, colored or warned

Scenario: Kidney disease
  Given the kidney answer is ticked
  Then minimum and target are both 0.8 g per kg of body weight, even if the user is 65 or over
  And exceeding it is flagged with the care-team note

Scenario: Senior protein floor
  Given a 67-year-old man weighs 80 kg and does not lift
  Then his protein minimum is at least 96 g unless the kidney-disease cap applies

Scenario: Approaching lean
  Given an 80 kg, 180 cm man who lifts and is on fat loss
  When his safety body-fat estimate moves from 18% to 17%, 16%, and 15%
  Then his unrounded protein targets are approximately 160, 164.2, 169.8, and 176.8 g
  And no consecutive target change exceeds 10 g

Scenario: Historical target before the minimum existed
  Given a target-history row predates schema v7 and records 160 g protein
  When the row is loaded after migration
  Then its recorded target remains 160 g and its minimum remains unknown
  And target history shows no fabricated minimum
```

## Notes
- Priority: should-have, with MM-120.
- Protein quality (leucine content, plant against animal sources) matters at the margin for users eating near the minimum on a fully
  plant-based diet (**moderate**). Not modelled; a single line in the protein explanation for users who mark themselves vegan would be the
  cheapest honest treatment. Future phase.
- Every figure in the table goes in the evidence register (MM-143) and to MM-29.

## Implementation and verification
- Added goal- and training-specific minimum/target calculations, the age-65 minimum floor, kidney-cap precedence, and a smooth lean-deficit
  interpolation. The evidence-range helper remains documented separately from the selected app target.
- Persisted the minimum in target history with schema v7; older history retains a null minimum rather than an invented value.
- Surfaced the minimum and target in Food, Dashboard, Coach, target history, and target-change details. Protein progress shows separate
  minimum and target marks; target-history rows from before the migration show only their recorded target.
- Verified with focused engine calculation/body-fat uncertainty tests, migration tests, and Food/history/target-change UI tests. The full
  `fvm dart run tool/bin/mm.dart check` passed.
