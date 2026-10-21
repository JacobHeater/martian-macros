---
id: MM-95
status: in-progress
component: release
related: [MM-94, MM-56, MM-58, MM-59, MM-63, MM-64, MM-65, MM-68, MM-69, MM-242, MM-244, MM-247, MM-453, MM-454]
---

# Task: The privacy policy and the stores' data declarations

## Context
The app's privacy position is unusually simple and is a selling point: no account, no server, and health data that stays on the phone
unless the user exports an encrypted backup to storage they chose. Both stores still require a privacy policy and a declaration of data
practices, and health permissions bring extra forms.

## Description
- **A privacy policy**, in plain language, hosted at a public address, stating exactly what leaves the device and when:
  - no request the person did not start;
  - the list of food packs and a pack download from GitHub (MM-56), each only on a tap, which reveal an IP address and the technical
    details of any download;
  - a barcode number or search words to Open Food Facts and, where offered, USDA FoodData Central, only if the user opted in (MM-58);
  - on Android, whatever Google says its ML Kit reader sends about itself (MM-244: not yet observed, so worded to be true either way);
  - an encrypted backup file, only when the user makes one and hands it through the system share sheet to an app of their choosing
    (MM-64; the app itself connects to no storage service);
  - the purchase, handled by the store (none in this version).
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

Scenario: A new address in the code
  Given a network address written in the app's code or its build config
  Then the policy names that service on both phones, or the policy test fails

Scenario: Never more than is true
  Then the policy never says nothing leaves the phone, and claims nothing is safe, secure or guaranteed
  And on Android it names Google's ML Kit and repeats what Google says it sends, and on an iPhone it does not

Scenario: Read from Settings
  When the person opens Settings, About, "Privacy policy", beside "Terms of use"
  Then the version, the date it took effect, a short account and every section in full are shown, for the phone the app is on
  And nothing there asks anything of the person

Scenario: The draft
  Given no licensed attorney has reviewed the policy
  Then the developer's legal name and the contact address are visible blanks
  And the public page (MM-247) says above everything that it is a draft not in effect
```

## Notes
- The United States has no single health-privacy law covering an app like this, but the FTC's Health Breach Notification Rule and several
  state laws (Washington's My Health My Data Act among them) can apply to health apps. Keeping the data on the device avoids most of it;
  have the conclusion checked.

## Decision (2026-10-13)
- **Draft it now, with the terms, for the same attorney.** Written from what the code does (MM-242, MM-65): nothing sent by default, one pack download, the scanner's own reporting pending MM-244. It gets a row in Settings, About, and the public page MM-247 publishes carries it beside the terms. The contact address stays empty for the attorney.

## UI/UX
- Privacy policy — apps/mobile/src/gallery/screens/Settings.stories.tsx (Stories: PrivacyPolicy, PrivacyPolicyOnIphone,
  SettingsOpensPrivacyPolicy). The policy as read from About, on Android and on an iPhone, and the row that opens it.

## Draft store declarations (for the owner and the attorney; not yet entered in either console)
Worded so they hold whatever MM-244 finds; the ML Kit rows are the ones it may change.
- **Google Play, Data safety.** Data collected: none by the developer. Data shared: none. The ML Kit SDK's own collection (device or other
  IDs, app info and performance: crash logs, diagnostics) is declared as Google states it in its ML Kit data disclosure, unless MM-244
  shows nothing is sent, in which case "No data collected". Encrypted in transit: the pack download and the online lookups use HTTPS.
  Deletion: "Erase all data" on the phone; no account, so no deletion request path is needed. Privacy policy URL: the MM-247 page.
- **Apple, App Privacy ("nutrition label").** "Data Not Collected": nothing is sent to the developer, the online lookups carry no
  identifier of the person, and iOS reads barcodes and labels with its own frameworks (no ML Kit on iOS). Apple's own opt-in analytics
  and crash reports are Apple's, not the app's.
- **Google Play, Health Connect declaration (MM-68)**, read only, each kind asked for one by one in Settings: weight, body fat, lean
  body mass and height (the targets and the trend), exercise (workouts as sessions), menstruation (female profiles only: weight changes across the
  cycle), steps (activity context only), sleep (the nightly record, MM-250). No write permission; nothing read is sent to the
  developer or any third party; it can leave the phone only inside an encrypted backup the person makes (MM-63).
- **Apple, HealthKit purpose string (MM-69).** Today's `NSHealthShareUsageDescription` ends "nothing read leaves this device", which
  an exported backup contradicts (MM-453). Proposed: "To read the kinds of health data you allow, such as weigh-ins from your scale,
  so you need not type them. The app only reads, and sends what it reads to no one." No `NSHealthUpdateUsageDescription` (nothing is
  written).

## For the attorney (with MM-242)
- The two blanks: the developer's legal name and a contact address.
- Whether the FTC Health Breach Notification Rule or state consumer health data laws (Washington's My Health My Data Act among them)
  ask for anything more of an app that receives no records, and whether the policy needs a state-rights section.
- Whether "we do not sell information about you or share it for advertising" is enough for the state privacy laws' wording.
- Whether one public page for both documents (MM-247) is enough for both stores' privacy policy field.

## Progress
**Draft written (2026-10-21).** `apps/mobile/src/terms/privacyPolicy.ts` (thirteen sections and a short account, per phone),
`PrivacyPolicyScreen` opened from Settings, About beside "Terms of use", the shared `LegalSections`, and the public page's renderer
`legalPageHtml.ts` (MM-247). Tests: `apps/mobile/test/terms/privacyText.test.ts` (every address the code and the build config
contact is named on both phones; nothing absolute; the blanks), `apps/mobile/test/terms/legalPage.test.ts`,
`apps/mobile/test/settings/privacyPolicy.test.tsx`. Not run locally; CI validates. Found while writing it: the terms and the HealthKit
purpose string predate the backup (MM-453). **Still open:** the attorney's review and blanks; the "checked by observation" scenario,
which is MM-244 and needs a device; the store declarations entered in both consoles (drafted above); the link to the public page in
the app (MM-454). `in-progress` until then.
