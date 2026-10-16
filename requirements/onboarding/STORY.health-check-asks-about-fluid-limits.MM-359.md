---
id: MM-359
status: done
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
The health check, at onboarding and in Settings, asks "A clinician has told me to limit my fluids". Ticked,
no water goal is suggested (MM-358): the goal is off unless the person sets one, and Settings says their care team
sets it. The answer is kept with the other answers and counts as a health-check change like them.

## Acceptance Criteria
```gherkin
Scenario: Asked at onboarding
  When the health check step is shown
  Then it lists "A clinician has told me to limit my fluids"

Scenario: A fluid limit
  Given the person ticks it
  Then no water goal is suggested
  And Settings says their care team sets how much they drink

Scenario: Kept
  Given the person ticked it and the app is closed and opened again
  Then it is still ticked in Settings
```

## Notes
Guarded by the MM-359 tests in `apps/mobile/test/settings/waterGoalDefault.test.tsx` and `apps/mobile/test/domain/suggestedWaterGoal.test.ts`, and by the schema and upgrade tests (version 6 adds `fluid_limited_by_clinician`, "no" for everyone set up). Drawn in Storybook and reviewed by the panel (2026-10-16): the product designer, the UX guard and the safety specialist; their changes were built. The health-check question reads "limit my fluids", since "limit how much I drink" reads as alcohol (UX-1). Where a care team sets fluids, the amount field says it is only for an amount of water they gave, and that it counts plain water only, never a limit to fill (safety S-1). The suggestion's note is read with the field (UX-2). "Use the suggested amount" says what it returns to and moves focus to the field (UX-3, PD-1). With an eating-disorder history the "more than most people need" note comes at 3.5 L (S-4). Not built, for a later ticket: a "drink to thirst" caption in the Water section itself (S-3).

A new column on the setup's storage, migrated as "no" for everyone already set up.
