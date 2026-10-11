---
id: MM-194
status: done
component: training
related: [MM-77, MM-75, MM-76]
---

# Bug: Deleting a custom exercise hides preserved strength sessions

Strength histories iterated the current library, omitting workouts referencing
a deleted custom exercise. MM-75 preserves those sets. Keep the lift accessible
by its stable ID. Its name and resistance type are no longer available, so do
not invent either or calculate an estimate using a guessed resistance type.

## Acceptance Criteria
```gherkin
Scenario: Deleted custom exercise
  Given a finished workout references a custom exercise
  When that exercise is deleted from the library
  Then its history remains accessible under its stable ID
  And explains that exercise details are unavailable
  And no estimate is calculated from an assumed resistance type
  And the saved workout and sets remain unchanged
```

## Regression
Engine test "MM-194 deleted exercise retains logged sessions without guessing
resistance" fails before the fix. The matching mobile regression deletes a
custom exercise and opens its retained history.
