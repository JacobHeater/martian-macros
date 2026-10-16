---
id: MM-332
status: done
component: coach-insights
related: [MM-33, MM-321]
---

# Bug: the monthly report said "only 0 whole days were logged"

## Context
Found drawing the Dashboard's undrawn states for MM-321 (story "Report Ready", opening the first report).
With no whole days logged, the report's coach section said "only 0 whole days were logged"; with one, it
said "1 whole days".

## Description
The sentence says "no whole days were logged" at none, "only 1 whole day was logged" at one, and "only N
whole days were logged" otherwise.

## Acceptance Criteria
```gherkin
Scenario Outline: Too few whole days for the coach
  Given a month with <days> whole days logged
  Then the coach section says "Not measured this month: <words>, and the coach needs at least …"

  Examples:
    | days | words                          |
    | 0    | no whole days were logged      |
    | 1    | only 1 whole day was logged    |
    | 6    | only 6 whole days were logged  |
```

## Notes
Guarded by `apps/mobile/test/format/reportTooFewDays.test.ts`, which failed before the fix
(`wholeDaysLogged`).
