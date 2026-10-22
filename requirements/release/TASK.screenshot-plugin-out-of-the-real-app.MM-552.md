---
id: MM-552
status: proposed
component: release
related: [MM-536, MM-94, MM-8, MM-557]
---

# Task: Take the screenshot plugin out of the real app before release

## Context
MM-536 kept `mm screenshot --phone`'s native plugin out of the real app (`com.martianmacros`). On 2026-10-22 the owner,
the only user for now, had it allowed in every identity so screenshots come from the app they actually use. A released
app should carry no developer hook: the plugin answers only a request file a Mac puts in the app's container, but it is
code that a store build does not need.

## Description
Before any release (MM-94), `MmScreenshotPlugin.isAllowed` refuses the prod bundle id again, `MainViewController`
registers it only behind that check, and `mm screenshot --phone` refuses `--env prod` and defaults to the dev twin. The
live run's Info.plist keys (MM-557: `NSLocalNetworkUsageDescription`, `NSAllowsLocalNetworking`) leave the release build
too, and `mm run --ios --phone --live` refuses the prod identity.

## Acceptance Criteria
```gherkin
Scenario: A release build takes no screenshots
  Given the app built as com.martianmacros
  When mm screenshot --phone --env prod runs
  Then it refuses before anything is sent, and the plugin is not registered in that build

Scenario: A release build asks for no local network
  Given the app built as com.martianmacros for release
  Then its Info.plist has no NSLocalNetworkUsageDescription and no NSAllowsLocalNetworking
```

## Notes
- Parked in M5 with the other release gates (owner, 2026-10-21: nothing release-only is built until a release is decided).
