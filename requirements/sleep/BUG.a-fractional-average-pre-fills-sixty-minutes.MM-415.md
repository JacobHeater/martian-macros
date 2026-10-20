---
id: MM-415
status: done
component: sleep
related: [MM-252, MM-250]
---

# Bug: a fractional average pre-fills sixty minutes

## Context
Found by the panel's UX-accessibility review (F5) of MM-252's check-in
pre-fill on 2026-10-20 (`docs/agent-runs/mm250-sleep`). The fourteen-night
average is a mean and so a fraction of a minute; the check-in truncated the
hours and rounded the remainder separately, so 419.58 minutes filled the
fields with "6" and "60" while every other line said "7 h". The saved value
was right (6 + 60/60); the display was not, and it was a value the app itself
refuses.

## Description
Minutes are rounded to the minute before they are split into hours and
minutes, wherever they are shown as fields.

## Acceptance Criteria
```gherkin
Scenario: A fraction rounds up to the hour
  Given an average of 419.58 minutes
  When the check-in opens
  Then the fields show 7 hours and 0 minutes

Scenario: A fraction rounds down
  Given an average of 419.4 minutes
  Then the fields show 6 hours and 59 minutes
```

## Notes
Fixed 2026-10-20 (feat/m2): one helper, `durationFieldsOf` (format), used by the check-in and the Progress card in place of two copies. Guarded by `test/format/durationFields.test.ts`.
