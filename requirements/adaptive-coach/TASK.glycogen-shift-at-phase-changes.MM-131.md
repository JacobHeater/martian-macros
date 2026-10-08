---
id: MM-131
status: proposed
component: adaptive-coach
related: [MM-18, MM-22, MM-23, MM-24, MM-30, MM-35, MM-115, MM-130, MM-136, MM-139, MM-158]
---

# Task: Do not mistake the water that moves at a phase change for tissue

## Context
When energy intake changes level (a deficit starts, a deficit ends, a diet break begins) body weight shifts by one to two kilograms within
about a week for reasons that are not fat or muscle: glycogen is spent or refilled, each gram taking three to four grams of water with
it, and the mass of food in the gut changes. This is among the best-established facts in the field (**strong**) and the first thing every
dieter experiences.

The engine does not model it, and the way the model is built makes the error systematic rather than random:

- The trend filter (MM-18) has a water state that is AR(1) with persistence 0.65: it *decays to zero in days*. A shift that arrives and
  stays cannot live in that state, so the filter moves it into tissue level and slope.
- The expenditure estimate (MM-23) values tissue change at roughly 7,000 to 8,500 kcal per kg.
- The simulator (MM-30) cannot expose it, because simulated users have no glycogen: their water is the same zero-mean AR(1) noise the
  filter assumes. This is a second instance of the weakness MM-30 already admits to (truth that obeys the engine's own model).

Size of the error, by arithmetic and before any blending: 1.5 kg read as tissue over a 14-day window is about 11,000 kcal, or roughly
750 kcal a day. The direction is the dangerous one in both cases:

| event | what happens | what the engine concludes |
|---|---|---|
| a deficit starts on day 1, which is every new fat-loss user's calibration window | 1 to 2 kg drop in a week | the deficit is far larger than planned, so expenditure is far higher than estimated; the first adaptive change *raises* calories, and the user's real loss slows or stops just as the early drop ends |
| a deficit ends (MM-130), or a diet break starts (MM-31) | 1 to 2 kg rise in a week | the user is in a surplus at maintenance, so expenditure is lower than estimated; calories are cut during the phase meant to be a rest |

The blend with the starting estimate and the weekly step limit reduce the damage to perhaps 100 to 200 kcal over the first weeks; they do
not remove a bias that points the same way for every user.

## Decisions
Choices I made without asking (say if any is wrong):
- **The simulator learns it first.** `SyntheticUser` gains a glycogen-and-gut compartment that moves toward a level set by recent energy
  and carbohydrate intake relative to expenditure, with a time constant of a few days and a total swing of about 2% of body weight
  between a sustained deficit and maintenance. Without this no fix can be tested.
- **The requirement is on the outcome, not the method**: after any change in target energy of more than 10% of expenditure, the expenditure
  estimate's bias attributable to the shift is under 100 kcal, and the stated uncertainty is honest about the period.
- **Candidate methods, to be compared on the simulator** (pick by results, record them here):
  1. *Exclude*: leave the first 10 days after a qualifying change out of the slope the estimator uses, and widen uncertainty accordingly.
     Simple; wastes data; makes the first measurement later.
  2. *Model the step*: add process noise to the water state for 10 days after a qualifying change and raise its persistence, so the
     filter is allowed to put a lasting shift there.
  3. *Model the store*: a glycogen state driven by logged carbohydrate and the energy gap, as MM-35 asks. Most faithful; most to get wrong.
- **Whatever the method, the user-facing behavior is fixed**: targets do not move on evidence from the first 10 days of a phase, and the
  Coach screen says the estimate is waiting for early water changes to settle (MM-139).

## Description
Extend the simulator, reproduce the bias, choose and implement a method, and add the tests.

## Acceptance Criteria
```gherkin
Scenario: The simulator has glycogen
  Given a simulated user who moves from maintenance to a 500 kcal deficit
  Then their true weight falls 1 to 2 kg more in the first ten days than fat and lean loss alone would give
  And it returns when they go back to maintenance

Scenario: The bias is reproduced before it is fixed
  Given the current estimator and forty such users starting a deficit on day 1
  Then this ticket records the average error of the first measurement

Scenario: Starting a deficit
  Given forty simulated accurate loggers who start a 500 kcal deficit on day 1
  Then the first measured expenditure is on average within 100 kcal of the truth
  And the first adaptive change does not raise calories for more than a quarter of them

Scenario: Ending a deficit
  Given forty simulated users who end a 12-week deficit and eat at true maintenance
  Then no check-in in the following four weeks lowers their target by more than 50 kcal in total

Scenario: Honest uncertainty
  Then across those users the truth is within two stated standard deviations at least 85% of the time, including the weeks after a change

Scenario: No regression
  Then every existing estimator and closed-loop test still passes
```

## Notes
- Priority: must-have before real users reach day 14. It is a defect in the product's central claim, in the first adaptive number every
  fat-loss user will see.
- This is an arithmetic prediction, not an observed failure: nobody has run a real or simulated user through it. The second scenario
  exists so that the size is measured, and if it turns out small, the ticket says so and closes.
- Low-carbohydrate eaters see a larger and longer shift at the start (often 2 to 3 kg) and a different steady state. The simulator should
  include a low-carbohydrate user.
- MM-115's exclusion of the first 10 days and MM-130's rebound wording depend on this.
