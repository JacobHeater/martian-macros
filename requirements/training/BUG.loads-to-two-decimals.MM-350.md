---
id: MM-350
status: done
component: training
related: [MM-75, MM-79, MM-230, MM-321]
---

# Bug: a load converted to pounds read "182.98 lb"

## Context
Found drawing the Train and Progress stories for MM-321. Loads are stored in kilograms; shown in pounds,
an 83 kg set read "5 × 182.98 lb", because a load was said to two decimals. The product owner decided
(2026-10-16) that a load is said to a tenth, as most body-weight scales say a weight.

## Description
A load, wherever the app says or prefills one (a set, a progression suggestion, the load step, the set
editor's load field), is rounded half away from zero to a tenth, with no trailing zero. The format parity
test with the Flutter app (MM-230) states this as a knowing departure.

## Acceptance Criteria
```gherkin
Scenario: A load converted to pounds
  Given a set of 5 reps at 83 kg
  And the units are imperial
  Then the set reads "5 × 183 lb"

Scenario Outline: A load
  Given a load of <value> in the shown unit
  Then it reads <shown>

  Examples:
    | value  | shown |
    | 182.98 | 183   |
    | 102.25 | 102.3 |
    | 102.5  | 102.5 |
    | 225    | 225   |
```

## Notes
Guarded by `apps/mobile/test/format/loadsToATenth.test.ts`, which failed before the fix.
