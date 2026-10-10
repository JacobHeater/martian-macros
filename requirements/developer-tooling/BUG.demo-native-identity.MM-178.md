---
id: MM-178
status: done
component: developer-tooling
related: [MM-177]
---

# Bug: Android demo identity script fails to compile

## Problem
The initial MM-177 Gradle script referenced `java.util.Base64` inline.
Gradle's `java` extension shadows that package qualifier, so the release
build failed before selecting the isolated identity.

## Acceptance Criteria
```gherkin
Scenario: Native identity can compile
  Given the Android demo identity build flag
  When a release Android build is run
  Then the Gradle script compiles using an explicit Base64 import
  And the demo package is distinct from the normal package
```

## Progress
Fixed with an explicit import. Regression guard:
`tool/test/demo_native_identity_test.dart` checks the native/Dart identity
flag mapping and rejects the shadowed inline package qualifier. The release
build also exercises the actual Kotlin script.
