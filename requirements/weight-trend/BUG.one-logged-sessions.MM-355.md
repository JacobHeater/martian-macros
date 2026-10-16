---
id: MM-355
status: done
component: weight-trend
related: [MM-344, MM-77]
---

# Bug: one session read "1 logged sessions"

## Context
Found drawing the lift list for MM-344 (story "Lift Histories Deleted Exercise", 2026-10-16): a lift logged in
one finished workout read "1 logged sessions · 1 qualifying" under "Every logged lift".

## Description
The count of a lift's sessions agrees with its number: "1 logged session", "15 logged sessions".

## Acceptance Criteria
```gherkin
Scenario: A lift logged once
  Given one finished workout with a set of the barbell bench press
  When "All lift histories" is opened
  Then its row reads "1 logged session · 1 qualifying"
```

## Notes
Guarded by "MM-355" in `apps/mobile/test/progress/strengthProgress.test.tsx`, which failed before the fix.
