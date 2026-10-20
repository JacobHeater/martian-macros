---
id: MM-63
status: done
component: persistence
related: [MM-59, MM-61, MM-62, MM-64, MM-65]
---

# Story: Back up my data, encrypted, and restore it on another phone

## Context
See MM-59. Without this, a lost or replaced phone means starting again.

## Decisions (made with the product owner)
- **Backup is a snapshot, not live sync.** Restoring replaces what is on the device. Using two devices at once is not supported.
- **Encrypted on the device before it leaves**, with a key derived from a passphrase only the user knows (Argon2id), using an
  authenticated cipher (XChaCha20-Poly1305).
- **A lost passphrase means the backup cannot be opened.** The app says so plainly when the passphrase is set.

Choices I made without asking (say if any is wrong):
- **The snapshot is a consistent copy of the database** (`VACUUM INTO`), so a backup taken mid-write is never torn.
- **The file has a small plain header**: format version, app version, schema version, creation date, and the key-derivation parameters.
  Nothing personal is in the header.
- **Saving to a file through the system share sheet is always available**, with no provider account.
- **Before a restore replaces anything, the app shows what the backup contains** (its date, days of data) and what will be lost, and asks.
- **The passphrase must be typed twice** when set and is never stored; the app may offer to keep the derived key in the platform keystore
  so routine backups do not ask each time.
- **Backup is free**, so nobody loses data for not paying (MM-85).

## Description
Settings gains Backup: set a passphrase, back up now (to a file or a provider, MM-64), see when the last backup was made, and restore from
a file or a provider.

## Acceptance Criteria
```gherkin
Scenario: Round trip to a new device
  Given a backup made on one device
  When it is restored on a fresh install with the right passphrase
  Then every setup field, weigh-in, food entry, mark and target is present

Scenario: Wrong passphrase
  When a restore is attempted with the wrong passphrase
  Then it fails with a clear message and the device's data is untouched

Scenario: A tampered file
  Given a backup file with one byte changed
  Then the restore refuses it

Scenario: Unreadable without the passphrase
  Then the backup file contains no readable name, number or date from the user's data

Scenario: An older backup
  Given a backup made by an earlier schema version
  Then it restores and is migrated

Scenario: Restore is confirmed
  Given the device has data
  When a restore is started
  Then the app says what will be replaced and waits for confirmation
```

## Notes
- Automatic scheduled backup is a natural follow-up; leave it out of the first version.
- Custom foods and recipes are user data and are included; downloaded food packs are not (they can be fetched again).

## Milestone
Moved from M3 into M2 on 2026-10-19 by the product owner: the closed beta's testers must be able to keep their data across phones.

## Decisions amended on building (2026-10-19)
- **Argon2id and XChaCha20-Poly1305 through libsodium** (`libsodium-wrappers-sumo` 0.8.4, bundled, nothing fetched), at the interactive limits: a phone derives the key in about a second. The header carries the parameters and salt, and is bound to the sealed part as additional data, so a changed header is refused too.
- **The passphrase is typed twice and never stored.** Keeping the derived key in the platform keystore for routine backups is not built in this first version; every backup asks.
- **The snapshot is `VACUUM INTO` on the phone** (`MmBackup.snapshot`), the in-memory database's bytes in a browser. **Restore copies every table's rows** from the backup copy into the live database in one write, after bringing the copy to the current schema (MM-61), so the live connection stays and every store re-reads; no file is swapped and no reopen is needed.
- **The file is handed to the system**: the share sheet on iOS (which says whether it was saved), the send chooser on Android (which only says it was handed on), the document picker on both for a restore. No provider in this version (MM-64).
- **What a restore replaces** is said in one confirmation: the backup's day, weigh-ins, days of food, workouts and saved foods with its span, and what this phone holds now.
- A wrong passphrase and a changed sealed part cannot be told apart by the cipher; the person is asked again, and a file whose database inside cannot be opened is refused when read. A changed header is refused at once.

## Progress
Built 2026-10-19: `src/backup/` (the file format, the cipher behind an interface, the platform behind an interface with wasm, native and fake implementations), `SqlDataRestorer` (describe and restore), schema version 10 (`last_backup_epoch_day`), the `MmBackup` plugin in Swift and Kotlin (snapshot, temp file, share, pick), Settings > Backup with the passphrase sheet and the restore confirmation, four stories. Tests: `test/backup/backupFile.test.ts` (round trip, wrong passphrase, changed byte, changed header, nothing readable outside the seal, a file that is no backup), `test/data/restore.test.ts` (round trip across two databases, what this phone holds), `test/settings/backup.test.tsx` (the flows), the schema tests at version 10. Both shells build. **Not verified:** a backup saved and restored on a phone (the share sheet and picker are untested on a device); an older backup migrated on restore is covered by the migration tests, not by a backup made at an older version. **Not built:** the keystore-kept key; scheduled backups (a non-goal of the first version).

## Decisions after the panel (2026-10-19, `docs/agent-runs/mm63-backup`)
- **Settings says the one fact a tester must know** (MM-65's decision, both reviewers' high finding): "Your records are not in your phone's own cloud backup: a new phone starts empty unless you restore a backup file."
- **Its own section, named Backup** (the designer's PD-2, rule 9): the folded header a tester scans for; Data's rows are about what the app stores and fetches, these about moving it. The icon is `document` (a file), not Data's `lock`; the duplicate "uploads nothing" sentence is gone from the caption.
- **The restore row is not drawn as danger** (PD-6): it is the beta's recovery act; the guard is the confirmation, where the counts make it specific, Cancel the stronger choice and focused (MM-280).
- **The confirmation is heard whole** (the UX guard's F1): `MmDialog` names its body as its description, for every confirm in the app. The words put the loss first, then what the backup holds, as two paragraphs, zero counts left out, dates with their year (F7, PD-8).
- **The passphrase**: at least 12 characters (the file can be attacked offline for as long as anyone holds it; a few words reach it; NIST SP 800-63B-4's 15 is for a single-factor login, and Argon2id carries the rest), with the helper "A few words you will remember are easiest." The warning stands before the first field in body type and names the act: "Keep it somewhere safe." (F5, PD-4). Shown on request (F3, NIST: offer to display the secret), `current-password` when opening so a password manager can offer it. The mismatch is said once the second is long enough to be wrong (F2). Enter continues when ready (F4). The sheet is labelled with its headline (F10).
- **While it works the row stays a button**, its subtitle "Backing up…" or "Opening the backup…", said by a status region too; a second press waits (F6, PD-3, as the health section's read does). A failed backup says a fixed sentence (F9, PD-5).
- **Open for the owner:** on Android the chooser only says the file was handed to another app; "Last backup" records the day all the same (PD-7). A fresh phone must be onboarded before Settings is reachable, so a restore entry at the welcome step is a flow question (Q1). The passphrase word joins the glossary.

## Closed 2026-10-20
The product owner settled the last open part (MM-64): the share sheet and the document picker are the only way a backup leaves or comes
back, with no provider connectors; the file stays `.mmbackup`; there is no export for reading the data outside the app. Still to be done on
a phone, as for every native path: a backup saved through the share sheet and restored through the picker on each platform.
