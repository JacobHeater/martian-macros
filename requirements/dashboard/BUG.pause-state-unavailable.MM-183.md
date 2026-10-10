---
id: MM-183
status: in-progress
component: dashboard
related: [MM-176, MM-179, MM-148]
---

# Bug: Do not present ordinary targets before pause state is known

## Defect
Dashboard and Food could treat loading or failed pause history as no pause,
presenting ordinary deficit targets for a paused day. Final implementation
review found this fail-open display path.

## Acceptance Criteria
```gherkin
Scenario: Pause history loading
  Given pause history has not loaded
  Then Dashboard and Food show a loading state rather than ordinary targets

Scenario: Pause history failed
  Given pause history could not be read
  Then Dashboard and Food show an explicit failure state
  And ordinary targets are not displayed as though no pause exists
```

## Regression
`pause_state_display_test.dart` covers loading and failure on both screens.
All four cases failed before the display gates and pass with the fix.
The integrated `mm check` passed with exit 0 and "All checks passed."
