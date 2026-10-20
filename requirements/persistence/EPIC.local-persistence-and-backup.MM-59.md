---
id: MM-59
status: in-progress
component: persistence
related: [MM-60, MM-61, MM-62, MM-63, MM-64, MM-65, MM-5, MM-95]
---

# Epic: Local persistence and backup

## Context
Decisions made with the product owner:
- **The app is offline-only.** There is no account and no server. The database on the phone is the system of record.
- **Backup to the user's own cloud storage is optional.** The file goes through the system share sheet to wherever the person chooses;
  the app connects to no storage service (decided 2026-10-20, MM-64).

That makes privacy a feature ("your health data never leaves your phone unless you export it") and removes server cost, which is what
allows a one-time price (MM-84). It also means that a lost phone is lost data unless the user backed up, so backup is not optional to
build, only optional to use.

## Narrative
Everything the user enters is stored in one SQLite database through one typed interface (MM-60). The schema will change, and users' data
must survive that (MM-61). The user can erase everything (MM-62).

Backup is a snapshot the user starts, encrypted on the device with a passphrase before it goes anywhere (MM-63), and handed to the system
share sheet, which places it with whatever storage the person uses (MM-64). One provider is excluded by Apple's rules, and how Apple's own device backup is treated needs settling
(MM-65).

## Acceptance Criteria (narrative)
The Epic is done when a user's data survives app updates; when they can move to a new phone by making an encrypted backup on the old one
and restoring it on the new; when nobody who obtains the backup file can read it without the passphrase; and when they can wipe the app
clean.
