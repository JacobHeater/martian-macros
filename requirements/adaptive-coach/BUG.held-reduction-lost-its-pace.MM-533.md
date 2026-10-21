---
id: MM-533
status: done
component: adaptive-coach
related: [MM-138, MM-128, MM-495, MM-480]
---

# Bug: A held reduction lost the pace its targets were asked for

## Context
Found while building MM-480. Holding a reduction (MM-138, `holdReduction`) builds a new targets record without
`requestedLossFraction` (MM-128). The engine compares the record's pace with the setup's, so for anyone on a pace other
than the default, the held record read as a pace change and the targets were issued again at once, undoing the hold.
MM-495 was the same omission in `TargetsRecord.copyWith`.

## Description
A held reduction keeps the pace its targets were asked for: the fat-loss pace (MM-128) and the lean-gain pace (MM-480).

## Acceptance Criteria
```gherkin
Scenario: Holding a reduction keeps the pace
  Given targets asked for at 0.5% a week, the latest an ordinary reduction
  When the user keeps last week's targets
  Then the held record still says 0.5% a week, and no pace change follows
```

## Notes
- Fixed in `apps/mobile/src/engine/holdReduction.ts`. Regression test: "holding keeps the pace the targets were asked
  for" in `apps/mobile/test/engine/holdReduction.test.ts`. Not run locally; CI validates.
