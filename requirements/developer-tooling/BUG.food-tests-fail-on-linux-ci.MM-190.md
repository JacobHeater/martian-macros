---
id: MM-190
status: done
component: developer-tooling
related: [MM-7, MM-169, MM-150, MM-187]
---

# Bug: Six Food-screen tests passed on Windows and failed in CI on Linux

## Context
After the Martian theme (MM-184) and the one calorie visual (MM-187), `main` was red in CI for six widget tests, while they passed on the
development machine. Each looks for a logged entry on the Food screen (an entry's calculated-amount line, its name, or "Estimated
totals"), or taps it to edit. The Food screen is a lazy list: what is below the calorie hero is not built until it is near the screen,
and on the CI machine's fonts the hero is taller, so the entry was never built and the test found nothing or tapped under the bottom bar.

The tests failing: four in `food_portion_test.dart` (including the MM-169 regression test), `app_test.dart` ("logging food updates the
day against its targets") and `estimate_meal_test.dart` ("a regular balanced meal is logged as an estimate").

Found by CI on main and on the open pull requests. It was not found earlier because screenshot and layout-sensitive tests run on Linux
only in CI.

## Decisions
- **The tests scroll to what they look for** (`revealOnFoodScreen`) instead of assuming where the list puts it. No assertion was changed.
- **A behavior bug is not what this is**: the app is right and the tests assumed a layout.

## Acceptance Criteria
```gherkin
Scenario: The same tests pass on a taller layout
  Given the Food screen's entries are below the first screen
  Then the tests that look for or tap a logged entry scroll to it first
```

## Notes
- Regression guard: the tests themselves, run in CI on Linux. They cannot be shown failing locally, because the failure needs the CI
  machine's layout; the fix was checked locally to still pass, and is confirmed only when CI on this pull request is green.
