---
id: MM-514
status: proposed
component: health-sync
related: [MM-70, MM-314, MM-489]
---

# Story: Turning writing off offers to remove what the app wrote

## Context
MM-70's last scenario: when writing is turned off, nothing further is written, and the app asks whether to remove what it
wrote before. The write path built on 2026-10-21 stops writing and leaves what was written, and the terms say so.

## Decisions
Choices I made without asking (say if any is wrong):
- **Asked once, when the switch is turned off**, with "Keep" first and "Remove" second; keeping is the default.
- **Only the app's own records of that kind** are removed: Health Connect lets an app delete only what it wrote, and
  HealthKit the same; the removal is by the app's source, not by a time range.

## Description
Turning off "Send food you log to …", "Send water you log to …" or "Send workouts you finish to …" asks whether to remove what the
app wrote of that kind. Removing deletes only the app's own records of that kind from the platform; keeping leaves them.

## Acceptance Criteria
```gherkin
Scenario: Kept
  Given food was written to the health app
  When writing food is turned off and "Keep" is chosen
  Then what was written stays, and nothing more is written

Scenario: Removed
  When writing food is turned off and "Remove" is chosen
  Then the app's food records are gone from the health app, and another app's are not touched
```

## Notes
- The terms (MM-242, section 9) say what was written stays when writing is turned off; they change with this ticket.
