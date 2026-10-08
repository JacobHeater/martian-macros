---
id: MM-34
status: proposed
component: adaptive-coach
related: [MM-22, MM-21, MM-26, MM-35, MM-68]
---

# Story: A body-fat range that comes from my own measurements

## Context
Body fat decides the goal recommendation, the loss-rate cap, the protein rule and the energy-availability floor. Today it is either the
user's one-time guess or a formula from height, weight, age and sex (Deurenberg) with an uncertainty of plus or minus ten points, shown as
"14-34% (rough estimate)". It never improves.

## Decisions (made with the product owner)
- **Body fat is shown as a range, updated slowly, never as a raw daily reading.** A smart-scale reading is mostly a measure of body water
  and can swing two to five points overnight.
- **Each scale gets its own bias**, learned over time, so switching scales is not read as a change in the body.
- **Without a smart scale, the fallback is a tape**: weekly waist, and the Navy method.

## Description
The engine combines, each weighted by how reliable it is: smart-scale body-fat readings (very noisy, with a per-device offset), tape
measurements (waist, and neck and hip for the Navy formula, which is sex-specific), and the weight trend. It produces a body-fat estimate
with an uncertainty that narrows as measurements accumulate. Nothing is shown as a number until the range is narrow enough to mean
something; before that the screen says what would help.

## Acceptance Criteria
```gherkin
Scenario: Before enough data
  Given a week of smart-scale readings
  Then the app shows the rough formula range, not a number from the scale

Scenario: A settled range
  Given eight weeks of readings from one scale and weekly tape measurements
  Then the app shows a range a few points wide, updated weekly

Scenario: A new scale
  Given a settled range
  When readings begin arriving from a different scale that reads 4 points higher
  Then the shown range does not jump

Scenario: One overnight spike
  Given a reading 3 points above the previous day's
  Then the shown range does not move
```

## Notes
- The model is the subject of MM-35.
- A consumer scale's reading can be biased by several points for a given person, in a fixed direction. Filtering removes scatter, not bias,
  so the settled range is only as true as the tape and trend can pin it. Say so in the product.
