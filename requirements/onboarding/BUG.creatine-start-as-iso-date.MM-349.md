---
id: MM-349
status: done
component: onboarding
related: [MM-136, MM-321]
---

# Bug: onboarding wrote the creatine start day as "2026-10-12"

## Context
Found drawing onboarding's undrawn states for MM-321 (story "Training With Body Fat And Creatine"). With
"I currently take creatine" switched on, the row "When did you start?" showed the day in its stored form,
"2026-10-12", where the app writes dates in words everywhere else.

## Description
The day is written as the app writes a date: "October 12, 2026".

## Acceptance Criteria
```gherkin
Scenario: Creatine started on October 12
  Given creatine switched on in the training step, started on October 12, 2026
  Then "When did you start?" reads "October 12, 2026"
```

## Notes
Guarded by `apps/mobile/test/app/creatineStartDate.test.tsx`, which failed before the fix.
