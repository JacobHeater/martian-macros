---
id: MM-95
status: proposed
component: release
related: [MM-94, MM-56, MM-58, MM-59, MM-64, MM-65, MM-68, MM-69]
---

# Task: The privacy policy and the stores' data declarations

## Context
The app's privacy position is unusually simple and is a selling point: no account, no server, and health data that stays on the phone
unless the user exports an encrypted backup to storage they chose. Both stores still require a privacy policy and a declaration of data
practices, and health permissions bring extra forms.

## Description
- **A privacy policy**, in plain language, hosted at a public address, stating exactly what leaves the device and when:
  - nothing, by default;
  - a food pack download request to static hosting (MM-56), which reveals an IP address and nothing else;
  - a barcode number to Open Food Facts, only if the user opted in (MM-58);
  - an encrypted backup to a storage provider the user connected (MM-64);
  - the purchase, handled by the store.
- **Apple's privacy "nutrition label"** and **Google Play's Data safety form**, filled in to match.
- **Google Play's Health Connect declaration**: each permission and why it is needed (MM-68).
- **Apple's HealthKit purpose strings** (MM-69).
- No analytics or crash-reporting library is added without updating all of the above first.

## Acceptance Criteria
```gherkin
Scenario: The policy matches the app
  Then every network request the app can make is listed in the policy, and the policy lists none the app does not make

Scenario: Checked by observation
  Given a release build used for a full day with a network monitor attached
  Then the only requests seen are those the policy describes

Scenario: A new library
  Given a pull request that adds a dependency which contacts the network
  Then it is not merged until this ticket's documents are updated
```

## Notes
- The United States has no single health-privacy law covering an app like this, but the FTC's Health Breach Notification Rule and several
  state laws (Washington's My Health My Data Act among them) can apply to health apps. Keeping the data on the device avoids most of it;
  have the conclusion checked.
