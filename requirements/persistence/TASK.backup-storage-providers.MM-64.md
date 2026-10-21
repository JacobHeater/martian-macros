---
id: MM-64
status: done
component: persistence
related: [MM-59, MM-63, MM-65]
---

# Task: Storage providers for backups

## Context
See MM-63. The product owner asked for common providers.

## Decisions (made with the product owner)
- **Providers**: Google Drive, Dropbox, OneDrive, and WebDAV or S3-compatible storage for people who run their own. Plus the share sheet,
  which needs no provider.
- **Not iCloud** (MM-65).

Choices I made without asking (say if any is wrong):
- **Each provider gets the narrowest permission it offers**: an app-only folder (Google Drive's app data folder, Dropbox's app folder,
  OneDrive's app root), so the app cannot see the user's other files.
- **One small interface** (list backups, upload, download, delete), with a provider per implementation and a fake for tests.
- **Order of building**: share sheet (with MM-63), then Google Drive, then the others as demand shows.
- **Provider tokens are kept in the platform keystore**, and "Disconnect" removes them.

## Description
The provider interface and its implementations, in a `packages/backup` package with the encryption from MM-63.

## Acceptance Criteria
```gherkin
Scenario: The app sees only its own folder
  Given a connected provider
  Then the app can list and read only files it wrote

Scenario: A failed upload
  Given the network drops during an upload
  Then the app reports it, no partial file is left as the latest backup, and the previous backup remains

Scenario: Disconnecting
  When the user disconnects a provider
  Then its token is removed from the device

Scenario: Only ciphertext leaves the device
  Then every byte uploaded to any provider is from the encrypted backup file
```

## Notes
- Each provider needs a developer registration and its own review (Google's OAuth verification in particular). Check whether the app-data
  scopes avoid the heavier "restricted scope" review before committing to an order.

## Milestone
Moved from M3 into M2 on 2026-10-19 by the product owner: the closed beta's testers must be able to keep their data across phones.

## Progress (2026-10-19)
Built with MM-63: the share sheet and the document picker, behind `BackupPlatform` (snapshot, open a copy, save, pick), with a fake for tests and stories. Not built: Google Drive, Dropbox, OneDrive and WebDAV or S3. Each needs a developer registration and the owner's account (Google's OAuth verification in particular), so they wait on the owner; the interface they would implement is `BackupPlatform.save` and a listing to come. Only ciphertext ever leaves the device: `BackupFile.write` seals before `save`.

## Decision by the product owner (2026-10-20): the share sheet is the only way out
- **No connector to any storage service.** Google Drive, Dropbox, OneDrive and WebDAV or S3 are dropped, not deferred. The backup file is
  handed to the operating system's share sheet (iOS) or send chooser (Android), and the person picks where it goes there; a restore opens
  it with the document picker. Whatever storage apps the person has installed are the providers.
- That removes every developer registration, OAuth review and stored provider token this ticket expected, and the network destinations
  the privacy policy would have had to list (MM-95). The acceptance criteria above are met by the platform: the app sees only the file the
  person picks, a failed save leaves the previous backup where it was, there is no token to remove, and only the sealed file is handed on.
- **The format stays `.mmbackup`**, not a password-protected .zip: zip's encryption derives its key cheaply (or is broken outright), and its
  listing of file names is readable without the password, against MM-63's "nothing readable". If a backup ever carries more than the
  database, the sealed part holds them.
- **No export for reading outside the app, and none for other logging apps.** A person sees their data in Martian Macros; portability to
  other providers is not a goal.
