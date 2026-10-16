---
id: MM-351
status: proposed
component: food-logging
related: [MM-337, MM-43]
---

# Bug: what a barcode lookup found is not announced

## Context
Found by the panel's UX guard reviewing MM-337 (2026-10-16). After "Look up", the scan sheet shows a
notice ("This product is not in the food database on this phone…") and new actions, but `Notice` has no
live role, so a person using a screen reader who pressed Look up hears nothing.

## Description
The outcome of a lookup is announced when it appears, politely, without moving focus away from what the
person was doing.

## Acceptance Criteria
```gherkin
Scenario: An unknown code looked up
  Given a screen reader is on
  When an unknown barcode is looked up
  Then the notice saying it is not in the database is announced
```

## Notes
Not yet guarded. A design fix through Storybook and the panel, like MM-337; check what `ReadFailedNotice`
(MM-334) does with `role="alert"` before choosing a polite region here.
