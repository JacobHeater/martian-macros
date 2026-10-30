# WS-12: Backup and portability

**Order** 12 · **Group** C · **State** in progress (steps 1 to 3 built, the epic MM-59 done with MM-404, 2026-10-21; step 4, MM-695, added 2026-10-29) · **Risk** medium

## Summary
A user-initiated, encrypted snapshot of the user's data that they can restore,
on storage they chose through the system share sheet.

## Why this is a workstream, and why it is this late
The app is offline-only, with no account and no server. That is its privacy
position and a selling point. It also means a lost phone is lost data unless
the user can make a backup. Backup is part of the free tier the product
promises.

It shares a requirements folder with schema migrations and has the opposite
place in the order. Migrations are first because everything needs them.
Backup is late on purpose:

- **Restore must accept a backup made at an older schema version** and
  migrate it. Every schema version that exists before backup ships is one the
  restore path never has to have written, but must still be able to read.
  Building backup after the bulk of schema change means fewer formats in the
  wild.
- **Nothing depends on it** except release.

## Capability it unlocks
A user can move to a new phone, or recover from a lost one, without the app
ever holding their data on a server.

## Included
- A spike on what each platform allows for health data in device and cloud
  backup.
- Encrypted backup to a file and restore from it.
- The share sheet as the only way out and the document picker the only way
  back (MM-64, decided 2026-10-20).
- Moving to another phone (MM-695, 2026-10-29): the same sealed snapshot
  sent directly to the person's other phone on the same Wi-Fi, paired by a
  QR code that carries a one-time key, and applied through the restore.

## Excluded or deferred
- iCloud as a provider: the founding decision is no, because of the App Store
  guideline on storing health data there. The spike confirms the current
  reading of the rule.
- Automatic or scheduled backup: the design is user-initiated.
- Sync between devices: not a goal. This is a snapshot, not replication.
  Moving to another phone (MM-695) replaces the receiving phone's data; it
  never merges.
- Progress photos in a backup: off by default, specified in the photos ticket
  in WS-07.
- The food pack: never included. It is downloadable and large.
- Connectors to storage services (Google Drive, Dropbox, OneDrive, WebDAV,
  S3): dropped by the owner on 2026-10-20. The share sheet reaches all of
  them through the apps the person has installed.
- Export for reading outside the app or for other logging apps: not a goal.

## Prerequisites
- **WS-01 (MM-61)** from step 2. Absolute: restore runs migrations on the
  restored file.

Step 1 is research and can start at any time.

## Enables
WS-13: backup is part of what the listing promises, and its platform rules
feed the privacy declarations.

## Packages and surfaces
- `apps/mobile/src/data` (snapshot with `VACUUM INTO`, encryption, restore)
- `apps/mobile` settings: a backup screen

## Risks
- **Cryptography is easy to get subtly wrong.** The design names the
  primitives (Argon2id for the key, XChaCha20-Poly1305 for the data). Use a
  maintained library, a versioned file header, and test vectors. A forgotten
  passphrase means an unrecoverable backup; say so plainly in the screen.
- **Restore replaces everything.** It is the most destructive action in the
  app after erase. Confirm it, validate the file fully before touching the
  live database, and keep the old database until the new one opens.
- **Provider sprawl** (five OAuth registrations, SDKs and review surfaces,
  each a destination the privacy policy must list) is gone: the owner chose
  the share sheet alone on 2026-10-20.

## Sequence
1. **Platform backup rules spike (MM-65).** M3. It also decides whether the
   app's database must be excluded from the operating system's own device
   backup.
2. **Encrypted backup and restore to a file (MM-63).** M3. Include restoring
   a backup made at an earlier schema version in the tests from the start.
3. **Where the file goes (MM-64).** M2. The share sheet and the document
   picker only; no provider connectors.
4. **Move to another phone (MM-695).** M3. The snapshot sent over the same
   Wi-Fi to a phone that shows a QR code, with no passphrase; Bluetooth,
   hotspots and merging are out of scope.

## Done enough to unblock others
MM-63 is done: a backup written at one schema version restores correctly at a
later one.

## Do not start before this
The release step of WS-13.

## Parallel with
Everything in group C. It touches the schema lane only to read the version.

## Requirement sources
- Built: MM-65 (the backup-rules spike, answered 2026-10-13: no iCloud or
  Drive as a provider; the database excluded from OS backups on both
  platforms; one encrypted file the person places).
- Built: MM-63 (2026-10-19), MM-64 (closed 2026-10-20 by the owner's
  decision: the share sheet only). Epic: MM-59, done 2026-10-21 with MM-404.
- Remaining: MM-695 (move to another phone, 2026-10-29).

## Notes for whoever builds it
- The backup file records the schema version it was written at and the app
  version, in a cleartext header beside the encryption parameters.
- A backup made by a *newer* app than the one restoring must be refused with
  a clear message, not attempted.
- Erasing all data is already built in the persistence layer; restore should
  reuse its path for replacing the database so there is one way the app
  swaps its store.
- The sex column's check constraint must hold in a restored database. A
  corrupt or hand-edited backup with any other value fails validation and is
  not restored.
- The planning record describes an append-only event log; what is built
  overwrites current state. Backup is a snapshot of that state. If the
  storage model is ever revisited, this is the workstream it changes most.
