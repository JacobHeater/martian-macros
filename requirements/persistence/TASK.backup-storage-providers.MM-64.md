---
id: MM-64
status: proposed
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
