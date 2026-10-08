---
id: MM-63
status: proposed
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
