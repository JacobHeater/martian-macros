---
id: MM-414
status: done
component: sleep
related: [MM-250, MM-279]
---

# Bug: a minutes error marks the hours field

## Context
Found by the panel's product-designer (PD-6) and UX-accessibility (F3)
reviews of MM-250's Sleep section on 2026-10-20 (`docs/agent-runs/mm250-sleep`).
`MmDurationField` took one `error` string and passed it to its hours field
only, so "Minutes from 0 to 59." was drawn under the hours box, with the hours
box marked invalid and the minutes box unmarked, pointing the person at the
wrong field (MM-279: what is wrong with a value is said beside it).

## Description
The field whose value is wrong is the one that carries the message, the
danger border and `aria-invalid`; the other is unmarked.

## Acceptance Criteria
```gherkin
Scenario: Minutes mistyped
  Given 6 hours and 75 minutes typed for a night
  Then "Minutes from 0 to 59." is said under the minutes field, which is marked invalid
  And the hours field is not marked

Scenario: Hours mistyped
  Given 25 hours typed
  Then "Up to 24 hours." is said under the hours field, which is marked invalid
  And the minutes field is not marked
```

## UI/UX
- Minutes mistyped — apps/mobile/src/gallery/screens/Progress.stories.tsx (Story: SleepMinutesMistyped); the same state in the fields catalog, apps/mobile/src/gallery/Fields.stories.tsx.

## Notes
Fixed 2026-10-20 (feat/m2): `MmDurationField.error` is `{ on: 'hours' | 'minutes'; text }` and goes to the field named; `parseDurationFields` decides which. Guarded by `test/progress/sleepEntry.test.tsx` ("any night of the last fourteen can be typed, and a mistyped value is refused in place": the `aria-invalid` assertions) and `test/format/durationFields.test.ts`.
