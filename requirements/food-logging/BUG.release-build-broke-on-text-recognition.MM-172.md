---
id: MM-172
status: done
component: food-logging
related: [MM-44, MM-43]
---

# Bug: The Android release build failed after the label reader was added

## Context
MM-44 added `google_mlkit_text_recognition` to read nutrition labels on the device. The plugin's Android code refers to optional
recognisers for Chinese, Devanagari, Japanese and Korean, which the app does not ship. A debug build compiles. A release build runs the
code shrinker (R8), which stops on the missing classes: "Missing class com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions".

Found by CI on the pull request: the "Build Android (dev)" step failed. It had been checked locally with a debug build only, which is why
it was not caught before pushing. It was fixed with no ticket.

## Decisions
- **R8 is told to ignore the four optional recognisers** (`-dontwarn`), since only the Latin one is used.
- **A release build, not a debug build, is the check for a new native plugin.**

## Description
`apps/mobile/android/app/proguard-rules.pro` holds the four rules and the release build type names it.

## Acceptance Criteria
```gherkin
Scenario: A release build
  When the Android release bundle is built
  Then the build succeeds
```

## Notes
- Regression guard: the CI step "Build Android (dev)" in `.github/workflows/ci.yml` builds the release bundle on every pull request; it is
  what failed, and it passes with the rules in place. There is no unit test for this and there cannot usefully be one.
- Not verified: the iOS build with this plugin, and the recogniser running on a real device.
