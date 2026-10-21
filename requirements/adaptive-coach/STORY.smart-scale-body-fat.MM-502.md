---
id: MM-502
status: proposed
component: adaptive-coach
related: [MM-34, MM-35, MM-501]
---

# Story: My smart scale's body-fat readings narrow the range, with each scale's own bias

## Context
Split from MM-34, which built the range from the formula and the waist. Smart-scale body-fat readings are not stored yet
(`BodyFatObservation` exists as a type only), so this waits on a health-platform ingest of body fat and its storage.

## Decisions (made with the product owner, in MM-34)
- **Body fat is shown as a range, updated slowly, never as a raw daily reading.** A smart-scale reading is mostly a measure of body water
  and can swing two to five points overnight.
- **Each scale gets its own bias**, learned over time, so switching scales is not read as a change in the body.

## Description
Stored smart-scale readings join `estimateBodyFat`, each weighted by how reliable it is, with a per-device offset learned against the tape
and the formula. The range narrows as readings accumulate. The product says that filtering removes scatter, not a scale's fixed bias.

## Acceptance Criteria
```gherkin
Scenario: Before enough data
  Given a week of smart-scale readings
  Then the app shows the range without them, not a number from the scale

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
- Needs a schema change for stored readings; the model may come from MM-35.
