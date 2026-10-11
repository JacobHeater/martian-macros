---
id: MM-195
status: done
component: training
related: [MM-78, MM-75]
---

# Bug: Weekly volume navigation disappears during a workout

The volume action was inside Train's start-workout branch, so it disappeared
as soon as a workout was in progress. Place it outside that branch, keeping
Continue and Repeat controls together and accessible.

## Acceptance Criteria
```gherkin
Scenario: Volume during training
  Given a workout is in progress
  Then Train offers Continue and Weekly training volume
  When Weekly training volume is opened
  Then the unfinished workout is excluded from volume
```

## Regression
`weekly_volume_test.dart`: "MM-195 volume accessible during workout" fails
before the fix and passes afterward.
