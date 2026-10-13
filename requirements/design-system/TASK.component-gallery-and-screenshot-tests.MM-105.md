---
id: MM-105
status: done
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

## Progress (screenshot tests built and verified)
- `apps/mobile/test/goldens/screen_goldens_test.dart`: the dashboard, Food, Progress, Coach, the "why targets changed" sheet, Settings and the first onboarding step, each in light and dark (14 images in `test/goldens/images/`), with fixed data and a fixed clock. The real Inter, Space Grotesk and Material icon fonts are loaded (`load_golden_fonts.dart`) and shadows are drawn, since a widget test otherwise draws text as blocks and flattens shadows.
- They run on Linux only (text renders differently on each operating system) and are skipped elsewhere with a reason. CI runs them as part of `mm check`; a changed image fails the pull request, and the failing images are uploaded as an artifact.
- `mm goldens` runs them; `mm goldens --update` regenerates the images on Linux. On Windows and macOS it says so and points to the **Update goldens** workflow (Actions tab, or push a branch named `update-goldens/<anything>`), which regenerates the images on Linux and uploads them as an artifact to commit.
- The first baselines found a real defect (the Settings "Profile" group heading was centered), fixed in this change.
- Determinism: the baselines were produced by the Update goldens workflow and are compared, in a separate CI run, by `mm check`; that comparison passing is the check that the same images come out twice.
- **Not done**: the component gallery is not part of the screenshot set (the dev-only screen is covered by the gallery tests); screens beyond the seven above (the add-food sheet, charts at 90 days, onboarding steps after the first, error and empty states); text at 200%; a container so Windows and macOS developers can generate the images locally.
