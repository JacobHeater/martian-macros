---
id: MM-8
status: proposed
component: developer-tooling
related: [MM-1, MM-2]
---

# Task: Separate dev and prod app ids

## Context
`--env dev|prod` only changes compile-time defines. Both builds have the same app id, so a development build replaces the real app (and
its data) on a phone. That is fine on an emulator and unacceptable on the developer's own phone once they use the app for real.

## Description
Two native flavors, `dev` and `prod`, used **only** to give the builds different app ids and display names (`.dev` suffix and
"Martian Macros Dev"), so both install side by side. Everything else stays in `config/<env>.json`. `mm run` and `mm build` pass the
flavor that matches `--env`.

## Acceptance Criteria
```gherkin
Scenario: Both installed
  Given the prod app is installed with logged data
  When the dev build is installed on the same device
  Then both apps are present and the prod app's data is untouched

Scenario: The flavor follows the environment
  When "mm run --env prod" is run
  Then the prod flavor is built with config/prod.json
```

## Notes
- Android flavors can be set up on Windows. iOS schemes need Xcode, so that half waits for the Mac.
- Health platform permissions and the in-app purchase product (MM-87) are tied to the app id; check both when this lands.
