---
id: MM-65
status: proposed
component: persistence
related: [MM-59, MM-63, MM-64, MM-95]
---

# Spike: What Apple's rules allow for health data and backup

## Context
App Store Review Guideline 5.1.3(ii) says apps "may not store personal health information in iCloud". Planning took that to rule out
iCloud Drive and CloudKit as backup providers. Two things were left unsettled:
- whether the rule applies when the data is encrypted on the device with a key Apple never has;
- whether the app's database may be included in the phone's ordinary iCloud device backup, or must be excluded from it.

Excluding it protects against a rejection and means a user who relies on iCloud device backup silently loses their data when they replace
their phone.

## Description
Establish, from the current guideline text, Apple's documentation, and how comparable shipping apps behave:
1. Is a client-side-encrypted file in iCloud Drive "storing personal health information in iCloud" for the purpose of the guideline?
2. Is the database's inclusion in iCloud device backup within the rule? What do apps that hold health data outside HealthKit do?
3. Does Google Play have an equivalent restriction for Android's device backup?
4. What must the privacy disclosures say in each case (MM-95)?

## Acceptance Criteria
```gherkin
Scenario: A recommendation on device backup
  Then this ticket states whether the database is included in or excluded from OS device backup on each platform, and why

Scenario: A recommendation on iCloud as a provider
  Then it states whether an encrypted iCloud Drive backup is offered, and why

Scenario: Sources
  Then each conclusion cites the text it rests on, with the date it was read
```

## Notes
- Guidelines change. Record the date of the reading and re-check before submission (MM-94).
