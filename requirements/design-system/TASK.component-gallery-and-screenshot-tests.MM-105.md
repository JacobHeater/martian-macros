---
id: MM-105
status: in-progress
component: design-system
related: [MM-101, MM-102, MM-104, MM-91, MM-93]
---

# Task: A gallery to see components, and screenshot tests to keep them

## Context
See MM-101. There is no way to look at a component without navigating to a screen that happens to use it, in a state that happens to occur.
Nobody has seen the dark theme at all. And nothing would notice if a change to the theme quietly altered every screen.

## Decisions
Choices I made without asking (say if any is wrong):
- **A gallery screen inside the development build**, reached from Settings when the environment is `dev`: every token (color swatches,
  type roles, spacing) and every component in every state, with a switch for light and dark and for text size.
- **Screenshot (golden) tests** for each component in each state and both themes, and for whole screens (dashboard, Food, Progress, Coach,
  onboarding steps) with fixed data.
- **Goldens are generated on one platform only** (Linux, in CI), because text renders differently on each operating system. Developers on
  Windows and macOS run them through the same container, or rely on CI.
- **A changed golden is reviewed as part of the pull request**: the images are in the diff.
- **`mm goldens`** runs them, and `mm goldens --update` regenerates them.

## Description
The gallery and the golden tests, built on the component package (MM-104).

## Acceptance Criteria
```gherkin
Scenario: Seeing a component
  Given a development build
  When the gallery is opened
  Then every component is shown in every state, and can be switched between light and dark

Scenario: An unintended change is caught
  Given a pull request that changes a spacing token
  Then the screenshot tests fail and the changed images are visible in review

Scenario: Not in production
  Given a production build
  Then the gallery is not reachable

Scenario: The same result everywhere
  Then running the screenshot tests twice on the CI platform gives identical images
```

## Notes
- Widgetbook is the common ready-made gallery for Flutter. A hand-written gallery screen is less to depend on for a library this small;
  decide when building.
- This is also the practical way to do the dark-theme and small-screen check (MM-91).

## Progress
- Built: the gallery (`apps/mobile/lib/src/gallery/`, one file per section): every color token, the type roles, every `ui/` component in its states, with switches for light and dark and for 100% or
  200% text. It is reachable from Settings in the `dev` environment only (`appEnvProvider`). Tests (`gallery_test.dart`) open it in both themes, switch theme and text size without errors, and check that
  production hides it.
- **Not done**: screenshot (golden) tests and `mm goldens`. They must be generated on one platform (Linux, in CI) and there is no CI yet (MM-7), so no baseline images exist. Until then a
  change to a token is caught by the contrast tests and by looking at the gallery, not by an image diff.
