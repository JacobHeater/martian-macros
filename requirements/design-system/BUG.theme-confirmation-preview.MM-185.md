---
id: MM-185
status: done
component: design-system
related: [MM-184]
---

# Bug: Theme confirmation resets the preview before storage publishes it

## Defect
The initial MM-184 confirmation cleared the live preview as soon as a write
completed. Repository streams can publish the saved preference later. During
that gap the first-launch chooser returned to Martian and lost the user's
visible selection, even though a different choice was being confirmed.

## Acceptance Criteria
```gherkin
Scenario: Delayed preference stream after confirmation
  Given a new installation previewing Light
  When Continue saves Light before the preference stream publishes Light
  Then the chooser stays in Light with Light selected
  When the stream publishes Light
  Then onboarding opens in Light without a Martian flash
```

## Regression test
`apps/mobile/test/martian_theme_startup_test.dart`:
`MM-185: preview stays selected until storage emits the saved choice`.
It deliberately delays the provider stream after a successful repository write.

The regression failed with the initial implementation (Martian was displayed
instead of Light). Preview state is now cleared only when the stored
preference stream publishes a confirmed choice.
