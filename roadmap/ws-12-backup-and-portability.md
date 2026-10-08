# WS-12: Backup and portability

**Order** 12 · **Group** C · **State** not started · **Risk** medium

## Summary
A user-initiated, encrypted snapshot of the user's data that they can restore,
on storage they chose.

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
- Storage providers: Google Drive, Dropbox, OneDrive, WebDAV or S3, and a
  share-sheet export.

## Excluded or deferred
- iCloud as a provider: the founding decision is no, because of the App Store
  guideline on storing health data there. The spike confirms the current
  reading of the rule.
- Automatic or scheduled backup: the design is user-initiated.
- Sync between devices: not a goal. This is a snapshot, not replication.
- Progress photos in a backup: off by default, specified in the photos ticket
  in WS-07.
- The food pack: never included. It is downloadable and large.

## Prerequisites
- **WS-01 (MM-61)** from step 2. Absolute: restore runs migrations on the
  restored file.

Step 1 is research and can start at any time.

## Enables
WS-13: backup is part of what the listing promises, and its platform rules
feed the privacy declarations.

## Packages and surfaces
- `packages/data` (snapshot with `VACUUM INTO`, encryption, restore)
- a backup providers package (new), one adapter per provider
- `apps/mobile` settings: a backup screen
- OAuth configuration for each cloud provider (outside the repository)

## Risks
- **Cryptography is easy to get subtly wrong.** The design names the
  primitives (Argon2id for the key, XChaCha20-Poly1305 for the data). Use a
  maintained library, a versioned file header, and test vectors. A forgotten
  passphrase means an unrecoverable backup; say so plainly in the screen.
- **Restore replaces everything.** It is the most destructive action in the
  app after erase. Confirm it, validate the file fully before touching the
  live database, and keep the old database until the new one opens.
- **Provider sprawl.** Five providers are five OAuth registrations, five
  SDKs or REST clients and five review surfaces. File export through the
  share sheet covers every provider imperfectly and should ship first.
- **Network requests.** Each provider is a destination the privacy policy
  must list. The app otherwise makes almost none.

## Sequence
1. **Platform backup rules spike (MM-65).** M3. It also decides whether the
   app's database must be excluded from the operating system's own device
   backup.
2. **Encrypted backup and restore to a file (MM-63).** M3. Include restoring
   a backup made at an earlier schema version in the tests from the start.
3. **Storage providers (MM-64).** M3. Share-sheet export first, then one
   cloud provider end to end, then the rest.

## Done enough to unblock others
MM-63 is done: a backup written at one schema version restores correctly at a
later one.

## Do not start before this
The release step of WS-13.

## Parallel with
Everything in group C. It touches the schema lane only to read the version.

## Requirement sources
- Remaining: MM-65, MM-63, MM-64. Epic: MM-59.

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
