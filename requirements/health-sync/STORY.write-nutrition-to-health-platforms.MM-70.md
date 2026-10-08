---
id: MM-70
status: proposed
component: health-sync
related: [MM-66, MM-67, MM-38, MM-48]
---

# Story: Write what I eat to my phone's health app

## Context
See MM-66. Users who keep their health data in one place expect a food logger to contribute to it.

## Decisions
Choices I made without asking (say if any is wrong):
- **Off by default**, enabled per platform in Settings.
- **Written per entry**: energy, protein, carbohydrate and fat, plus fiber, sugars, saturated fat and sodium when the entry has them, with
  the meal and the time it was logged.
- **Edits and deletions are mirrored**: changing or removing an entry in the app updates or removes what was written.
- **Only this app's own records are ever changed or deleted.**
- **Body weight typed in the app is also written**, as weight, so the user's other apps see it.

## Description
When enabled, each logged food is written to Health Connect or Apple Health, and kept in step with later edits.

## Acceptance Criteria
```gherkin
Scenario: A logged food appears
  Given writing is enabled
  When a 510 kcal entry is logged
  Then the phone's health app shows 510 kcal of dietary energy from Martian Macros at that time

Scenario: An edit is mirrored
  When that entry is changed to 450 kcal
  Then the health app shows 450, not 960

Scenario: A deletion is mirrored
  When the entry is deleted
  Then it is gone from the health app

Scenario: Turning it off
  When writing is disabled
  Then nothing further is written, and the app asks whether to remove what it wrote before
```

## Notes
- Depends on editing entries existing (MM-48) to be worth testing fully.
- Never read back the app's own written nutrition as input.
