---
id: MM-721
status: in-progress
component: health-sync
related: [MM-67, MM-498, MM-699, MM-698]
---

# Bug: a health import writes one row per statement, twenty minutes on a phone

## Context
The owner (2026-11-02): the Android app is not up to the iPhone's, and Health Connect may not be fully working. Read off the
Pixel over USB the same day (logcat with Capacitor's verbose bridge log, the app's database pulled with its journal): the
iPhone's records had moved in (MM-698) with the iPhone's import tokens, Apple Health anchors that Health Connect does not
honor. Every kind was therefore read again from the start, as MM-498 says it should be, and the store wrote each sample with
its own `INSERT ... ON CONFLICT` across the native bridge: 87,378 steps samples, 17,017 sleep samples and 3,557 weigh-ins
(the owner's Health Synchronizer mirrors the Apple Watch into Health Connect), at about 80 rows a second, for some twenty
minutes after the app opened. A kind's token is saved only once its samples are written, so an app swiped away in that time
starts the kind over at the next open.

Once the tokens were Health Connect's, a relaunch read every kind incrementally in five seconds, and Settings › Health
Connect showed every kind allowed with its readings (the screen read on the phone). The import is right; it is slow in the
way MM-699 found a restore to be.

## Description
`SqlHealthSampleStore` writes samples in multi-row statements, each within 999 parameters (SQLite's limit before 3.32; the
app supports Android 8, whose SQLite has it): 142 samples a statement. `upsert` and `replace` both take that path. A sample
written again in a batch replaces the stored one, as before.

## Acceptance Criteria
```gherkin
Scenario: Thousands of samples in tens of statements
  Given 5000 samples to upsert
  When the store writes them
  Then all 5000 are present
  And fewer than 100 statements ran, none with more than 999 parameters

Scenario: A sample written again replaces the one there
  Given 300 samples stored
  When a batch holds two of them with new values and one new sample
  Then the two have the new values, the new one is added, and the rest are unchanged

Scenario: A replace after an expired token is batched too
  Given a kind with samples stored
  When the kind is replaced with 5000 samples
  Then all 5000 are present, in fewer than 100 statements
```

## Notes
- Guarded by `test/data/healthImportInBatches.test.ts`, which failed with 5000 statements before the change.
- Not run locally; CI validates.
- Owed on the owner's Pixel: the next move from the iPhone, and the first read of Health Connect after it, finishing in
  seconds; the app not swiped away mid-import.
- Also read on the Pixel the same day, not a defect of the app: "My QR Code" showed "This phone is not on Wi-Fi" because the
  phone had no Wi-Fi address. Android's own log showed its saved network refusing it (authentication and DHCP failures,
  the network then disabled by the phone's network selection), with the phone on 5G. The move needs the Pixel on the Wi-Fi.
