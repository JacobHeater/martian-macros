---
id: MM-65
status: done
component: persistence
related: [MM-59, MM-63, MM-64, MM-95, MM-229]
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

## Findings (read 2026-10-13)

Nobody involved is a lawyer; this is what the pages say, quoted, and what follows for this app. Re-read before submission (MM-94).

### The texts

- **Apple, App Store Review Guideline 5.1.3(ii)** (https://developer.apple.com/app-store/review/guidelines/, read 2026-10-13):
  "Apps must not write false or inaccurate data into HealthKit or any other medical research or health management apps, and may not
  store personal health information in iCloud." The guideline has no exception for encryption, keys, or who can read the data; it
  speaks of storing, not of reading. 5.1.3(i) adds: "You must disclose the specific health data that you are collecting from the
  device."
- **Apple, "Optimizing your app's data for iCloud backup"** (https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup,
  read 2026-10-13): iCloud Backup excludes only `tmp` and `Library/Caches` by default; everything else an app writes is in the
  device backup unless marked. "If your app creates nonpurgeable data that isn't appropriate for backup, you can indicate which files
  and directories the system can exclude by setting their `isExcludedFromBackup` resource value to `true`." And: "The
  `isExcludedFromBackup` resource value exists only to provide guidance to the system about which files and directories it can
  exclude; it's not a mechanism to guarantee those items never appear in a backup or on a restored device." Also: "certain file
  operations can reset resource values, make sure you set an excluded file's resource values each time you save it."
- **Google, Android Auto Backup** (https://developer.android.com/identity/data/autobackup, read 2026-10-13): by default it includes
  shared preferences, internal files, "Files in the directory returned by `getDatabasePath(String)`" and external files; "Every app can
  allocate up to 25 MB of backup data per app user" and over that "the system ... doesn't back up data to the cloud"; "The backup is
  end-to-end encrypted on devices running Android 9 or higher using the device's PIN, pattern, or password"; it is stored "in a private
  folder in the user's Google Drive account". An app opts out with `android:allowBackup="false"`, which the page recommends "if your
  app deals with sensitive information", noting that on Android 12 and later and some manufacturers' devices that "disables cloud-based
  backup and restore ... but doesn't disable device-to-device transfers for the app".
- **Google Play, Health Connect and health permissions** (https://support.google.com/googleplay/android-developer/answer/9888170 and
  the health permissions guidance at answer/12991134, read 2026-10-13): no rule about device backup. Data may be transferred to third
  parties only "with explicit user consent"; developers must disclose "How the data is used, stored, and potentially shared"; the
  guidance requires "at minimum, data encryption both at rest and in transit"; and "tracking nutrition and lifestyle habits" is a
  named approved use under "Fitness, wellness and coaching". Play's own Health apps policy page (answer/13996367) was not read; it is
  the one to check at submission.

### Answers

1. **An encrypted file in iCloud Drive.** Not offered. The guideline forbids storing personal health information in iCloud and says
   nothing about encryption; an app that argues the exception at review is betting a release on a reading the text does not give. A
   backup is a file the person makes and puts where they choose (the share sheet, a file picker, a provider they connect, MM-64); if
   they choose their own iCloud Drive folder, that is their act in the Files app, not the app storing there, and the app never names
   iCloud as a destination. The same for Google Drive, for symmetry, though Play has no equivalent rule.
2. **The iCloud device backup.** Excluded. The guideline is about what the app stores in iCloud, and the device backup is the
   system's, so inclusion is arguably outside it; but Apple's own words make exclusion "guidance" rather than a guarantee, and a
   reviewer reading 5.1.3(ii) plainly would see health data in iCloud either way. The database and the downloaded food packs are
   marked `isExcludedFromBackup` on every save, in a directory of their own under `Library` named for the bundle identifier, as the page
   advises. The cost is the one the ticket names: a person who replaces their phone and relies on the device backup loses their records
   unless they made a backup file; so the app says so in Settings, beside the backup action (MM-63), and reminds them when a new phone
   is detected is not built and not promised. What comparable apps do was not established from any source this session; it is not
   relied on.
3. **Android.** Already excluded: the shell sets `android:allowBackup="false"` (MM-229), and this keeps it. Play has no rule that
   requires it; the reasons are the same posture on both platforms (one rule, one sentence in the policy), the 25 MB cap that the
   database with the food log passes anyway, and that a device-to-device transfer, which the flag does not stop on Android 12 and
   later, is the person moving their own phone, which is fine. The downloaded packs are in the app's files directory and would be in
   a backup if it were on; they are not personal, but they are large.
4. **The disclosures (MM-95).** The policy and the stores' forms say: records stay on the phone; they are not in the phone's cloud
   backup on either platform; a backup is a file the person makes, encrypted with a passphrase they choose (MM-63), and goes where
   they put it; the app never sends health data anywhere. Apple's "nutrition label" lists Health & Fitness data as collected and not
   linked to identity and not used for tracking; Play's Data safety form says the same and names the encryption at rest that the
   Health Connect guidance asks for, which is not built: the database is plain SQLite in app-private storage, and MM-63's encrypted
   backup is the only encryption. That gap is MM-63's and MM-95's, named here.

### What this decides for MM-63 and MM-64

- One backup shape: an encrypted file, made on demand, placed by the person. No provider named iCloud or Google Drive in the app.
- The database and packs excluded from OS backups on both platforms, with the sentence in Settings that says so.
- Not decided: encryption at rest for the database itself (SQLCipher or the platform keystore), which Play's guidance asks for and
  which MM-63 or a ticket of its own must settle before the Data safety form is filled in.
