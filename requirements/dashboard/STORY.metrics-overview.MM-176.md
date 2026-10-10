---
id: MM-176
status: in-progress
component: dashboard
related: [MM-98, MM-149, MM-139, MM-116]
---

# Story: A metrics-heavy dashboard with useful history

## Decisions
The owner requests a full existing-data overview, replacing the sparse,
one-screen direction of MM-98. The Dashboard is intentionally scrollable.
Compact summaries and labeled charts show nutrition, body measurements,
logging coverage, coaching, and recovery without moral scores or invented data.
Food and Progress remain detail destinations. Sensitive-data policy, safety
notices, and pause semantics remain unchanged.

## Acceptance Criteria
```gherkin
Scenario: A populated overview
  Given stored intake, target, weight, waist and recovery history
  When the Dashboard opens
  Then today's calories and protein, carbohydrate and fat totals are visible
  And the Simple detail preference still limits today's macro display to protein
  And seven-day and thirty-day views show recorded intake against the target in force on each day
  And protein history, weight trend with uncertainty and waist history have dated, labeled charts
  And recovery shows five separate labeled trends over the last eight check-ins without a composite score
  And logging coverage and coach confidence with the expenditure range explain the available evidence
  And charts show dates, units and the meaning of their series

Scenario: Missing days are not zero intake
  Given days without food records between recorded days
  Then the intake chart leaves gaps rather than implying zero consumption
  And averages say how many recorded days they use
  And no-data states say what would populate each section

Scenario: Safety and pauses
  Given a pause or screening that prevents targets
  Then historical observations remain visible without grading paused days
  And unavailable targets and expenditure are not presented as measured zero values
  And no display rewards lower intake or weight loss

Scenario: Inspecting a metric
  When the user opens nutrition, measurements or coaching details
  Then the corresponding existing destination opens

Scenario: Loading and failures
  Given a history source is loading or has failed
  Then the Dashboard communicates that state instead of reporting empty history as success

Scenario: Readability
  Then both themes and narrow phone widths show readable chart labels without overflow
  And interactive controls have accessible names
```
