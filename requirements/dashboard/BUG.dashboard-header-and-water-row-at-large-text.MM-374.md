---
id: MM-374
status: proposed
component: dashboard
related: [MM-91, MM-313, MM-361]
---

# Bug: At 200% text the Dashboard's title runs into "Add food", and the water row breaks apart

## Context
Found at the design review of coaching insights (`docs/agent-runs/mm361-coaching-insights/`, the product designer's
second pass), in `Designs/Coaching insights › DashboardLargeText`, the first Dashboard story at 200% text. The coaching
insights did not cause either problem. The app bar sets the title on one line beside its "Add food" action
(`.mm-app-bar-title`), and at 200% the two overlap. The water row's figure and its "Add a glass" action
(`WaterRow`, MM-313) no longer fit side by side, and the row's parts break onto separate lines.

## Description
At 200% text on a 412 px phone, the Dashboard's title and its action do not overlap, and the water row reads as one
row: its amount, its goal and its action, all readable.

## Acceptance Criteria
```gherkin
Scenario: The title
  Given the phone's text at 200% on a 412 px screen
  When the Dashboard is shown
  Then the title and "Add food" do not overlap

Scenario: The water row
  Given the phone's text at 200%
  Then the water row's amount, goal and "Add a glass" are each readable and the row is not split apart
```

## Notes
- Regression test: `apps/mobile/test/app/largeTextLayout.test.ts`, skipped with this ticket's ID until the fix lands.
  Until then the guard is the `DashboardLargeText` story.
- Belongs with MM-91.
