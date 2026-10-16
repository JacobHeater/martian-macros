---
id: MM-353
status: done
component: dashboard
related: [MM-335, MM-339]
---

# Bug: the recovery note sat outside its section, folded or not

## Context
Found by the panel's product designer reviewing MM-335 (2026-10-16). Under "How you are holding up" in the
Dashboard's history, a line "Recovery observations: Aug 24–Oct 12. Each line is a separate answer, not a
combined score." was drawn outside the section, so it explained the section's answers while the section was
folded, and repeated what the section's own caption says.

## Description
Nothing of the recovery section is drawn outside it; what its answers are is said inside it, as it already is.

## Acceptance Criteria
```gherkin
Scenario: The history with recovery answers
  Given recovery check-ins in the last weeks
  When "More about this week" is opened
  Then no line about the recovery answers sits outside the "How you are holding up" section
```

## Notes
Guarded by "MM-353: nothing of the recovery section is drawn outside it" in
`apps/mobile/test/dashboard/dashboardMetrics.test.tsx`, which failed before the fix. The line was removed with
MM-335's rebuild of the history.
