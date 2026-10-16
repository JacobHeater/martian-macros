---
id: MM-348
status: proposed
component: weight-trend
related: [MM-321, MM-77, MM-108]
---

# Bug: a lift of a deleted exercise is titled with its internal id

## Context
Found drawing the Progress screen's undrawn states for MM-321 (story "Lift History Deleted Exercise"). When
an exercise of the person's own is deleted after sets were logged, its history is titled "Deleted exercise
(custom-deleted-row)": the internal id, which means nothing to a person (MM-108's voice rules). The id is
there to tell two deleted exercises apart in the lift list, and the test of that list relies on it.

## Description
A lift of a deleted exercise is named in words a person can use, and two of them can still be told apart
(for instance by when they were last logged), decided with the design.

## Acceptance Criteria
```gherkin
Scenario: A deleted exercise's history
  Given sets logged against an exercise of the person's own that was then deleted
  Then its history and its row in the lift list name it without its internal id
  And two such lifts can be told apart
```

## Notes
Guarded by `apps/mobile/test/engine/deletedExerciseName.test.ts`, skipped with this ID until the fix lands;
the fix also changes the lift-list test in `strengthProgress.test.tsx`, which finds the row by its id. A
design and wording fix: drawn in Storybook, reviewed by the panel, then built.
