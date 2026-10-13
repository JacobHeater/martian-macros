---
id: MM-7
status: done
component: developer-tooling
related: [MM-1, MM-2, MM-4, MM-6, MM-232]
---

# Task: Continuous integration that runs the same commands

## Context
`mm check` is the gate, but only when someone remembers to run it. Nothing checks a pull request, and nothing builds for iOS.

## Description
A GitHub Actions workflow that, on every pull request and on pushes to `main`:
- sets up the pinned Node and Java;
- runs `mm bootstrap` and `mm check` on Linux (the fastest runner);
- assembles the Android shell (`mm build android`) on Linux;
- builds the iOS app without signing on a macOS runner, once the project builds for iOS.

CI calls `mm`, never npm, gradle or the platform tools directly, so local and CI behavior cannot drift.

## Acceptance Criteria
```gherkin
Scenario: A pull request that breaks a test
  When it is opened
  Then the check fails and names the failing test

Scenario: A pull request with a dangling requirement reference
  When it is opened
  Then the check fails with the tracker's message

Scenario: The pinned version is the one used
  Given the workflow names a Node major and a Java version
  Then the runner uses exactly those
```

## Notes
- Written for the Flutter toolchain (`.fvmrc`, Drift's generated code); rewritten for Node at the switch (MM-232), when the pinned version became Node 22 and the Android build a Capacitor debug assembly.

## Progress
- `.github/workflows/ci.yml`: on pull requests and pushes to `main` it sets up Node 22 and Temurin 21, then runs `./mm bootstrap`, `./mm check` and `./mm build android`. It calls `mm`, never a toolchain directly.
- **Verified (2026-10-13):** the workflow has run green on every pull request since the switch (PRs #120 to #139), including one whose local `mm check` could not finish under machine load and was gated by CI alone (#137). A failing test and a dangling requirement reference both fail `./mm check`, which fails the job.
- **Not done:** the iOS build on macOS; the shell has no iOS project yet. That is a later ticket when iOS exists, not this one.
