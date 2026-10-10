---
id: MM-175
status: in-progress
component: developer-tooling
related: [MM-174]
---

# Task: Run on a connected Android phone with one command

## Description
`mm run --env phone` is a device-selection shortcut, not a new configuration.
It uses the dev defines and selects a physical Android device without starting
or choosing an emulator.

## Acceptance Criteria
```gherkin
Scenario: A phone and an emulator are connected
  Given Flutter reports one physical Android phone and an Android emulator
  When I run mm run --env phone
  Then the app runs on the phone using the dev configuration
  And no emulator is started

Scenario: No phone is connected
  Given Flutter reports no physical Android device
  When I run mm run --env phone
  Then the command fails with guidance to connect and authorize a phone
  And no emulator is started

Scenario: More than one phone is connected
  Given Flutter reports multiple physical Android devices
  When I run mm run --env phone
  Then the command fails and lists their device IDs
  And explains how to select one with mm run --env dev -d

Scenario: Discovery fails
  Given Flutter device discovery fails or returns malformed device data
  When I run mm run --env phone
  Then the command reports the discovery error and does not launch the app

Scenario: Existing environments are unchanged
  Then mm run still supports dev and prod
  And mm build does not accept phone as a configuration
```

## Progress
- Implemented the shortcut with explicit discovery/selection errors and dev defines.
- Seven focused device-selection tests pass; all 47 tooling tests and full
  `mm check` pass.
- Verified on connected hardware using `mm run --env phone --help`: the phone
  was selected instead of the running emulator and the command exited with 0.
  App installation and launch were not performed by this verification.
