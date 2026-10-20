# Brief: Backup and restore in Settings (MM-63, MM-64)

## Question
The owner moved backup and restore into the closed beta (2026-10-19): a
tester must be able to keep their data across phones. The section is drawn
in Storybook and built on `feat/m2`; this is its review.

1. **Settings > Backup** (`SettingsBackupNever`, `SettingsBackedUp`): three
   rows in one group under the Data section. "Back up now" (subtitle:
   encrypted on this phone with a passphrase only you know, then saved or
   sent where you choose); "Last backup" with its day or "Never"; "Restore
   from a backup" (replaces everything on this phone; you are asked first).
   A caption: a backup is a file, the app uploads nothing; downloaded food
   databases are not in it.
2. **The passphrase sheet** (`SettingsBackupPassphrase`): for a new backup,
   "Passphrase" and "Passphrase again" (hidden as typed, at least 8
   characters, "The two do not match."), the warning "Only you know it. If
   you lose it, this backup cannot be opened by anyone, including us.",
   Cancel and "Back up". For a restore (`SettingsRestorePassphraseWrong`),
   one field, "Open", and after a wrong one the error under the field "That
   passphrase does not open this backup."
3. **The restore confirmation** (a dialog, `overlays.confirm`, not yet a
   story because the dialog follows an async read): "Restore this backup?"
   with "This backup, made on Oct 12, holds 1 weigh-in, 0 days of food, from
   Oct 11 to Oct 12. Restoring replaces everything on this phone: 1 weigh-in,
   0 days of food, your profile and your settings. It cannot be undone."
   Cancel (the stronger-looking choice, MM-280) and "Restore".
4. Snacks: "Backup saved." / "Backup handed to the app you chose." (Android
   cannot tell) / "Restored. Everything is as it was on that backup." /
   "This file is not a Martian Macros backup."

Does the section match its siblings (the Data section's rows, the Erase
section's danger row and confirmation; rule 9)? Is the passphrase warning
honest and sized right for a novice? Is a destructive restore guarded as the
erase is? Is any state undrawn (busy while sealing, which can take a second;
the confirmation; a cancelled share)? Is "passphrase" the domain's word
against "password"? Anything a screen reader hears wrongly (the hidden
field, the error under it, the dialog)?

## Inputs
- `apps/mobile/src/settings/BackupSection.tsx` (18c2ba888bacf264…), `apps/mobile/src/settings/PassphraseSheet.tsx` (be4dad1a8c4e577e…), `apps/mobile/src/backup/restoreWords.ts` (3b87e18ef414e01d…), `apps/mobile/src/settings/SettingsScreen.tsx` (the placement), `apps/mobile/src/ui/MmTextField.tsx` (the passphrase kind).
- Stories: `apps/mobile/src/gallery/screens/Settings.stories.tsx` (the four `SettingsBackup*` and `SettingsRestore*` stories).
- Tests: `apps/mobile/test/settings/backup.test.tsx`, `test/backup/backupFile.test.ts`, `test/data/restore.test.ts`.
- Requirements: `requirements/persistence/STORY.encrypted-backup-and-restore.MM-63.md`, `requirements/persistence/TASK.backup-storage-providers.MM-64.md`, `requirements/persistence/SPIKE.apple-health-data-and-backup-rules.MM-65.md` (iCloud never named as a destination).
- Direction: `design/screen-direction.md`, `design/anti-cruft-and-anti-slop.md`, `design/voice-and-wording.md`.
- Siblings: the Data and Erase sections in `SettingsScreen.tsx`; `EditHeightSheet.tsx` (the sheet pattern).

## Audit mode, coverage, renders
- Mode: change. Baseline `main` at 39f315c; the working tree of `feat/m2`.
- **Depth targets**, counted from the source: (a) a first backup: Back up now, two passphrase fields, Back up, the snack (1 press, 2 entries, 1 press); (b) a restore with one wrong passphrase: Restore, the picker (the phone's), one field, Open, the error, the field again, Open, the confirmation, Restore, the snack (3 presses, 2 entries, 1 dialog). Everything else surveyed.
- **Render supplied**: the stories, read from source (no browser automation on the owner's Mac in this session). Say so.
- Not reviewed: the cryptography's correctness (tested; the panel's privacy role may be asked separately), the native plugins, the providers (MM-64, not built).

## Existing facts, non-goals, owner decisions
- Owner (MM-63): a snapshot not a sync; encrypted on the device with a key from a passphrase only the user knows; a lost passphrase means the backup cannot be opened, said plainly; the share sheet always available; what a restore replaces shown and confirmed first; the passphrase typed twice; backup is free. iCloud is never named as a destination (MM-65).
- Non-goals: scheduled backups; the keystore-kept key; providers (MM-64, later).

## Acceptance criteria
- MM-63: "Round trip to a new device", "Wrong passphrase", "A tampered file", "Unreadable without the passphrase", "An older backup", "Restore is confirmed".
