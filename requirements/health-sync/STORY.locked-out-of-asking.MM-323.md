---
id: MM-323
status: proposed
component: health-sync
related: [MM-68, MM-320]
---

# Story: after Health Connect stops asking, say where to allow a kind

## Context
The panel's UX guard on MM-320 (UX-4): Health Connect stops showing an app's request once a permission is
refused more than twice ("your app gets locked out… permission requests will no longer appear", the
Health Connect codelab, read 2026-10-14). The refusal snack then says "You can allow it here", which sends
the person round in a circle.

## Description
When a request comes back unchanged without the platform's dialog having been shown, the app says to allow
it in Health Connect, and, where the platform allows it, offers to open Health Connect's permissions for
the app. Needs the answer to: can the MmHealth plugin tell a refusal from a request never shown, and open
Health Connect's permission screen? (react-capacitor.)

## Acceptance Criteria
```gherkin
Scenario: Locked out
  Given Health Connect no longer shows the app's request for weight
  When the Weight row is pressed
  Then the app says to allow it in Health Connect, and offers to open it
```
