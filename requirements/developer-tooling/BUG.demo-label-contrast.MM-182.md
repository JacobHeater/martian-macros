---
id: MM-182
status: done
component: developer-tooling
related: [MM-177]
---

# Bug: Demo identification has no painted themed background

## Problem
The DEMO strip sits above the app's Material surfaces. In light theme its
dark text can render against the black host background, making the synthetic
data identification nearly invisible.

## Acceptance Criteria
```gherkin
Scenario: Demo identity remains legible in either theme
  Given the demo app uses either the light or dark theme
  When the identification strip is rendered outside a Scaffold
  Then its entire width and top safe area have a painted themed background
  And its explicit themed foreground contrasts against that background by at least 4.5 to 1
  And the synthetic data label remains visible above the app content
```

## Progress
Regression: `apps/mobile/test/demo_notice_test.dart` checks the actual strip
background, foreground and measured contrast in both themes using the same
MaterialApp builder placement as the app.

Both theme regressions failed before the fix because no strip background was
painted. The fixed component paints the full-width canvas role, including the
top safe area, and explicitly uses the paired text role. All three focused
demo notice tests pass. The identity and seed configuration are unchanged.
Editor diagnostics report no errors in the component or test. No emulator
relaunch or screenshot comparison was performed for this focused fix.
