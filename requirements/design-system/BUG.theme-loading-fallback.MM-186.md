---
id: MM-186
status: done
component: design-system
related: [MM-184, MM-165]
---

# Bug: Preference loading incorrectly previews Martian for existing users

## Defect
The MM-184 app initially treated an unknown/loading preference as a fresh
installation. An existing installation could briefly see a Martian loading
screen before its saved Dark or System preference arrived.

Loading must keep the existing System fallback. Only a confirmed fresh-install
`unselected` value activates Martian and the first-launch chooser.

## Acceptance Criteria
```gherkin
Scenario: Existing preference loads slowly
  Given an existing Dark or System preference has not emitted yet
  Then startup uses the System fallback rather than Martian
  And no first-launch chooser is displayed
  When the saved preference arrives
  Then it is applied without changing the saved setting
```

## Regression tests
`apps/mobile/test/martian_theme_startup_test.dart`:
`MM-186: loading an existing dark preference does not preview Martian` and
the equivalent System case verify the theme before and after emission.
Both failed before the fix with `ThemeMode.light` instead of System.
