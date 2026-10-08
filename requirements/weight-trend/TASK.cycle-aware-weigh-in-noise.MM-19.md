---
id: MM-19
status: done
component: weight-trend
related: [MM-15, MM-18, MM-20, MM-68]
---

# Task: Wider weigh-in noise around menstruation

## Context
Water retention before and during menstruation commonly adds one to two kilograms that then leave. It is predictable from the cycle, so the
filter should expect it rather than discover it each month.

## Decisions (made with the product owner)
- **Ingest menstrual data** and use it to set the noise on weight (and later on body-fat readings).

Choices I made without asking (say if any is wrong):
- **The window is five days before the start of flow through two days after**, and readings in it get 1.6 times the water noise. These
  numbers are a starting point, not fitted.
- **A start is a day with flow whose previous day had none.**
- **With no cycle data the multiplier is 1**, so nothing changes for anyone else.

## Description
`cycleNoiseMultiplier(flowDays)` returns a function from a date to a multiplier. `analyze` passes it to the trend filter when flow days are
supplied. Extra noise on a day is treated as extra reading noise, so that day's reading pulls the trend less.

## Acceptance Criteria
```gherkin
Scenario: The window
  Given flow starting on the 10th
  Then the multiplier is 1.6 from the 5th through the 12th, and 1 on the 4th and the 13th

Scenario: No data
  Given no flow days
  Then the multiplier is 1 on every day

Scenario: A widened day pulls less
  Given a flat series with one high reading on its last day
  Then the trend ends lower when that day is widened than when it is not
```

## Notes (built and verified)
- `packages/engine/lib/src/cycle_noise.dart`; `MenstruationDay` in `mm_domain`; tests in `formulas_test.dart` and `weight_trend_test.dart`.
- **The engine side only.** Nothing supplies flow days yet: the app has no way to log them (MM-20) and no health import (MM-68), so
  `analyze` is always called with none.
