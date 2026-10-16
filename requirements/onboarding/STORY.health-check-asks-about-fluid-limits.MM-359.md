---
id: MM-359
status: proposed
component: onboarding
related: [MM-358, MM-83, MM-313]
---

# Story: the health check asks whether a clinician limits what the person drinks

## Context
The panel's safety specialist, reviewing the default water goal (MM-358, 2026-10-16): heart failure, dialysis,
liver disease and low blood sodium can each come with a fluid limit set by a care team (AHA/ACC/HFSA 2022; HFA
2024; NIDDK), and the health check asks about none of them. A default goal for such a person could be unsafe.
The product owner chose to add one plain question.

## Description
The health check, at onboarding and in Settings, asks "A clinician has told me to limit how much I drink". Ticked,
no water goal is suggested (MM-358): the goal is off unless the person sets one, and Settings says their care team
sets it. The answer is kept with the other answers and counts as a health-check change like them.

## Acceptance Criteria
```gherkin
Scenario: Asked at onboarding
  When the health check step is shown
  Then it lists "A clinician has told me to limit how much I drink"

Scenario: A fluid limit
  Given the person ticks it
  Then no water goal is suggested
  And Settings says their care team sets how much they drink

Scenario: Kept
  Given the person ticked it and the app is closed and opened again
  Then it is still ticked in Settings
```

## Notes
A new column on the setup's storage, migrated as "no" for everyone already set up.
