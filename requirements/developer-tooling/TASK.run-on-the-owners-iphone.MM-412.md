---
id: MM-412
status: done
component: developer-tooling
related: [MM-403, MM-8, MM-178, MM-235]
---

# Task: Run the app on the iPhone plugged into the Mac

## Context
`mm run --ios` built, installed and launched on a simulator (MM-403); a
phone build was Xcode's, by hand, with the signing team chosen there
(docs/ios-signing.md). The owner asked (2026-10-19) for one command that
puts the app on their iPhone when it is plugged in, as `mm run` does for an
Android phone (MM-178).

## Decisions (made with the product owner)
- **`mm run --ios --phone [name | id]`** builds the web app, syncs the shell,
  builds it signed for the device, installs it and opens it, through
  `xcodebuild` and `xcrun devicectl`. With no name, the one connected iPhone
  is taken; `MM_IPHONE` names a default.
- **The real app unless `--env` says otherwise.** The owner's phone gets the
  prod identity (MM-8); `--env dev|demo` installs a twin beside it.
- **The team never enters the repository.** `MM_APPLE_TEAM` in the shell is
  passed as `DEVELOPMENT_TEAM`; without it, the project's own uncommitted
  line decides. Xcode may fetch or make the profile
  (`-allowProvisioningUpdates`).
- `mm build ios --phone` is the signed build alone, for a check without a
  phone attached.

## Description
With the iPhone plugged in and unlocked, `mm run --ios --phone` ends with
the app open on it. The first time, iOS refuses to open the app until the
developer is trusted (Settings, General, VPN & Device Management); the
command says so when the launch is refused after a successful install.

## Acceptance Criteria
```gherkin
Scenario: One phone connected
  Given one iPhone is paired and connected
  When mm run --ios --phone runs
  Then that phone is chosen, the real app is built signed, installed and opened

Scenario: The phone is away
  Given the iPhone is paired but not connected
  When mm run --ios --phone runs
  Then the command says it is paired but not connected, and to plug it in

Scenario: The team stays local
  Given MM_APPLE_TEAM is set
  Then xcodebuild is given it as DEVELOPMENT_TEAM, and nothing in the repository changes
```

## Regression test
`tool/test/phones.test.ts`: iPhones parsed from devicectl's list with the
connected one first; the choice with and without a name; the signed build's
arguments with and without a team in the environment.

## Progress
Built 2026-10-19. Verified: the unit tests; `mm build ios --phone` on the
owner's Mac (the signed device build; result recorded in the handoff). Not
verified: an install and launch, the phone not being connected in the
session; the owner runs `mm run --ios --phone` with it plugged in.
