---
id: MM-7
status: in-progress
component: developer-tooling
related: [MM-1, MM-2, MM-4, MM-6]
---

# Task: Continuous integration that runs the same commands

## Context
`mm check` is the gate, but only when someone remembers to run it. Nothing checks a pull request, and nothing builds for iOS.

## Description
A GitHub Actions workflow that, on every pull request and on pushes to `main`:
- installs the Flutter version named in `.fvmrc`;
- runs `mm bootstrap` and `mm check` on Linux (the fastest runner);
- builds the Android app (`mm build android --env dev`) on Linux;
- builds the iOS app without signing on a macOS runner, once the project builds for iOS.

CI calls `mm`, never `flutter` directly, so local and CI behavior cannot drift.

## Acceptance Criteria
```gherkin
Scenario: A pull request that breaks a test
  When it is opened
  Then the check fails and names the failing test

Scenario: A pull request with a dangling requirement reference
  When it is opened
  Then the check fails with the tracker's message

Scenario: The pinned version is the one used
  Given .fvmrc names a Flutter version
  Then the workflow installs exactly that version
```

## Notes
- Open question: whether generated Drift code is committed (as now) or regenerated in CI with a "no diff" check. Committed is simpler;
  the no-diff check catches a forgotten `mm gen`.

## Progress
- `.github/workflows/ci.yml`: on pull requests and pushes to `main` it reads the Flutter version from `.fvmrc`, installs exactly that, then runs `./mm bootstrap`, `./mm check` and
  `./mm build android --env dev` on Linux. It calls `mm`, never `flutter`.
- **Not verified**: the workflow has never run (nothing is pushed); the action versions and the Android build step are unproven. **Not done**: the iOS build on macOS (the project does not build for iOS yet).
  Status stays in-progress until a pull request has gone green.
