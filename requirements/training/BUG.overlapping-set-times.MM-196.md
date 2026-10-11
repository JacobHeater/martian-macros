---
id: MM-196
status: done
component: training
related: [MM-191]
---

# Bug: Typed set times can overlap another set in the workout

## Context
MM-191 requires non-overlapping sets, but the set editor only checks the
workout bounds and the order of the edited set's start and end.

## Description
Refuse typed times that overlap another logged set, across all exercise
entries in the same workout. Preserve the edited set and explain the refusal.
Touching boundaries are allowed. Missing times stay missing: a known timestamp
inside another set's complete interval is a conflict, but an incomplete set
does not imply an invented interval.

## Acceptance Criteria
```gherkin
Scenario: Overlap across exercises
  Given a timed squat set from 18:02 to 18:03
  And a pull-up set ending at 18:04
  When its start is entered as 18:02
  Then the change is refused with an overlap explanation
  And the pull-up set retains its previous times

Scenario: Adjacent sets
  Given a timed set from 18:02 to 18:03
  When another set is timed from 18:03 to 18:04
  Then the times are saved

Scenario: Missing evidence
  Given an untimed set and a set with only an end at 18:03
  When another set is timed from 18:04 to 18:05
  Then the times are saved without inventing missing times
```

## Notes
Regression: `MM-196 refuses overlapping typed times across exercises` in
`apps/mobile/test/workout_times_test.dart` must fail before the fix.
Engine cases cover same-exercise conflicts, containment, partial timestamps,
adjacency, self exclusion and existing bounds checks.
No schema or platform integration changes.
The widget regression failed before implementation because no overlap
explanation appeared. It passes after the fix, including unchanged persisted
sets, valid adjacency and subsequent self-excluding edits. Six engine cases
and all 37 combined workout-timing/Train widget tests pass. Final full Windows
`mm check` passes, including requirements, architecture, format, analysis and
workspace tests. No normal screen layout changes or golden updates are needed.
The refusal message was widget-tested, not separately emulator-inspected.
